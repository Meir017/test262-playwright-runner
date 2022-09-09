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
        'test/built-ins/Function/prototype/toString/AsyncFunction.js',
        'test/built-ins/Function/prototype/toString/AsyncGenerator.js',
        'test/built-ins/Function/prototype/toString/Function.js',
        'test/built-ins/Function/prototype/toString/GeneratorFunction.js',
        'test/built-ins/Function/prototype/toString/async-arrow-function.js',
        'test/built-ins/Function/prototype/toString/async-function-declaration.js',
        'test/built-ins/Function/prototype/toString/async-function-expression.js',
        'test/built-ins/Function/prototype/toString/async-generator-declaration.js',
        'test/built-ins/Function/prototype/toString/async-generator-expression.js',
        'test/built-ins/Function/prototype/toString/async-generator-method-class-expression-static.js',
        'test/built-ins/Function/prototype/toString/async-generator-method-class-expression.js',
        'test/built-ins/Function/prototype/toString/async-generator-method-class-statement-static.js',
        'test/built-ins/Function/prototype/toString/async-generator-method-class-statement.js',
        'test/built-ins/Function/prototype/toString/async-generator-method-object.js',
        'test/built-ins/Function/prototype/toString/async-method-class-expression-static.js',
        'test/built-ins/Function/prototype/toString/async-method-class-expression.js',
        'test/built-ins/Function/prototype/toString/async-method-class-statement-static.js',
        'test/built-ins/Function/prototype/toString/async-method-class-statement.js',
        'test/built-ins/Function/prototype/toString/async-method-object.js',
        'test/built-ins/Function/prototype/toString/function-declaration-non-simple-parameter-list.js',
        'test/built-ins/Function/prototype/toString/function-declaration.js',
        'test/built-ins/Function/prototype/toString/function-expression.js',
        'test/built-ins/Function/prototype/toString/generator-function-declaration.js',
        'test/built-ins/Function/prototype/toString/generator-function-expression.js',
        'test/built-ins/Function/prototype/toString/generator-method.js',
        'test/built-ins/Function/prototype/toString/getter-class-expression-static.js',
        'test/built-ins/Function/prototype/toString/getter-class-expression.js',
        'test/built-ins/Function/prototype/toString/getter-class-statement-static.js',
        'test/built-ins/Function/prototype/toString/getter-class-statement.js',
        'test/built-ins/Function/prototype/toString/getter-object.js',
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR-LF.js',
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-CR.js',
        'test/built-ins/Function/prototype/toString/line-terminator-normalisation-LF.js',
        'test/built-ins/Function/prototype/toString/method-class-expression-static.js',
        'test/built-ins/Function/prototype/toString/method-class-expression.js',
        'test/built-ins/Function/prototype/toString/method-class-statement-static.js',
        'test/built-ins/Function/prototype/toString/method-class-statement.js',
        'test/built-ins/Function/prototype/toString/method-computed-property-name.js',
        'test/built-ins/Function/prototype/toString/method-object.js',
        'test/built-ins/Function/prototype/toString/setter-class-expression-static.js',
        'test/built-ins/Function/prototype/toString/setter-class-expression.js',
        'test/built-ins/Function/prototype/toString/setter-class-statement-static.js',
        'test/built-ins/Function/prototype/toString/setter-class-statement.js',
        'test/built-ins/Function/prototype/toString/setter-object.js',
        'test/built-ins/Function/prototype/toString/unicode.js',
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