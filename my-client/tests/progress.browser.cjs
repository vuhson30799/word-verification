const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const os=require('node:os');
const ROOT=path.resolve(__dirname,'..');
const OUTPUT=process.env.WV_ARTIFACTS || fs.mkdtempSync(path.join(os.tmpdir(),'wv-progress-browser-'));
fs.mkdirSync(OUTPUT,{recursive:true});
const HOST=process.env.FIREBASE_DATABASE_EMULATOR_HOST;
if (!HOST || !/^(127\.0\.0\.1|localhost):[0-9]+$/.test(HOST)) throw new Error('Set FIREBASE_DATABASE_EMULATOR_HOST to a local database emulator.');
const SITE=process.env.WV_TEST_BASE_URL || 'http://127.0.0.1:3000';
let browser, context;
let shuttingDown=false;
const NS='demo-wv-browser';
const base=`http://${HOST}`;
async function db(path,method='GET',body) {
 const res=await fetch(`${base}/${path}.json?ns=${NS}`,{method,headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!res.ok)throw new Error(await res.text()); return res.json();
}
function token(uid,claims={}) {
 const now=Math.floor(Date.now()/1000);
 return [Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:uid,user_id:uid,aud:NS,iss:`https://securetoken.google.com/${NS}`,iat:now,exp:now+3600,auth_time:now,firebase:{sign_in_provider:'anonymous'},...claims})).toString('base64url'),''].join('.');
}
(async()=>{
 await db('.settings/rules','PUT',JSON.parse(fs.readFileSync(ROOT+'/firebase/progress.rules.json')));
 await db('','PUT',{homeworks:{hw1:{examId:'exam1'}}});
 const {loadModule}=await import(ROOT+'/tests/loadModule.mjs');
 const {buildHomeworkResults}=loadModule(ROOT+'/modules/utils/homeworkResults.ts');
 const rows=[{id:'s1',name:'Nguyễn An',phone:'0901234567',parentPhone:'0907654321',facebook:'',classIds:[]},{id:'s2',name:'Trần Bình',phone:'',parentPhone:'',facebook:'',classIds:[]}];
 const old={studentId:'s1',studentName:'Nguyễn An',examId:'exam1',homeworkId:'hw1',correctAnswers:2,trial:1,beginningAt:'2026-11-19T08:00:00Z',finishAt:'2026-11-19T08:01:00Z'};
 const exam={id:'exam1',title:'Unit 5 — Practice',grade:10,maximumIncorrectAnswers:0,questions:[{title:'Translate: cat',keys:[],timeout:120},{title:'Translate: dog',keys:[],timeout:120}]};
 const env=fs.readFileSync(ROOT+'/.env.local','utf8'); const encoding=env.match(/^NEXT_PUBLIC_ENCODING_KEY=(.*)$/m)?.[1]?.replace(/^['"]|['"]$/g,'');
 const encode=s=>Buffer.from(Buffer.from(s).toString('base64')+encoding).toString('base64');
 exam.questions[0].keys=[encode('cat')];exam.questions[1].keys=[encode('dog')];
 const requests=[]; const errors=[]; let failFinal=true;
 browser=await chromium.launch({channel:'chrome',headless:true});
 const ctx=context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['geolocation'],geolocation:{latitude:10.7,longitude:106.6}});
 await ctx.addInitScript(({host,namespace})=>{
  const Native=window.WebSocket;
  window.WebSocket=class extends Native {constructor(url,protocols){super(/firebaseio|firebasedatabase|\/\.ws\?/.test(String(url))?`ws://${host}/.ws?v=5&ns=${namespace}`:url,protocols)}};
 },{host:HOST,namespace:NS});
 await ctx.route(/\/\.lp\?/,async route=>{
  const target=new URL(route.request().url());target.protocol='http:';target.host=HOST;target.searchParams.set('ns',NS);
  try {const response=await route.fetch({url:target.toString(),timeout:30000});await route.fulfill({response})}
  catch(error){if(!shuttingDown)throw error}
 });
 await ctx.route('https://identitytoolkit.googleapis.com/**',async route=>{
  const body=route.request().postDataJSON(); const teacher=body.token==='teacher-custom'; const uid=teacher?'teacher1':'student1';
  const claims=teacher?{teacher:true,examId:'exam1',homeworkId:'hw1',accessUntil:Date.now()+3600000}:{};
  await route.fulfill({json:{kind:'identitytoolkit#SignupNewUserResponse',localId:uid,idToken:token(uid,claims),refreshToken:'mock-refresh',expiresIn:'3600',users:[{localId:uid,providerUserInfo:[]}]}});
 });
 await ctx.route('**/api/**',async route=>{
  const req=route.request();const url=new URL(req.url());requests.push({path:url.pathname,method:req.method()});
  if(url.pathname==='/api/auth/me')return route.fulfill({json:{role:'admin',username:'Teacher'}});
  if(url.pathname==='/api/join')return route.fulfill({json:{examination:exam,homeworkId:'hw1',assignees:rows.map(s=>({id:s.id,name:s.name,className:'10A1'}))}});
  if(url.pathname==='/api/progress/session'){
   const body=req.postDataJSON();if(body.teacher)return route.fulfill({json:{token:'teacher-custom'}});
   await db(`attemptOwners/hw1/${body.attempt.attemptId}`,'PUT',{...body.attempt,questionCount:2});
   await db(`progressAccess/student1/exam1/hw1`,'PUT',true);return route.fulfill({json:{success:true}});
  }
  if(url.pathname==='/api/answers'){
   if(failFinal)return route.fulfill({status:503,json:{message:'Temporary network interruption'}});
   const body=req.postDataJSON();await db(`completedAttempts/hw1/${body.result.attemptId}`,'PUT',body.result);
   return route.fulfill({json:{success:'Saved',attemptId:body.result.attemptId}});
  }
  if(url.pathname.endsWith('/results')){
   const saved=await db('completedAttempts/hw1')||{};const snapshots=await db('progress/exam1/hw1/snapshots')||{};
   const records=[old,...Object.values(saved),...Object.values(snapshots).map(s=>({...s,provisional:true}))];
   return route.fulfill({json:{title:exam.title,grade:10,beginningDate:'2026-11-19',deadlineDate:'2026-12-20',maximumIncorrectAnswers:0,questionCount:2,assignedCount:2,legacyRoster:false,...buildHomeworkResults(rows,records)}});
  }
  return route.fulfill({status:404,json:{message:'Unexpected test request: '+url.pathname}});
 });
 const monitor=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error' && !/Failed to load resource: the server responded with a status of 503|ERR_INTERNET_DISCONNECTED/.test(message.text()))errors.push(message.text())})};
 const teacher=await ctx.newPage();monitor(teacher);
 await teacher.clock.install();
 await teacher.goto(SITE+'/admin/examination/exam1/homework/hw1/completed-students');
 await teacher.getByRole('combobox',{name:'Auto-refresh'}).waitFor();
 const autoRefresh=teacher.getByRole('combobox',{name:'Auto-refresh'});
 assert.equal(await autoRefresh.inputValue(),'0');
 assert.deepEqual(await autoRefresh.locator('option').allTextContents(),['Off','5 minutes','10 minutes']);
 await teacher.getByRole('table',{name:'Student homework results'}).waitFor();
 const defaultReads=requests.filter(r=>r.path.endsWith('/results')).length;
 await teacher.clock.fastForward(600000);
 assert.equal(requests.filter(r=>r.path.endsWith('/results')).length,defaultReads,'default off does not poll');
 await autoRefresh.selectOption('300000');
 await teacher.screenshot({path:path.join(OUTPUT,'teacher-desktop.png'),fullPage:true});
 const initialReads=requests.filter(r=>r.path.endsWith('/results')).length;
 await teacher.clock.fastForward(299000);
 assert.equal(requests.filter(r=>r.path.endsWith('/results')).length,initialReads,'no poll before five minutes');
 await teacher.clock.fastForward(1500);
 await teacher.waitForTimeout(100);
 assert.equal(requests.filter(r=>r.path.endsWith('/results')).length,initialReads+1,'one poll at five minutes');
 assert.equal(requests.filter(r=>r.path==='/api/progress/session').length,0,'polling never broadcasts');
 await teacher.evaluate(()=>Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'}));
 const hiddenReads=requests.filter(r=>r.path.endsWith('/results')).length;
 await teacher.clock.fastForward(300000);await teacher.waitForTimeout(50);
 assert.equal(requests.filter(r=>r.path.endsWith('/results')).length,hiddenReads,'hidden screens do not poll');
 await teacher.evaluate(()=>Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'}));
 await ctx.setOffline(true);
 await teacher.clock.fastForward(300000);await teacher.waitForTimeout(50);
 assert.equal(requests.filter(r=>r.path.endsWith('/results')).length,hiddenReads,'offline screens do not poll');
 await ctx.setOffline(false);
 await teacher.clock.resume();
 await teacher.getByRole('combobox',{name:'Auto-refresh'}).selectOption('0');
 await teacher.reload();assert.equal(await teacher.getByRole('combobox',{name:'Auto-refresh'}).inputValue(),'0');
 const student=await ctx.newPage();monitor(student);
 await student.goto(SITE+'/join?examId=exam1&beginningDate=2026-11-19&deadlineDate=2026-12-20');
 await student.getByLabel('Họ và tên').fill('Nguyễn An');await student.getByRole('button',{name:/Tiếp tục/}).click();
 await student.getByRole('button',{name:/Chia sẻ vị trí và bắt đầu/}).click();
 await student.getByLabel('Câu trả lời của em',{exact:true}).waitFor({timeout:30000});
 await student.getByLabel('Câu trả lời của em',{exact:true}).fill('wrong');await student.getByRole('button',{name:/Nộp câu trả lời/}).click();
 await student.getByRole('button',{name:/Câu tiếp theo/}).waitFor();
 const firstQuestion=await student.locator('[class*="questionText"]').innerText();
 const second=await ctx.newPage();
 await second.goto(SITE+'/join?examId=exam1&beginningDate=2026-11-19&deadlineDate=2026-12-20');
 await second.getByRole('button',{name:'Mở lại bài làm đã lưu'}).click();
 await second.getByText('This attempt is already open in another tab. Close that tab first.',{exact:true}).waitFor();
 await second.close();
 await teacher.getByRole('button',{name:'Refresh progress',exact:true}).click();
 await teacher.getByText('Responded to refresh',{exact:true}).waitFor({timeout:20000});
 await teacher.screenshot({path:path.join(OUTPUT,'teacher-live.png'),fullPage:true});
 await student.reload();
 await student.getByRole('button',{name:'Mở lại bài làm đã lưu'}).waitFor();
 await student.setViewportSize({width:390,height:844});
 await student.screenshot({path:path.join(OUTPUT,'recovery-mobile.png'),fullPage:true});
 await student.getByRole('button',{name:'Mở lại bài làm đã lưu'}).click();
 await student.getByRole('button',{name:/Câu tiếp theo/}).waitFor();
 assert.equal(await student.locator('[class*="questionText"]').innerText(),firstQuestion,'recovery preserves question order');
 await student.screenshot({path:path.join(OUTPUT,'student-recovered.png'),fullPage:true});
 await student.getByRole('button',{name:/Câu tiếp theo/}).click();
 await student.getByLabel('Câu trả lời của em',{exact:true}).fill('wrong');await student.getByRole('button',{name:/Nộp câu trả lời/}).click();
 await student.getByRole('button',{name:/Xem kết quả/}).click();
 await student.getByText(/Không thể lưu kết quả của em/).waitFor();
 await student.screenshot({path:path.join(OUTPUT,'student-pending.png'),fullPage:true});
 failFinal=false;await student.getByRole('button',{name:'Thử lưu kết quả lại'}).click();
 await student.getByText(/Kết quả đã được lưu/).waitFor();
 await student.setViewportSize({width:390,height:844});await student.screenshot({path:path.join(OUTPUT,'student-mobile.png'),fullPage:true});
 await teacher.setViewportSize({width:390,height:844});
 await teacher.getByRole('button',{name:'Refresh progress',exact:true}).waitFor({state:'visible'});
 await teacher.screenshot({path:path.join(OUTPUT,'teacher-mobile.png'),fullPage:true});
 await teacher.getByRole('button',{name:'Refresh progress',exact:true}).click();
 await teacher.getByText('Latest attempt: completed · 0 points',{exact:true}).waitFor();
 assert.match(await teacher.locator('main').innerText(),/2 \/ 2 · Passed/,'lower final score keeps previous best');
 const state=await student.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('wv-progress-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  return new Promise(resolve=>{const r=db.transaction('attempts').objectStore('attempts').getAll();r.onsuccess=()=>resolve(r.result)});
 });
 assert.equal(state[0].answers.length,2);assert.equal(state[0].saved,true);assert.equal(state[0].pending,false);
 await student.getByRole('button',{name:/Làm lại/}).click();
 await student.getByLabel('Họ và tên').fill('Nguyễn An');await student.getByRole('button',{name:/Tiếp tục/}).click();
 await student.getByRole('button',{name:/Chia sẻ vị trí và bắt đầu/}).click();await student.getByLabel('Câu trả lời của em',{exact:true}).waitFor();
 for(let index=0;index<2;index++){
  await student.getByLabel('Câu trả lời của em',{exact:true}).fill('wrong');await student.getByRole('button',{name:/Nộp câu trả lời/}).click();
  if(index===0)await student.getByRole('button',{name:/Câu tiếp theo/}).click();
 }
 const beforeOffline=requests.filter(r=>r.path==='/api/answers').length;
 await ctx.setOffline(true);
 await student.getByRole('button',{name:/Xem kết quả/}).click();
 await student.getByText('Đang ngoại tuyến. Kết quả của em đang chờ gửi.',{exact:true}).waitFor();
 assert.equal(requests.filter(r=>r.path==='/api/answers').length,beforeOffline);
 await student.getByRole('button',{name:/Làm lại/}).click();
 await student.getByRole('region',{name:'Kết quả đang chờ gửi'}).waitFor();
 await student.screenshot({path:path.join(OUTPUT,'pending-earlier-mobile.png'),fullPage:true});
 await ctx.setOffline(false);
 await student.getByRole('region',{name:'Kết quả đang chờ gửi'}).waitFor({state:'hidden'});
 assert.equal(Object.keys(await db('completedAttempts/hw1')).length,2,'earlier final result survives play again and syncs on reconnect');
 await student.getByLabel('Họ và tên').fill('Nguyễn An');await student.getByRole('button',{name:/Tiếp tục/}).click();
 await student.getByRole('button',{name:/Chia sẻ vị trí và bắt đầu/}).click();await student.getByLabel('Câu trả lời của em',{exact:true}).waitFor();
 await student.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
 await student.getByText('Bài làm bị gián đoạn',{exact:true}).waitFor();
 await student.reload();await student.getByRole('button',{name:'Mở lại bài làm đã lưu'}).click();
 await student.getByText('Bài làm bị gián đoạn',{exact:true}).waitFor();
 await student.screenshot({path:path.join(OUTPUT,'interrupted-mobile.png'),fullPage:true});
 const unavailable=await ctx.newPage();
 await unavailable.addInitScript(()=>Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(){throw new Error('Storage unavailable')}}}));
 await unavailable.setViewportSize({width:390,height:844});
 await unavailable.goto(SITE+'/join?examId=exam1&beginningDate=2026-11-19&deadlineDate=2026-12-20');
 await unavailable.getByText('Local recovery is unavailable. Keep this page open until your results are saved.',{exact:true}).waitFor();
 await unavailable.screenshot({path:path.join(OUTPUT,'storage-unavailable-mobile.png'),fullPage:true});
 await unavailable.close();
 assert.equal(requests.filter(r=>r.path.includes('current-state')).length,0);
 assert.deepEqual(errors,[]);
 console.log('Passed: polling interval, manual refresh, multi-tab lock, recovery, retries, interruption, best score, and zero checkpoint API calls.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{shuttingDown=true;await context?.unrouteAll({behavior:'ignoreErrors'});await browser?.close();if(!process.env.WV_ARTIFACTS)fs.rmSync(OUTPUT,{recursive:true,force:true})});
