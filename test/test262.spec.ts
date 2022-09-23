import { expect } from '@playwright/test';
import { test } from './fixture';
import { parseTestDefinition } from './parser';
import { getTestCases, shouldFail } from './tests-config';

interface TestOutput {
    failed: boolean;
    message: string;
    stack: string;
}

test.describe.parallel('test262', () => {
    for (const testCase of getTestCases()) {
        test(testCase, async ({ browserName, page, buildRunnerUrl, runnerPage }) => {
            if (shouldFail(browserName, testCase))
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
            if (testDifinition.spec.negative) {
                test.info().annotations.push({ type: 'reason', description: 'nagative test are not supported yet' });
                test.info().skip();
            }

            let resolve, reject;
            const testPassed = new Promise<TestOutput>((_resolve, _reject) => {
                resolve = _resolve;
                reject = _reject;
            });
            await page.exposeFunction('$DONE', details => {
                resolve();
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
            runnerPage.getTestHtml = () => testDifinition.isModule ?
                `<script type="module" src="./${testCase.split('/').pop()}" onload="$DONE();"></script>` :
                `<script type="application/javascript">${testDifinition.code}; ${testDifinition.isAsync ? '' : '$DONE();'}</script>`;

            const [output]: [TestOutput, any] = await Promise.all([
                Promise.race([
                    testPassed,
                    page.waitForEvent('pageerror').then(error => ({
                        failed: true,
                        message: error.message,
                        stack: error.stack
                    }) as TestOutput)
                ]),
                page.goto(buildRunnerUrl(testCase))
            ]);
            expect(!output?.failed, output?.message + '\nstack:\n' + output?.stack).toBeTruthy();
        });
    }
});