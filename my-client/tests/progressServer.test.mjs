import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import jwt from 'jsonwebtoken';
import {loadModule} from './loadModule.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const env={FIREBASE_CLIENT_EMAIL:'service@demo.iam.gserviceaccount.com',FIREBASE_PRIVATE_KEY:privateKey,NEXT_PUBLIC_PROJECT_ID:'demo-project',NEXT_PUBLIC_DATABASE_URL:'https://demo-project.firebaseio.com'};

test('server Firebase adapter verifies tokens, scopes custom credentials and uses conditional final writes',async()=>{
 const previous={...process.env}, originalFetch=global.fetch;
 Object.assign(process.env,env);
 const calls=[];let stored=null;let conflict=true;
 global.fetch=async(url,init={})=>{
  calls.push({url:String(url),init});
  if(String(url).includes('/metadata/x509/'))return new Response(JSON.stringify({key1:publicKey}),{headers:{'cache-control':'max-age=3600'}});
  if(String(url).includes('oauth2.googleapis.com')){
   const assertion=init.body.get('assertion');
   assert.equal(jwt.verify(assertion,publicKey,{algorithms:['RS256'],audience:'https://oauth2.googleapis.com/token'}).iss,env.FIREBASE_CLIENT_EMAIL);
   return new Response(JSON.stringify({access_token:'oauth',expires_in:3600}));
  }
  assert.equal(init.headers.Authorization,'Bearer oauth');
  if(init.method==='PUT'){
   assert.equal(init.headers['if-match'],'"empty"');
   if(conflict){conflict=false;return new Response('{}',{status:412})}
   stored=JSON.parse(init.body);return new Response(JSON.stringify(stored));
  }
  return new Response(JSON.stringify(stored),{headers:{etag:'"empty"'}});
 };
 try{
  const api=loadModule('modules/firebase/server.ts');
  const idToken=jwt.sign({auth_time:Math.floor(Date.now()/1000)},privateKey,{algorithm:'RS256',keyid:'key1',subject:'student1',audience:'demo-project',issuer:'https://securetoken.google.com/demo-project',expiresIn:'1h'});
  assert.equal(await api.verifyStudentToken(idToken),'student1');
  await assert.rejects(()=>api.verifyStudentToken(jwt.sign({},privateKey,{algorithm:'RS256',keyid:'key1',subject:'student1',audience:'wrong',issuer:'https://securetoken.google.com/demo-project',expiresIn:'1h'})),e=>e.status===401);
  await assert.rejects(()=>api.verifyStudentToken('bad'),e=>e.status===401);
  const scoped=jwt.verify(api.customToken('teacher1',{teacher:true,examId:'exam1',homeworkId:'hw1',accessUntil:123}),publicKey,{algorithms:['RS256']});
  assert.equal(scoped.uid,'teacher1');assert.equal(scoped.claims.homeworkId,'hw1');
  assert.deepEqual(await api.createOnce('completedAttempts/hw1/a1',{score:8}),{score:8});
  assert.deepEqual(await api.createOnce('completedAttempts/hw1/a1',{score:5}),{score:8});
  assert.equal(calls.filter(c=>c.url.includes('oauth2.googleapis.com')).length,1);
  assert.equal(calls.filter(c=>c.init.method==='PUT').length,2);
 }finally{global.fetch=originalFetch;for(const key of Object.keys(env)){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}}
});
