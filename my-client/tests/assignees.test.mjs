import test from 'node:test'
import assert from 'node:assert/strict'
import {exactAssignees, matchingAssignees} from '../modules/join/assignees.ts'
const roster = [{id:'a',name:'Nguyễn Minh',className:'10A1'}, {id:'b',name:'Trần An',className:'10A2'}, {id:'c',name:'Trần An',className:'10A3'}]
test('exact names tolerate case and spaces but preserve accents and duplicates', () => {
    assert.equal(exactAssignees(' NGUYỄN   MINH ', roster)[0].id, 'a')
    assert.equal(exactAssignees('Nguyen Minh', roster).length, 0)
    assert.equal(exactAssignees('Trần An', roster).length, 2)
})
test('suggestions support missing accents, partial names, typos and no results', () => {
    for (const input of ['nguyen minh', 'Minh', 'Nguyen Mimh']) assert.equal(matchingAssignees(input, roster)[0].id, 'a')
    assert.deepEqual(matchingAssignees('zzzzzzzzzzzzzz', roster), [])
    assert.deepEqual(matchingAssignees('', roster), [])
})
