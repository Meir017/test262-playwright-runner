import * as test262 from '../resources/test262.json';
import * as YAML from 'yaml';

interface TestSpec {
    es6id?: string;
    esid?: string;
    description: string;
    info: string;
    includes: string[];
    features: string[];
    flags: string[];
    negative?: {
        phase: string;
        type: string;
    };
}

export function parseTestDefinition(testCase: string) {
    const testDifinition = test262[testCase] as string;

    const specStart = '/*---';
    const specEnd = '---*/';
    const startOfCode = testDifinition.indexOf(specEnd) + specEnd.length;
    const testSpec = testDifinition.substring(testDifinition.indexOf(specStart) + specStart.length, testDifinition.indexOf(specEnd));
    const spec: TestSpec = YAML.parse(testSpec);

    let code = testDifinition.substring(startOfCode);

    if (spec.flags?.includes('onlyStrict')) {
        code = `'use strict';` + code;
    }

    const isModule = spec.flags?.includes('module');
    const isAsync = spec.flags?.includes('async');
    const isRaw = spec.flags?.includes('raw');

    const dependencies = [...(isRaw ? [] : ['assert.js', 'sta.js']), ...(spec.includes || [])]

    return {
        raw: testDifinition,
        harness: dependencies.map(dependency => `<script id="harness/${dependency}">${test262['harness/' + dependency]}</script>`),
        rawCode: testDifinition.substring(startOfCode),
        code,
        spec,
        isModule,
        isAsync,
        isRaw,
    }
}