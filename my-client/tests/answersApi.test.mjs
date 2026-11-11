import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'

function loadHandler(push) {
    const source = readFileSync(new URL('../pages/api/answers.ts', import.meta.url), 'utf8')
    const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText
    const compiled = {exports: {}}
    const requireMock = name => {
        if (name === 'firebase/database') return {push, ref: (_database, path) => path}
        if (name.endsWith('/firebase/FirebaseService')) return {database: {}}
        throw new Error(`Unexpected import: ${name}`)
    }
    new Function('require', 'module', 'exports', code)(requireMock, compiled, compiled.exports)
    return compiled.exports.default
}

function response() {
    return {code: 0, body: null, sent: 0,
        status(code) {this.code = code; return this},
        json(body) {this.body = body; this.sent++; return this}}
}

const request = {method: 'POST', body: JSON.stringify({examId: 'exam1', homeworkId: 'hw1', studentName: 'Student', correctAnswers: 2, trial: 1})}

test('answers handler stays pending until the database write sends its response', async () => {
    let completeWrite
    const pendingWrite = new Promise(resolve => {completeWrite = resolve})
    const handler = loadHandler((path, answer) => {
        assert.equal(path, '/answers')
        assert.equal(answer.studentName, 'Student')
        return pendingWrite
    })
    const res = response()
    let resolved = false
    const pendingRequest = Promise.resolve(handler(request, res)).then(() => {resolved = true})
    await Promise.resolve()
    assert.equal(resolved, false, 'handler must not resolve before writing the response')
    assert.equal(res.sent, 0)
    completeWrite()
    await pendingRequest
    assert.equal(res.code, 200)
    assert.equal(res.sent, 1)
    assert.equal(res.body.success, 'Your answer has been recorded.')
})

test('database rejection sends one failure response before the handler resolves', async () => {
    const handler = loadHandler(() => Promise.reject(new Error('Database unavailable')))
    const res = response()
    await handler(request, res)
    assert.equal(res.code, 400)
    assert.equal(res.sent, 1)
    assert.ok(res.body.message)
})

test('unsupported methods respond without writing to the database', async () => {
    const handler = loadHandler(() => {throw new Error('Unexpected database write')})
    const res = response()
    await handler({method: 'GET'}, res)
    assert.equal(res.code, 405)
    assert.equal(res.sent, 1)
})
