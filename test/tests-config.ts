import * as test262 from '../resources/test262.json';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

const ignoreTests: Record<BrowserName, Set<string>> = {
    chromium: new Set([
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR.js',
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR-LF.js',
        'test/built-ins/Function/prototype/toString/built-in-function-object.js'
    ]),
    firefox: new Set([
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR.js',
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR-LF.js', // TODO - fix this
        'test/built-ins/Function/prototype/toString/built-in-function-object.js',
        'test/built-ins/Function/prototype/restricted-property-caller.js',
        'test/built-ins/Function/prototype/restricted-property-arguments.js'
    ]),
    webkit: new Set([
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR.js',
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR-LF.js',
        'test/built-ins/Function/prototype/toString/built-in-function-object.js'
    ])
};

const includeTests = [
    'test/built-ins/Function/prototype/'
];

export function getTestCases() {
    return Object.keys(test262)
        .filter(test => includeTests.some(includeTest => test.startsWith(includeTest)));
}

export function shouldFail(browserName: BrowserName, testCase: string) {
    return ignoreTests[browserName].has(testCase);
}