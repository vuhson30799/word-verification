import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import * as passing from '../modules/utils/examinationPassing.ts'

function route() {
    const writes = []
    const module = {exports: {}}
    const code = ts.transpileModule(readFileSync(new URL('../pages/api/exams.ts', import.meta.url), 'utf8'), {
        compilerOptions: {module: ts.ModuleKind.CommonJS}
    }).outputText
    new Function('require', 'module', 'exports', code)(name => {
        if (name === 'firebase/database') return {ref: () => 'examinations', push: (_ref, value) => writes.push(value)}
        if (name.endsWith('/FirebaseService')) return {database: {}}
        if (name.endsWith('/requireAuth')) return {requireRole: () => true}
        if (name.endsWith('/examinationPassing')) return passing
        if (name.endsWith('/dataUtils')) return {}
        throw new Error(name)
    }, module, module.exports)
    return {handler: module.exports.default, writes}
}

const exam = () => ({title: 'Exam', grade: 10, creator: 'Teacher', createdDate: '2026-11-16', questions: Array(29).fill({keys: ['answer']})})
function request(handler, body) {
    const res = {statusCode: 0, status(code) {this.statusCode = code; return this}, json(body) {this.body = body}, send(body) {this.body = body}}
    handler({method: 'POST', body: JSON.stringify(body)}, res)
    return res
}

test('creation persists the configured maximum and defaults omitted values with floor rounding', () => {
    const {handler, writes} = route()
    assert.equal(request(handler, {...exam(), maximumIncorrectAnswers: 18}).statusCode, 200)
    assert.equal(writes[0].maximumIncorrectAnswers, 18)
    assert.equal(request(handler, exam()).statusCode, 200)
    assert.equal(writes[1].maximumIncorrectAnswers, 2)
    assert.equal(request(handler, {...exam(), maximumIncorrectAnswers: 0}).statusCode, 200)
    assert.equal(writes[2].maximumIncorrectAnswers, 0)
})

test('creation rejects invalid thresholds before writing', () => {
    const {handler, writes} = route()
    for (const maximumIncorrectAnswers of [-1, 30, 2.5, null, '2']) {
        assert.equal(request(handler, {...exam(), maximumIncorrectAnswers}).statusCode, 400)
    }
    assert.equal(writes.length, 0)
})
