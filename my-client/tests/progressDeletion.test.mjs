import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModule} from './loadModule.mjs';

test('homework and exam deletion atomically remove new results, owner metadata, snapshots, grants and legacy answers',async()=>{
 let changes;
 const records={'homeworks/hw1':{examId:'exam1'},'attemptOwners/hw1':{a1:{ownerUid:'u1'}}};
 const {deleteStudentData}=loadModule('modules/progress/deletion.ts',{
  'firebase/database':{ref:(_db,path)=>path,query:path=>path,equalTo:()=>{},orderByChild:()=>{},get:async path=>({val:()=>path==='/answers'?{old:{examId:'exam1',homeworkId:'hw1'},other:{examId:'exam1',homeworkId:'hw2'}}:{hw1:{examId:'exam1'}}})},
  '/firebase/FirebaseService':{database:{}},
  '/firebase/server':{HttpError:class extends Error {constructor(status,message){super(message);this.status=status}},serverGet:async path=>records[path]??null,
   serverRequest:async(path,init)=>{assert.equal(path,'');assert.equal(init.method,'PATCH');changes=JSON.parse(init.body)}}
 });
 await deleteStudentData('exam1','hw1');
 for(const path of ['homeworks/hw1','completedAttempts/hw1','attemptOwners/hw1','progress/exam1/hw1','progressAccess/u1/exam1/hw1','answers/old'])assert.equal(changes[path],null);
 assert.equal(changes['answers/other'],undefined);assert.equal(changes['examinations/exam1'],undefined);
 await deleteStudentData('exam1');assert.equal(changes['examinations/exam1'],null);assert.equal(changes['answers/other'],null);
 assert.equal(changes['progress/exam1'],null);
 assert.equal(changes['progress/exam1/hw1'],undefined);
 assert.equal(changes['progressAccess/u1/exam1/hw1'],null);
 await assert.rejects(()=>deleteStudentData('../bad'),e=>e.status===400);
 await assert.rejects(()=>deleteStudentData('other','hw1'),e=>e.status===404);
});
