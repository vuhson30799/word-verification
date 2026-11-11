import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Run the real route, converters and aggregation against an in-memory Firebase
// boundary, without credentials, database writes or external services.
function loadRoute(records, fail, missingIndex = false) {
    const cache = new Map()
    const firebase = {
        ref: (_db, path) => path, query: path => ({path}),
        orderByChild: () => {}, equalTo: () => {},
        get: async target => {
            if (missingIndex && typeof target === 'object') throw new Error('Index not defined, add ".indexOn": "examId", for path "/answers", to the rules')
            const path = typeof target === 'object' ? target.path : target
            await Promise.resolve()
            if (fail) throw new Error('database unavailable')
            return {val: () => records[path] ?? null}
        }
    }
    function load(path) {
        if (cache.has(path)) return cache.get(path).exports
        const compiledModule = {exports:{}}
        cache.set(path, compiledModule)
        const code = ts.transpileModule(readFileSync(path, 'utf8'), {
            compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
        }).outputText
        function requireMock(name) {
            if (name === 'firebase/database') return firebase
            if (name.endsWith('/firebase/FirebaseService')) return {database:{}}
            if (name.endsWith('/auth/requireAuth')) return {requireRole: (req,res,roles) => {
                if (!req.role) {res.status(401).json({message:'Not authenticated'});return null}
                if (!roles.includes(req.role)) {res.status(403).json({message:'Not authorized'});return null}
                return {role:req.role}
            }}
            if (name.startsWith('.')) return load(resolve(dirname(path), `${name}.ts`))
            return createRequire(path)(name)
        }
        new Function('require','module','exports',code)(requireMock,compiledModule,compiledModule.exports)
        return compiledModule.exports
    }
    return load(resolve(project,'pages/api/exams/[examId]/homeworks/[homeworkId]/results.ts')).default
}

async function request(records, overrides = {}, fail = false, missingIndex = false) {
    const handler = loadRoute(records, fail, missingIndex)
    const response = {statusCode:0,body:null,sent:0,status(code){this.statusCode=code;return this},json(body){this.body=body;this.sent++;return this}}
    await handler({method:'GET',role:'admin',query:{examId:'exam1',homeworkId:'hw1'},...overrides},response)
    assert.equal(response.sent,1,'route must send exactly one response before resolving')
    return response
}

function fixtures() {
    const today = new Date(), year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear()-1
    return {
        '/examinations/exam1':{title:'Unit 5',grade:10,questions:[{keys:['a']},{keys:['b']}]},
        '/homeworks/hw1':{examId:'exam1',studentIds:['an','thu'],beginningDate:'2026-07-05T08:00:00',deadlineDate:'2026-07-12T23:59:00'},
        '/students':{an:{name:'Nguyễn An',phone:'0901234567',classIds:['class1']},thu:{name:'Đặng Thu',parentPhone:'0907654321',classIds:['class1']},other:{name:'Other grade',classIds:['class2']}},
        '/classes':{class1:{name:'10A1',grade:10,academicYear:`${year}-${year+1}`},class2:{name:'11A1',grade:11,academicYear:`${year}-${year+1}`}},
        '/answers':{one:{examId:'exam1',homeworkId:'hw1',studentName:'Nguyễn An',correctAnswers:2,trial:1,beginningAt:'2026-07-05T08:00:00',finishAt:'2026-07-05T08:10:00'},other:{examId:'exam1',homeworkId:'another-homework',studentName:'Đặng Thu',correctAnswers:2,finishAt:'2026-07-05T08:10:00'}}
    }
}

test('results API returns this homework, its roster, contacts and statistics for assistants', async () => {
    const {statusCode,body} = await request(fixtures(),{role:'assistant'})
    assert.equal(statusCode,200)
    assert.equal(body.assignedCount,2)
    assert.equal(body.questionCount,2)
    assert.equal(body.rows[1].status,'notJoined')
    assert.equal(body.rows[1].parentPhone,'0907654321')
    assert.deepEqual(body.summary,{finished:1,inProgress:0,notJoined:1,averageScore:2})
})

test('no answers returns a successful not-joined roster', async () => {
    const data=fixtures(); delete data['/answers']
    const res=await request(data)
    assert.equal(res.statusCode,200)
    assert.equal(res.body.summary.notJoined,2)
    assert.equal(res.body.summary.averageScore,null)
})

test('legacy homework uses the grade roster; explicitly empty recipients stay empty', async () => {
    const data=fixtures(); delete data['/homeworks/hw1'].studentIds; delete data['/answers']
    const legacy=await request(data)
    assert.equal(legacy.body.legacyRoster,true)
    assert.equal(legacy.body.assignedCount,2)
    data['/homeworks/hw1'].studentIds=[]
    const empty=await request(data)
    assert.equal(empty.body.legacyRoster,false)
    assert.equal(empty.body.assignedCount,0)
    assert.deepEqual(empty.body.rows,[])
})

test('missing/mismatched homework returns 404; database failures return 500', async () => {
    const data=fixtures(); data['/homeworks/hw1'].examId='wrong'
    assert.equal((await request(data)).statusCode,404)
    assert.equal((await request({})).statusCode,404)
    assert.equal((await request(fixtures(),{},true)).statusCode,500)
})

test('route rejects unauthenticated users, unsupported roles/methods and invalid params', async () => {
    assert.equal((await request(fixtures(),{role:null})).statusCode,401)
    assert.equal((await request(fixtures(),{role:'student'})).statusCode,403)
    assert.equal((await request(fixtures(),{method:'POST'})).statusCode,405)
    assert.equal((await request(fixtures(),{query:{examId:['exam1'],homeworkId:'hw1'}})).statusCode,400)
})


test('missing Firebase index falls back to one-time read and filters both exam and homework', async () => {
    const data = fixtures()
    data['/answers'].unrelated = {examId:'another-exam', homeworkId:'hw1', studentName:'Other exam', correctAnswers:2, finishAt:'2026-07-05T08:10:00'}
    const res = await request(data, {}, false, true)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.rows.length, 2)
    assert.deepEqual(res.body.summary, {finished:1, inProgress:0, notJoined:1, averageScore:2})
})
