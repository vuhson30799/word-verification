import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const start = '2026-01-01T08:00:00'
const end = '2099-01-08T23:59:00'
const queryParams = {examId:'exam1',beginningDate:start,deadlineDate:end}

async function request({query=queryParams, expired=false, missingExam=false, fail=false, method='GET'} = {}) {
    const records = {
        '/homeworks':{hw1:{examId:'exam1',beginningDate:start,deadlineDate:expired?'2000-01-08T23:59:00':end}},
        '/examinations/exam1':missingExam?null:{title:'Homework',maximumIncorrectAnswers:1,questions:[{title:'Test',keys:['Answer'],timeout:30,questionType:'text'}],grade:10,createdDate:start,creator:'Teacher'}
    }
    const cache = new Map()
    const calls = []
    function load(path) {
        if (cache.has(path)) return cache.get(path).exports
        const compiled = {exports:{}}
        cache.set(path,compiled)
        const code = ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
        function requireMock(name) {
            if (name === 'firebase/database') return {
                ref:(_db,path)=>path, query:path=>path, orderByChild:()=>{}, equalTo:()=>{},
                get:async path=>{calls.push(path);if(fail)throw new Error('Database unavailable');return {val:()=>records[path]}}
            }
            if (name.endsWith('/firebase/FirebaseService')) return {database:{}}
            if (name.startsWith('.')) return load(resolve(dirname(path),`${name}.ts`))
            return createRequire(path)(name)
        }
        new Function('require','module','exports',code)(requireMock,compiled,compiled.exports)
        return compiled.exports
    }
    const handler = load(resolve(project,'pages/api/join.ts')).default
    const res = {code:0,body:null,sent:0,status(code){this.code=code;return this},json(body){this.body=body;this.sent++;return this}}
    await handler({method,query,headers:{}},res)
    assert.equal(res.sent,1)
    return {...res,calls}
}

test('public join API loads homework without a cookie or referer and encodes answer keys', async()=>{
    const res=await request()
    assert.equal(res.code,200)
    assert.equal(res.body.homeworkId,'hw1')
    assert.equal(res.body.examination.id,'exam1')
    assert.notEqual(res.body.examination.questions[0].keys[0],'Answer')
    assert.equal(res.body.examination.maximumIncorrectAnswers,1)
    assert.deepEqual(res.calls,['/homeworks','/examinations/exam1'])
})

test('encoded homework links work without authentication',async()=>{
    const q=Buffer.from(`exam1|${start}|${end}`).toString('base64')
    assert.equal((await request({query:{q}})).code,200)
})

test('expired, unmatched and malformed links are rejected',async()=>{
    assert.equal((await request({expired:true,query:{...queryParams,deadlineDate:'2000-01-08T23:59:00'}})).code,400)
    assert.equal((await request({query:{...queryParams,beginningDate:'wrong'}})).code,400)
    assert.equal((await request({query:{q:'invalid'}})).code,400)
    assert.equal((await request({query:{...queryParams,examId:'invalid/path'}})).code,400)
})

test('missing exams, database failures and unsupported methods return responses',async()=>{
    assert.equal((await request({missingExam:true})).code,404)
    assert.equal((await request({fail:true})).code,500)
    assert.equal((await request({method:'POST'})).code,405)
})
