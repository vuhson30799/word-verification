import {getInvalidStudentMessage, normalizeStudent, type StudentInput} from "./students";

export const MAX_IMPORT_STUDENTS = 1000

export interface StudentImportRow {
    row: number
    grade: number
    choice: string
    student: Omit<StudentInput, 'classIds'>
}

export function readStudentImportRows(rows: unknown[][]): StudentImportRow[] {
    const headers = rows[0] ?? []
    const required = [
        'Họ và tên', 'Số điện thoại', 'Số điện thoại của phụ huynh', 'Link facebook',
        'Bạn muốn đăng kí học lớp nào?', 'Bạn muốn học lớp nào?',
        'Bạn muốn học lớp nào? 2', 'Bạn muốn học lớp nào? 3'
    ]
    const columns = required.map(header => headers.findIndex(value => value === header))
    if (columns.includes(-1)) throw new Error('The workbook does not have the student import template headers.')

    const students: StudentImportRow[] = []
    for (const [index, row] of rows.entries()) {
        if (index === 0) continue
        const text = (column: number) => {
            const value = row[column]
            return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
        }
        const [name, phone, parentPhone, facebook, gradeLabel, ...choices] = columns.map(text)
        if ([name, phone, parentPhone, facebook, gradeLabel, ...choices].every(value => !value)) continue

        const grade = Number(/^Lớp\s+(10|11|12)\b/i.exec(gradeLabel)?.[1])
        const choice = choices[grade - 10]
        const student = {name, phone, parentPhone, facebook}
        const invalid = getInvalidStudentMessage(student)
        if (invalid) throw new Error(`Row ${index + 1}: ${invalid}.`)
        if (!choice || !new RegExp(`^Lớp\\s+${grade}(?=[a-z]|\\b)`, 'i').test(choice)) {
            throw new Error(`Row ${index + 1}: Choose a class for the student's grade in the workbook.`)
        }
        students.push({row: index + 1, grade, choice, student})
    }
    if (!students.length) throw new Error('The workbook has no student rows.')
    if (students.length > MAX_IMPORT_STUDENTS) {
        throw new Error(`Import up to ${MAX_IMPORT_STUDENTS} students at a time.`)
    }
    return students
}

export function parseStudentImport(body: unknown): StudentInput[] {
    if (!Array.isArray(body) || !body.length || body.length > MAX_IMPORT_STUDENTS) {
        throw new Error(`Provide between 1 and ${MAX_IMPORT_STUDENTS} students.`)
    }
    return body.map((value: Partial<StudentInput> | null, index) => {
        if (!value || typeof value.name !== 'string' || typeof value.phone !== 'string' ||
            typeof value.parentPhone !== 'string' || typeof value.facebook !== 'string' ||
            !Array.isArray(value.classIds) || value.classIds.length !== 1 ||
            typeof value.classIds[0] !== 'string' || !/^[^.#$\[\]/\x00-\x1f\x7f]+$/.test(value.classIds[0])) {
            throw new Error(`Student ${index + 1}: invalid student details or class.`)
        }
        const student = normalizeStudent(value as StudentInput)
        const invalid = getInvalidStudentMessage(student)
        if (invalid) throw new Error(`Student ${index + 1}: ${invalid}.`)
        return student
    })
}

export function studentEnrollmentKeys(input: StudentInput): string[] {
    const {name, phone, parentPhone, facebook, classIds} = normalizeStudent(input)
    return classIds.map(classId => JSON.stringify([classId, name, phone, parentPhone, facebook]))
}
