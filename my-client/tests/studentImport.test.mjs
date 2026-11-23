import assert from 'node:assert/strict';
import test from 'node:test';
import {loadModule, response} from './loadModule.mjs';

const student = {name: 'Nguyễn Văn An', phone: '0901234567', parentPhone: '', facebook: '', classIds: ['grade11']};

test('student import uses the selected grade column, preserves phone text and ignores unrelated fields', () => {
    const {readStudentImportRows} = loadModule('modules/configuration/studentImport.ts');
    const headers = [
        'Timestamp', 'Họ và tên', 'Trường học hiện tại', 'Số điện thoại', 'Số điện thoại của phụ huynh',
        'Link facebook', 'Bạn muốn đăng kí học lớp nào?', 'Bạn muốn học lớp nào?', 'Điểm tuyển sinh môn tiếng Anh của bạn',
        'Bạn muốn học lớp nào? 2', 'Bạn muốn học lớp nào? 3'
    ];
    const row = [
        new Date(), student.name, 'School', student.phone, null, null, 'Lớp 11 (2K10)',
        null, 10, 'Lớp 11a: Sáng thứ 3 - 5 - 7', null
    ];
    assert.deepEqual(readStudentImportRows([headers, [], row]), [{
        row: 3, grade: 11, choice: row[9],
        student: {name: student.name, phone: student.phone, parentPhone: '', facebook: ''}
    }]);
    assert.throws(() => readStudentImportRows([headers, row.slice(0, 9)]), /Row 2: Choose a class/);
    assert.throws(() => readStudentImportRows([['Wrong']]), /template headers/);
});

test('student import requires an admin, validates the entire batch and skips already enrolled records on retry', async () => {
    let roster = {existing: {...student, classIds: ['grade11', 'other']}};
    let sequence = 0;
    let transactions = 0;
    const handler = loadModule('pages/api/students/import.ts', {
        '/auth/requireAuth': {
            requireRole(req, res, roles) {
                if (roles.includes(req.role)) return true;
                res.status(403).json({message: 'Not authorized'});
                return false;
            }
        },
        '/firebase/FirebaseService': {database: {}},
        'firebase/database': {
            ref: (_, path) => path,
            get: async () => ({hasChild: id => id === 'grade11'}),
            push: () => ({key: 'imported-' + ++sequence}),
            runTransaction: async (_, update) => {
                transactions++;
                roster = update(roster);
                return {snapshot: {hasChild: id => Object.hasOwn(roster, id)}};
            }
        }
    }).default;
    const call = async (role, body) => {
        const res = response();
        await handler({role, method: 'POST', body: JSON.stringify(body)}, res);
        return res;
    };

    const other = {...student, name: 'Trần Bình', school: 'Ignored'};
    assert.equal((await call('assistant', [other])).code, 403);
    assert.equal((await call('admin', [other, {...student, classIds: ['missing']}])).code, 400);
    assert.equal((await call('admin', [other, {...student, phone: 'invalid'}])).code, 400);
    assert.equal(transactions, 0);
    assert.deepEqual((await call('admin', [student, other, other])).body, {imported: 1, skipped: 2});
    assert.deepEqual(roster['imported-2'], {name: other.name, phone: other.phone, parentPhone: '', facebook: '', classIds: ['grade11']});
    assert.deepEqual((await call('admin', [student, other, other])).body, {imported: 0, skipped: 3});
    assert.equal(Object.keys(roster).length, 2);
});
