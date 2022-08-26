import { expect } from '@playwright/test';
import * as test262 from '../resources/test262.json';
import { test, testList } from './fixture';
import * as YAML from 'yaml';

interface TestOutput {
    passed: boolean;
    message: string;
    stack: string;
}

interface TestSpec {
    es6id: string;
    description: string;
    info: string;
    includes: string[];
}

test.describe.parallel('test262', () => {

    for (const testCase of testList) {
        test(testCase, async ({ page, runnerUrl, runnerPage }) => {
            const testDifinition = parseTestDefinition(testCase);
            runnerPage.getHarnessScripts = () => testDifinition.harness;
            runnerPage.getTestHtml = () => `
            <script>${testDifinition.code}</script>
            <script>console.info('test-262-output', { passed: true });</script>`;

            const [output]: [TestOutput, any] = await Promise.all([
                Promise.race([
                    page.waitForEvent('console', {
                        predicate: message => message.text().startsWith('test-262-output'),
                        timeout: 2500
                    }).then(message => message.args()[1].jsonValue()),
                    page.waitForEvent('pageerror').then(error => ({
                        passed: false,
                        message: error.message,
                        stack: error.stack
                    }))
                ]),
                page.goto(runnerUrl)
            ]);
            expect(output.passed, output.message + '\nstack:\n' + output.stack).toBeTruthy();
        });
    }
});

function parseTestDefinition(testCase) {
    const testDifinition = test262[testCase];

    const specStart = '/*---';
    const specEnd = '---*/';
    const startOfCode = testDifinition.indexOf(specEnd) + specEnd.length;
    const testSpec = testDifinition.substring(testDifinition.indexOf(specStart) + specStart.length, testDifinition.indexOf(specEnd));
    const spec: TestSpec = YAML.parse(testSpec);

    const dependencies = ['assert.js', ...(spec.includes || [])]

    return {
        harness: dependencies.map(dependency => `<script id="harness/${dependency}">${test262['harness/' + dependency]}</script>`),
        code: testDifinition.substring(startOfCode)
    }
}