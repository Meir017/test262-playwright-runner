

import { test as testBase } from '@playwright/test';
import * as test262 from '../resources/test262.json';

interface RunnerPageFunctions {
    getSetupScript(): string;
    getHarnessScripts(): string[];
    getTestHtml(): string;
}

interface TestFixture {
    domain: string;
    buildRunnerUrl: (testCase: string) => string;
    runnerPage: RunnerPageFunctions;
}

const testRunnerInMemoryDomain = '';

function notImplemented<T>(name: string): () => T {
    return () => {
        throw new Error(`Not implemented: ${name}`);
    };
}

export const test = testBase.extend<TestFixture>({
    domain: 'playwright.test262.runner',

    buildRunnerUrl: async ({ domain }, use) => use(testCase => {
        const testPath = testCase.split('/');
        const testName = testPath.pop();
        return `https://${domain}/SYNTHETIC/${testPath.join('/')}/test262.html`;
    }), // SYNTHETIC/test/language/module-code/blank.html
    runnerPage: async ({ }, use) => {
        await use({
            getSetupScript: notImplemented('getSetupScript'),
            getHarnessScripts: notImplemented('getHarnessScripts'),
            getTestHtml: notImplemented('getTestHtml'),
        });
    },
    contextOptions: async ({ contextOptions }, use) => {
        contextOptions.ignoreHTTPSErrors = true;
        await use(contextOptions);
    },
    context: async ({ context, runnerPage }, use) => {
        await context.route(x => x.href.endsWith('test262.html'), route => route.fulfill({
            body: `<!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Playwright test262 Runner</title>
                ${runnerPage.getSetupScript()}
                ${runnerPage.getHarnessScripts().join('\n')}
            </head>
            <body>
                ${runnerPage.getTestHtml()}
            </body>
            </html>`,
            contentType: 'text/html',
        }));
        await context.route(/test\/.*\.js/, async (route, request) => {
            const requestUri = new URL(request.url());
            const testPath = requestUri.pathname.substring(requestUri.pathname.indexOf('SYNTHETIC/') + 'SYNTHETIC/'.length);
            await route.fulfill({
                body: test262[testPath],
                contentType: 'application/javascript',
                status: 200,
            });
        });
        await use(context);
    },
    launchOptions: async ({ launchOptions }, use) => {
        if (process.env.DEBUG) {
            launchOptions.headless = false;
        }
        await use(launchOptions);
    }
});