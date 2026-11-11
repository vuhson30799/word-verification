import test from 'node:test'
import assert from 'node:assert/strict'
import {messengerHref} from '../modules/utils/messenger.ts'
import {buildHomeworkResults} from '../modules/utils/homeworkResults.ts'

test('Facebook username profiles become Messenger links', () => {
    for (const url of ['https://www.facebook.com/student.name', 'facebook.com/student.name/', 'https://m.facebook.com/student.name?locale=vi_VN', 'fb.com/student.name']) {
        assert.equal(messengerHref(url), 'https://m.me/student.name')
    }
})

test('numeric profiles and existing Messenger links are supported', () => {
    assert.equal(messengerHref('https://www.facebook.com/profile.php?id=123456789&locale=vi_VN'), 'https://m.me/123456789')
    assert.equal(messengerHref('https://m.me/student.name?ref=homework'), 'https://m.me/student.name')
    assert.equal(messengerHref('https://www.messenger.com/t/123456789'), 'https://www.messenger.com/t/123456789')
})

test('missing, shortened, unsupported or unsafe links cannot become messaging links', () => {
    for (const url of [undefined, '', 'https://facebook.com/share/abc', 'https://facebook.com/groups/123', 'https://facebook.com/profile.php', 'https://facebook.com/people/Student/123', 'https://facebook.com.evil.test/student', 'https://evil.test/student', 'javascript:alert(1)', 'https://user@facebook.com/student', 'https://facebook.com:123/student']) {
        assert.equal(messengerHref(url), null, String(url))
    }
})

test('result rows retain the saved student Facebook link; unmatched submissions have none', () => {
    const result = buildHomeworkResults([{id:'student',name:'Student',phone:'',parentPhone:'',facebook:'facebook.com/student.name',classIds:[]}], [{examId:'exam',homeworkId:'homework',studentName:'Unmatched student',correctAnswers:0,trial:1}])
    assert.equal(result.rows[0].facebook, 'facebook.com/student.name')
    assert.equal(result.rows[1].facebook, '')
})
