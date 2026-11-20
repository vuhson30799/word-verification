import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModule} from './loadModule.mjs';

test('student listener ignores old and duplicate signals, persists locally, and sends monotonic snapshots',async()=>{
 let callback,stored=null,unsubscribed=false,offline=false;
 const order=[];
 const {listenForRefresh}=loadModule('modules/progress/client.ts',{
  'firebase/app':{getApps:()=>[],initializeApp:()=>({})},'firebase/auth':{},'/firebase/FirebaseService':{firebaseConfig:{}},
  './storage':{persistAttempt:async()=>{order.push('local')}},
  'firebase/database':{getDatabase:()=>({}),goOnline:()=>{},goOffline:()=>{offline=true},ref:(_db,path)=>path,serverTimestamp:()=>123,
   onValue:(_ref,cb)=>{callback=cb;return()=>{unsubscribed=true}},
   runTransaction:async(path,update)=>{order.push('server');const next=update(stored);if(next)stored=next}}
 });
 const latest={result:{attemptId:'a1',revision:2,status:'inProgress'},index:1};
 const stop=listenForRefresh('exam1','hw1',()=>latest,error=>assert.fail(error));
 const signal=id=>callback({val:()=>id?{requestId:id}:null});
 signal('old');signal('old');assert.equal(stored,null);
 signal('r1');await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(order,['local','server']);assert.equal(stored.questionNumber,2);assert.equal(stored.requestId,'r1');
 signal('r1');assert.equal(order.length,2);
 signal('r2');await new Promise(resolve=>setImmediate(resolve));
 signal('r1');assert.equal(order.length,4,'nonconsecutive duplicate signal is ignored');
 stored={...stored,revision:10};signal('r3');await new Promise(resolve=>setImmediate(resolve));assert.equal(stored.revision,10);
 stop();assert.equal(unsubscribed,true);assert.equal(offline,true);
});
test('polling settings default to off and reject unsupported persisted values',()=>{
 const {pollingInterval}=loadModule('modules/progress/types.ts');
 for(const value of [null,'invalid','15000','-1','Infinity','60000'])assert.equal(pollingInterval(value),0);
 for(const value of ['0','300000','600000'])assert.equal(pollingInterval(value),Number(value));
});
test('live progress preserves best score and cannot regress newer authoritative activity',()=>{
 const {applySnapshots}=loadModule('modules/progress/results.ts');
 const row={id:'s1',name:'An',phone:'',parentPhone:'',facebook:'',status:'finished',score:8,questionNumber:null,joinedAt:null,finishedAt:'2026-11-20T01:00:00Z',location:null,currentAttemptId:'new',currentRevision:5,currentBeginningAt:'2026-11-20T00:00:00Z',currentScore:4,currentStatus:'completed'};
 const data={rows:[row],summary:{finished:1,inProgress:0,notJoined:0,averageScore:8}};
 const snapshots=[{studentId:'s1',studentName:'An',attemptId:'new',correctAnswers:2,questionNumber:3,revision:3,beginningAt:row.currentBeginningAt,requestId:'r1',receivedAt:123,status:'inProgress'}];
 const result=applySnapshots(data,snapshots);
 assert.equal(result.rows[0].score,8);assert.equal(result.rows[0].currentScore,4);assert.equal(result.rows[0].refreshRequestId,'r1');
 const extra=applySnapshots(data,[{...snapshots[0],studentId:'s2',studentName:'Other'}]);
 assert.equal(extra.rows.length,2);assert.equal(extra.summary.inProgress,1);assert.equal(extra.summary.averageScore,8);
});
