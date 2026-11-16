import test from 'node:test'
import assert from 'node:assert/strict'
import {hasPassedExamination, defaultMaximumIncorrectAnswers, isValidMaximumIncorrectAnswers, maximumIncorrectAnswers} from '../modules/utils/examinationPassing.ts'

test('10 percent defaults round down, including exams with fewer than ten questions', () => {
    for (const [count, expected] of [[0, 0], [9, 0], [10, 1], [19, 1], [29, 2], [100, 10]]) {
        assert.equal(defaultMaximumIncorrectAnswers(count), expected)
    }
})

test('configured thresholds include zero and the full question count', () => {
    for (const value of [0, 1, 20]) assert.equal(isValidMaximumIncorrectAnswers(value, 20), true)
    for (const value of [-1, 21, 1.5, NaN, Infinity, undefined, null, '2']) assert.equal(isValidMaximumIncorrectAnswers(value, 20), false)
    assert.equal(maximumIncorrectAnswers({questions: Array(20), maximumIncorrectAnswers: 0}), 0)
    assert.equal(maximumIncorrectAnswers({questions: Array(20), maximumIncorrectAnswers: 15}), 15)
})

test('existing examinations use the same default', () => {
    assert.equal(maximumIncorrectAnswers({questions: Array(29)}), 2)
})

test('passing permits exactly the configured number of incorrect answers', () => {
    assert.equal(hasPassedExamination(27, 29, 2), true)
    assert.equal(hasPassedExamination(26, 29, 2), false)
    assert.equal(hasPassedExamination(29, 29, 0), true)
    assert.equal(hasPassedExamination(28, 29, 0), false)
    assert.equal(hasPassedExamination(0, 29, 29), true)
})
