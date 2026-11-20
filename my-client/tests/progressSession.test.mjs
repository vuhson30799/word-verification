import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModule,response} from './loadModule.mjs';
const attempt={attemptId:'a1',ownerUid:'u1',examId:'exam1',homeworkId:'hw1',studentId:'s1',studentName:'An',correctAnswers:0,trial:1,revision:0,status:'inProgress',beginningAt:'2026-11-20T00:00:00Z'};
const link={examId:'exam1',beginningDate:'2026-11-19',deadlineDate:'2099-01-01'};
class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
function setup(overrides={}){
 const records={'homeworks/hw1':{examId:'exam1',studentIds:['s1'],beginningDate:link.beginningDate,deadlineDate:link.deadlineDate},'examinations/exam1':{questions:[{keys:['a']}]},'students/s1':{name:'An'},...overrides};
 const tokens=[];
 const handler=loadModule('pages/api/progress/session.ts',{
  '/firebase/server':{HttpError,requestBody:b=>b,verifyStudentToken:async token=>{if(token!=='valid')throw new HttpError(401,'Invalid token');return 'u1'},serverGet:async path=>records[path]??null,
   serverSet:async(path,v)=>{records[path]=v},createOnce:async(path,v)=>records[path]??(records[path]=v),customToken:(uid,claims)=>{tokens.push({uid,claims});return 'custom'},apiError:e=>({status:e.status??503,message:e.message})},
  '/auth/requireAuth':{requireRole:(req,res)=>{if(!req.role){res.status(401).json({message:'Not authenticated'});return null}return {role:req.role,username:'Teacher'}}},
  '/utils/dataUtils':{decodeHomeworkUrl:q=>JSON.parse(q)}
 }).default;
 return {records,tokens,call:async(body={idToken:'valid',attempt,link},extra={})=>{const res=response();await handler({method:'POST',body,...extra},res);return res}};
}
test('attempt registration binds anonymous ownership, homework link and roster; repeated registration reuses ID',async()=>{
 const app=setup();assert.equal((await app.call()).code,200);assert.equal((await app.call()).code,200);
 assert.equal(app.records['attemptOwners/hw1/a1'].questionCount,1);assert.equal(app.records['progressAccess/u1/exam1/hw1'],true);
 for(const patch of [{ownerUid:'other'},{correctAnswers:1},{studentId:'other'},{studentName:'Other'}])assert.ok((await setup().call({idToken:'valid',attempt:{...attempt,...patch},link})).code>=400);
 assert.equal((await setup().call({idToken:'valid',attempt,link:{...link,deadlineDate:'2098-01-01'}})).code,400);
 assert.equal((await setup({'attemptOwners/hw1/a1':{...attempt,ownerUid:'other'}}).call()).code,409);
});
test('teacher bridge requires a session and issues only scoped time-limited Firebase claims',async()=>{
 const app=setup();const body={teacher:true,examId:'exam1',homeworkId:'hw1'};
 assert.equal((await app.call(body)).code,401);assert.equal(app.tokens.length,0);
 assert.equal((await app.call(body,{role:'assistant'})).code,200);
 assert.equal(app.tokens[0].claims.examId,'exam1');assert.equal(app.tokens[0].claims.homeworkId,'hw1');assert.ok(app.tokens[0].claims.accessUntil>Date.now());
 assert.equal((await app.call({...body,examId:'../bad'},{role:'admin'})).code,400);
});
