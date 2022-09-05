import { expect } from '@playwright/test';
import * as test262 from '../resources/test262.json';
import { test, testList, ignoreTests } from './fixture';
import * as YAML from 'yaml';

interface TestOutput {
    passed: boolean;
    message: string;
    stack: string;
}

interface TestSpec {
    es6id?: string;
    esid?: string;
    description: string;
    info: string;
    includes: string[];
    features: string[];
    flags: string[];
}

test.describe.parallel('test262', () => {

    for (const testCase of testList) {
        test(testCase, async ({ page, runnerUrl, runnerPage }) => {
            if (ignoreTests.has(testCase))
                test.fail();

            const testDifinition = parseTestDefinition(testCase);
            test.info().annotations.push({ type: 'description', description: testDifinition.spec.description });
            if (testDifinition.spec.es6id || testDifinition.spec.esid)
                test.info().annotations.push({ type: 'esid', description: testDifinition.spec.es6id || testDifinition.spec.esid });
            if (testDifinition.spec.includes)
                test.info().annotations.push({ type: 'includes', description: `[${testDifinition.spec.includes.join(',')}]` });
            if (testDifinition.spec.features)
                test.info().annotations.push({ type: 'features', description: `[${testDifinition.spec.features.join(',')}]` });
            if (testDifinition.spec.flags)
                test.info().annotations.push({ type: 'flags', description: `[${testDifinition.spec.flags.join(',')}]` });

            test.info().annotations.push({ type: 'code', description: testDifinition.code });

            let resolve, reject;
            const testPassed = new Promise<TestOutput>((_resolve, _reject) => {
                resolve = _resolve;
                reject = _reject;
            });
            await page.exposeFunction('done', details => {
                resolve(details);
            });
            await page.addInitScript(() => {
                (function () {
                    // taken from https://github.com/bakkot/test262-web-runner/blob/f7e97869c5341f5f6e115c164ed33952ce549146/main.js#L108-L137
                    function installAPI(global) {
                        return global.$262 = {
                            createRealm() {
                                const iframe = global.document.createElement('iframe');
                                global.document.body.appendChild(iframe);
                                // TODO: can we remove this due to the addInitScript playwright hook?
                                return installAPI(iframe.contentWindow);
                            },
                            evalScript(src) {
                                const script = global.document.createElement('script');
                                script.text = src;
                                global.document.body.appendChild(script);
                            },
                            detachArrayBuffer(buffer) {
                                if (typeof postMessage !== 'function') {
                                    throw new Error('No method available to detach an ArrayBuffer');
                                } else {
                                    postMessage(null, '*', [buffer]);
                                    /*
                                      See https://html.spec.whatwg.org/multipage/comms.html#dom-window-postmessage
                                      which calls https://html.spec.whatwg.org/multipage/infrastructure.html#structuredclonewithtransfer
                                      which calls https://html.spec.whatwg.org/multipage/infrastructure.html#transfer-abstract-op
                                      which calls the DetachArrayBuffer abstract operation https://tc39.github.io/ecma262/#sec-detacharraybuffer
                                    */
                                }
                            },
                            global,
                            IsHTMLDDA: global.document.all
                        };
                    }

                    installAPI(globalThis);
                })()
            });

            runnerPage.getSetupScript = () => ``;
            runnerPage.getHarnessScripts = () => testDifinition.harness;
            runnerPage.getTestHtml = () => `
            <script>${testDifinition.code}</script>
            <script>done({ passed: true });</script>`;

            const [output]: [TestOutput, any] = await Promise.all([
                Promise.race([
                    testPassed,
                    page.waitForEvent('pageerror').then(error => ({
                        passed: false,
                        message: error.message,
                        stack: error.stack
                    }) as TestOutput)
                ]),
                page.goto(runnerUrl)
            ]);
            expect(output.passed, output.message + '\nstack:\n' + output.stack).toBeTruthy();
        });
    }
});

function parseTestDefinition(testCase) {
    const testDifinition = test262[testCase] as string;

    const specStart = '/*---';
    const specEnd = '---*/';
    const startOfCode = testDifinition.indexOf(specEnd) + specEnd.length;
    const testSpec = testDifinition.substring(testDifinition.indexOf(specStart) + specStart.length, testDifinition.indexOf(specEnd));
    const spec: TestSpec = YAML.parse(testSpec);

    const dependencies = ['assert.js', 'sta.js', ...(spec.includes || [])]

    let code = testDifinition.substring(startOfCode);

    if (spec.flags?.includes('onlyStrict')) {
        code = `'use strict';` + code;
    }

    return {
        raw: testDifinition,
        harness: dependencies.map(dependency => `<script id="harness/${dependency}">${test262['harness/' + dependency]}</script>`),
        rawCode: testDifinition.substring(startOfCode),
        code,
        spec
    }
}