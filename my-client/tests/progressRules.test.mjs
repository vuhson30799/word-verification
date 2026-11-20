import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
const now = Math.floor(Date.now() / 1000);
const token = (uid, claims={}) => [Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url'),
    Buffer.from(JSON.stringify({sub:uid,user_id:uid,aud:'demo-wv-rules',iss:'https://securetoken.google.com/demo-wv-rules',iat:now,exp:now+3600,auth_time:now,firebase:{sign_in_provider:'anonymous'},...claims})).toString('base64url'),''].join('.');
async function request(path, method='GET', body, auth='owner') {
    return fetch(`http://${host}/${path}.json?ns=demo-wv-rules${auth === 'owner' ? '' : '&auth=' + encodeURIComponent(auth)}`, {method, headers:{...(auth === 'owner' ? {Authorization:'Bearer owner'} : {}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
}
const owner = {attemptId:'a1',ownerUid:'student1',examId:'exam1',homeworkId:'hw1',studentId:'s1',studentName:'An',trial:1,beginningAt:'2026-11-20T00:00:00Z',correctAnswers:0,revision:0,status:'inProgress',questionCount:10};
const snapshot = {...owner,questionNumber:1,requestId:'r1',receivedAt:{'.sv':'timestamp'}};
delete snapshot.questionCount;
const teacher = token('teacher',{teacher:true,examId:'exam1',homeworkId:'hw1',accessUntil:Date.now()+3600000});

test('Firebase rules enforce ownership, scope, monotonic revisions and completed-result isolation', {skip:!host}, async () => {
    const rules=JSON.parse(readFileSync(new URL('../firebase/progress.rules.json',import.meta.url),'utf8'));
    assert.equal((await request('.settings/rules','PUT',rules)).status,200);
    await request('','PUT',{attemptOwners:{hw1:{a1:owner}},homeworks:{hw1:{examId:'exam1'}},progressAccess:{student1:{exam1:{hw1:true}}}});
    const signal='progress/exam1/hw1/signal', path='progress/exam1/hw1/snapshots/a1';
    assert.equal((await request(signal,'PUT',{requestId:'r1',requestedAt:{'.sv':'timestamp'}},teacher)).status,200);
    assert.equal((await request(signal,'GET',undefined,token('student1'))).status,200);
    assert.equal((await request(signal,'GET',undefined,token('outsider'))).status,401);
    assert.equal((await request(signal,'PUT',{requestId:'x',requestedAt:{'.sv':'timestamp'}},token('student1'))).status,401);
    assert.equal((await request(signal,'PUT',{requestId:'x',requestedAt:{'.sv':'timestamp'}},token('teacher',{teacher:true,examId:'other',homeworkId:'hw1',accessUntil:Date.now()+10000}))).status,401);
    assert.equal((await request(path,'PUT',snapshot,token('student1'))).status,200);
    assert.equal((await request(path,'PUT',snapshot,token('student2'))).status,401);
    assert.equal((await request(path,'PUT',{...snapshot,studentName:'Someone else'},token('student1'))).status,401);
    assert.equal((await request(path,'PUT',{...snapshot,revision:1,correctAnswers:11},token('student1'))).status,401);
    assert.equal((await request(path,'PUT',{...snapshot,revision:2,correctAnswers:1},token('student1'))).status,200);
    assert.equal((await request(path,'PUT',snapshot,token('student1'))).status,401);
    assert.equal((await request(path,'PUT',{...snapshot,revision:2,correctAnswers:2},token('student1'))).status,401);
    assert.equal((await request(path,'DELETE',undefined,token('student1'))).status,401);
    assert.equal((await request('completedAttempts/hw1/a1','PUT',owner,token('student1'))).status,401);
    await request('completedAttempts/hw1/a1','PUT',{...owner,status:'completed'});
    assert.equal((await request(path,'PUT',{...snapshot,revision:3,correctAnswers:2},token('student1'))).status,401);
    assert.equal((await request('progress/exam1/hw1/snapshots','GET',undefined,teacher)).status,200);
    assert.equal((await request('progress/exam1/hw1/snapshots','GET',undefined,token('student1'))).status,401);
    await request('','PUT',null);
});
