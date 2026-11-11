import type {StudentAnswer} from '../../pages/join';
import type {StudentData} from '../configuration/students';

export type ResultStatus = 'finished' | 'inProgress' | 'notJoined'
export interface HomeworkResultRow {
    id: string
    name: string
    phone: string
    parentPhone: string
    facebook: string
    status: ResultStatus
    score: number | null
    questionNumber: number | null
    joinedAt: string | null
    finishedAt: string | null
}

export interface HomeworkResultsData {
    title: string
    grade: number
    beginningDate: string
    deadlineDate: string
    questionCount: number
    assignedCount: number
    legacyRoster: boolean
    rows: HomeworkResultRow[]
    summary: {finished: number; inProgress: number; notJoined: number; averageScore: number | null}
}

// Answers currently identify students by their typed name. Keep accents to avoid
// merging distinct Vietnamese names, while tolerating case and extra whitespace.
export function normalizeStudentName(name: string): string {
    return name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
}

const timestamp = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0

export function buildHomeworkResults(roster: StudentData[], answers: StudentAnswer[]) {
    const groups = new Map<string, StudentAnswer[]>()
    for (const answer of answers) {
        if (!answer.studentName?.trim()) continue
        const key = normalizeStudentName(answer.studentName)
        groups.set(key, [...(groups.get(key) ?? []), answer])
    }
    const nameCounts = new Map<string, number>()
    for (const student of roster) {
        const key = normalizeStudentName(student.name)
        nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1)
    }

    function row(id: string, name: string, phone = '', parentPhone = '', records: StudentAnswer[] = [], facebook = ''): HomeworkResultRow {
        const completed = records.filter(a => a.questionNumber == null && timestamp(a.finishAt)).sort((a, b) =>
            b.correctAnswers - a.correctAnswers || timestamp(b.finishAt) - timestamp(a.finishAt))
        const latest = [...records].sort((a, b) =>
            (b.trial || 0) - (a.trial || 0) || (b.questionNumber || 0) - (a.questionNumber || 0) || timestamp(b.beginningAt) - timestamp(a.beginningAt))[0]
        const best = completed[0]
        const attempt = best ?? latest
        return {
            id, name, phone, parentPhone, facebook,
            status: best ? 'finished' : latest ? 'inProgress' : 'notJoined',
            score: best ? best.correctAnswers : null,
            questionNumber: latest?.questionNumber ?? null,
            joinedAt: attempt?.beginningAt && timestamp(attempt.beginningAt) ? attempt.beginningAt : null,
            finishedAt: best?.finishAt ?? null
        }
    }

    const rows = roster.map(student => {
        const key = normalizeStudentName(student.name)
        // A name alone cannot safely identify two different students. Keep the
        // unmatched submission visible separately rather than duplicate its score.
        const records = nameCounts.get(key) === 1 ? groups.get(key) : undefined
        if (records) groups.delete(key)
        return row(student.id, student.name, student.phone, student.parentPhone, records, student.facebook)
    })
    for (const [key, records] of groups) rows.push(row(`answer:${key}`, records[0].studentName.trim(), '', '', records))
    const finished = rows.filter(r => r.status === 'finished')
    return {
        rows,
        summary: {
            finished: finished.length,
            inProgress: rows.filter(r => r.status === 'inProgress').length,
            notJoined: rows.filter(r => r.status === 'notJoined').length,
            averageScore: finished.length ? finished.reduce((total, r) => total + (r.score ?? 0), 0) / finished.length : null
        }
    }
}
