import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModule, response} from './loadModule.mjs';

const base = {attemptId:'attempt1', ownerUid:'uid1', examId:'exam1', homeworkId:'hw1', studentName:'Student', correctAnswers:2, trial:1,
    revision:3, status:'completed', beginningAt:'2026-11-20T08:00:00Z', finishAt:'2026-11-20T08:02:00Z'};
class HttpError extends Error {constructor(status, message) {super(message); this.status=status}}
function setup(options={}) {
    const records = new Map();
    const server = {HttpError, requestBody: value => typeof value === 'string' ? JSON.parse(value) : value,
        verifyStudentToken: async token => {if (token !== 'valid') throw new HttpError(401, 'Invalid token'); return options.uid ?? 'uid1'},
        apiError: error => ({status:error.status ?? 503, message:error.message}),
        serverGet: async path => {
            if (path.startsWith('attemptOwners/')) return options.registered === null ? null : {...base, ...options.registered};
            if (path.startsWith('homeworks/')) return {examId:'exam1'};
            if (path.startsWith('examinations/')) return {questions:[{keys:['a']},{keys:['b']}]};
        },
        createOnce: async (path, result) => {
            if (options.wait) await options.wait;
            if (options.fail) throw new Error('Unavailable');
            if (!records.has(path)) records.set(path, result);
            return records.get(path);
        }};
    const handler = loadModule('pages/api/answers.ts', {'/firebase/server':server}).default;
    return {records, call: async (result=base, overrides={}) => {
        const res=response(); await handler({method:'POST', body:{idToken:'valid', result}, ...overrides},res);
        assert.equal(res.sent,1); return res;
    }};
}

test('final submission waits for its write and persists one allow-listed completed record', async () => {
    let release; const wait=new Promise(resolve=>{release=resolve});
    const app=setup({wait}); let done=false;
    const pending=app.call({...base, questionNumber:2, injected:'ignore'}).then(res=>{done=true; return res});
    await new Promise(resolve=>setImmediate(resolve)); assert.equal(done,false);
    release(); const res=await pending; assert.equal(res.code,200);
    const stored=app.records.get('completedAttempts/hw1/attempt1');
    assert.equal(stored.questionNumber,undefined); assert.equal(stored.injected,undefined);
});
test('duplicate and concurrent submissions reuse the attempt; conflicting scores are rejected', async () => {
    const app=setup();
    const values=await Promise.all([app.call(),app.call()]);
    assert.ok(values.every(res=>res.code===200)); assert.equal(app.records.size,1);
    assert.equal((await app.call({...base,correctAnswers:1})).code,409);
    assert.equal(app.records.values().next().value.correctAnswers,2);
});
test('ownership, completion, score bounds, and metadata are validated before writes', async () => {
    for (const patch of [{status:'interrupted'},{correctAnswers:3},{correctAnswers:-1},{correctAnswers:1.5},{revision:0},{finishAt:'bad'},{studentName:''},{homeworkId:'../bad'}]) {
        const app=setup(); assert.equal((await app.call({...base,...patch})).code,400); assert.equal(app.records.size,0);
    }
    assert.equal((await setup({uid:'other'}).call()).code,400);
    assert.equal((await setup({registered:null}).call()).code,403);
    assert.equal((await setup({registered:{studentName:'Other'}}).call()).code,403);
});
test('authentication and unsupported methods cannot write; transient failures are retryable', async () => {
    const app=setup();
    assert.equal((await app.call(base,{method:'GET'})).code,405);
    assert.equal((await app.call(base,{body:{idToken:'invalid',result:base}})).code,401);
    assert.equal((await setup({fail:true}).call()).code,503);
});
