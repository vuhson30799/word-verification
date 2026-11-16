import test from 'node:test'
import assert from 'node:assert/strict'
import {buildHomeworkResults} from '../modules/utils/homeworkResults.ts'

const student = (id, name) => ({id, name, phone:'0901234567', parentPhone:'0907654321', facebook:'', classIds:['class1']})
const answer = (overrides = {}) => ({examId:'exam1', homeworkId:'hw1', studentName:'Nguyễn An', correctAnswers:10, trial:1, beginningAt:'2026-07-05T08:00:00', ...overrides})

test('a single finished answer is retained, with matching contact details', () => {
    const result = buildHomeworkResults([student('an', 'Nguyễn An')], [answer({finishAt:'2026-07-05T08:30:00'})])
    assert.equal(result.rows[0].status, 'finished')
    assert.equal(result.rows[0].score, 10)
    assert.equal(result.rows[0].phone, '0901234567')
    assert.deepEqual(result.summary, {finished:1, inProgress:0, notJoined:0, averageScore:10})
})

test('best completed score wins over progress records and later lower scores', () => {
    const result = buildHomeworkResults([], [
        answer({correctAnswers:22, finishAt:'2026-07-05T08:30:00'}),
        answer({correctAnswers:12, trial:2, finishAt:'2026-07-05T09:30:00'}),
        answer({correctAnswers:23, trial:3, questionNumber:24})
    ])
    assert.equal(result.rows.length, 1)
    assert.equal(result.rows[0].score, 22)
    assert.equal(result.rows[0].finishedAt, '2026-07-05T08:30:00')
})

test('latest trial and furthest question determine progress', () => {
    const result = buildHomeworkResults([], [answer({trial:1, questionNumber:21}), answer({trial:2, questionNumber:6}), answer({trial:2, questionNumber:11})])
    assert.equal(result.rows[0].status, 'inProgress')
    assert.equal(result.rows[0].questionNumber, 11)
    assert.equal(result.rows[0].score, null)
})

test('assigned nonparticipants are not joined and average excludes incomplete rows', () => {
    const result = buildHomeworkResults([student('an','Nguyễn An'), student('thu','Đặng Thu'), student('linh','Trần Linh')], [answer({finishAt:'2026-07-05T08:30:00'}), answer({studentName:'Trần Linh',questionNumber:14})])
    assert.deepEqual(result.summary, {finished:1, inProgress:1, notJoined:1, averageScore:10})
    assert.equal(result.rows[1].parentPhone, '0907654321')
})

test('name matching tolerates whitespace, case and Unicode normalization', () => {
    const result = buildHomeworkResults([student('an', 'Nguyễn An')], [answer({studentName:'  NGUYỄN   AN '.normalize('NFD'), questionNumber:6})])
    assert.equal(result.rows.length, 1)
    assert.equal(result.rows[0].status, 'inProgress')
})

test('different accented names stay separate and unmatched participants remain visible', () => {
    const result = buildHomeworkResults([student('an','Nguyễn An')], [answer({studentName:'Nguyen An', finishAt:'2026-07-05T08:30:00'})])
    assert.equal(result.rows.length, 2)
    assert.equal(result.rows[0].status, 'notJoined')
    assert.equal(result.rows[1].status, 'finished')
    assert.equal(result.rows[1].phone, '')
})

test('ambiguous duplicate names do not duplicate scores or attach the wrong phone', () => {
    const result = buildHomeworkResults([student('one','Nguyễn An'),student('two','Nguyễn An')], [answer({finishAt:'2026-07-05T08:30:00'})])
    assert.equal(result.rows.length, 3)
    assert.equal(result.summary.finished, 1)
    assert.equal(result.rows[2].phone, '')
})

test('empty homework is a valid empty result; invalid finish dates do not mark completion', () => {
    assert.deepEqual(buildHomeworkResults([], []).summary, {finished:0, inProgress:0, notJoined:0, averageScore:null})
    assert.equal(buildHomeworkResults([], [answer({finishAt:'invalid'})]).rows[0].status, 'inProgress')
})

// The join page historically saved finishAt after every answer, including checkpoints.
test('legacy progress checkpoints with finishAt are not completed submissions', () => {
    const result = buildHomeworkResults([], [answer({questionNumber:11, finishAt:'2026-07-05T08:15:00'})])
    assert.equal(result.rows[0].status, 'inProgress')
    assert.equal(result.summary.finished, 0)
    assert.equal(result.summary.averageScore, null)
})

test('location belongs to the displayed best attempt, rather than a later attempt', () => {
    const location = {latitude: 10.7, longitude: 106.6, accuracyMeters: 30, capturedAt: '2026-07-05T08:00:00Z'}
    const result = buildHomeworkResults([], [
        answer({correctAnswers: 22, finishAt: '2026-07-05T08:30:00', location}),
        answer({correctAnswers: 12, trial: 2, finishAt: '2026-07-05T09:30:00', location: {...location, latitude: 11}})
    ])
    assert.deepEqual(result.rows[0].location, location)
})

test('progress includes location and older attempts without location remain supported', () => {
    const location = {latitude: 10.7, longitude: 106.6, accuracyMeters: 30, capturedAt: '2026-07-05T08:00:00Z'}
    assert.deepEqual(buildHomeworkResults([], [answer({questionNumber: 6, location})]).rows[0].location, location)
    assert.equal(buildHomeworkResults([], [answer()]).rows[0].location, null)
    assert.equal(buildHomeworkResults([student('an', 'Nguyễn An')], []).rows[0].location, null)
})
