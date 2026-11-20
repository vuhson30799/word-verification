import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import ts from 'typescript';

export function loadModule(path, mocks = {}, cache = new Map()) {
    path = resolve(path);
    if (cache.has(path)) return cache.get(path).exports;
    const compiled = {exports: {}};
    cache.set(path, compiled);
    const code = ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true}}).outputText;
    function localRequire(name) {
        for (const [suffix, mock] of Object.entries(mocks)) if (name === suffix || name.endsWith(suffix)) return mock;
        if (name.startsWith('.')) return loadModule(resolve(dirname(path), `${name}.ts`), mocks, cache);
        return createRequire(path)(name);
    }
    new Function('require', 'module', 'exports', code)(localRequire, compiled, compiled.exports);
    return compiled.exports;
}
export function response() {
    return {code: 0, body: null, sent: 0, headers: {}, setHeader(key, value) {this.headers[key] = value},
        status(code) {this.code = code; return this}, json(body) {this.body = body; this.sent++; return this}};
}
