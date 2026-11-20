import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModule,response} from './loadModule.mjs';

test('legacy answer search reads new completed attempts alongside historical answers',async()=>{
 const base={examId:'exam1',homeworkId:'hw1',studentName:'An',correctAnswers:2,trial:1,finishAt:'2026-11-20T00:00:00Z'};
 const handler=loadModule('pages/api/answers/search.ts',{
  'firebase/database':{ref:()=>'/answers',query:path=>path,orderByChild:()=>{},equalTo:()=>{},get:async()=>({val:()=>({legacy:base,other:{...base,homeworkId:'other'}})})},
  '/firebase/FirebaseService':{database:{}},'/auth/requireAuth':{requireRole:()=>({role:'admin'})},
  '/firebase/server':{requestBody:b=>b,apiError:e=>({status:503,message:e.message}),serverGet:async path=>path.startsWith('completedAttempts')?{new:{...base,attemptId:'new',correctAnswers:1,status:'completed'}}:null}
 }).default;
 const res=response();await handler({method:'POST',body:{examinationId:'exam1',homeworkId:'hw1'}},res);
 assert.equal(res.code,200);assert.equal(res.body.length,2);assert.equal(res.body[1].attemptId,'new');
 const invalid=response();await handler({method:'POST',body:{examinationId:'../bad',homeworkId:'hw1'}},invalid);assert.equal(invalid.code,400);
});
