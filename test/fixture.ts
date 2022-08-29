

import { test as testBase } from '@playwright/test';
import * as test262 from '../resources/test262.json';

interface RunnerPageFunctions {
    getSetupScript(): string;
    getHarnessScripts(): string[];
    getTestHtml(): string;
}

interface TestFixture {
    runnerUrl: string;
    runnerPage: RunnerPageFunctions;
}

const testRunnerInMemoryDomain = 'playwright.test262.runner';
const runnerUrl = `https://${testRunnerInMemoryDomain}/test262.html`;

function notImplemented<T>(name: string): () => T {
    return () => {
        throw new Error(`Not implemented: ${name}`);
    };
}

export const testList = Object.keys(test262).filter(test => test.startsWith('test/built-ins/Function/length'));
export const test = testBase.extend<TestFixture>({
    runnerUrl: async ({ }, use) => use(runnerUrl),
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
    context: async ({ context, runnerUrl, runnerPage }, use) => {
        await context.route(runnerUrl, route => route.fulfill({
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
            await route.fulfill({
                body: test262[requestUri.pathname],
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