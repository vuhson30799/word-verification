import type {StudentAnswer} from '../../pages/join';
import type {StudentData} from '../configuration/students';
import type {TestLocation} from '../join/location';

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
    location: TestLocation | null
    currentAttemptId?: string | null
    currentRevision?: number | null
    currentStatus?: string | null
    currentScore?: number | null
    currentBeginningAt?: string | null
    lastReportedAt?: number | null
    refreshRequestId?: string | null
}

export interface HomeworkResultsData {
    title: string
    grade: number
    beginningDate: string
    deadlineDate: string
    maximumIncorrectAnswers: number
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

const resultStatusOrder: Record<ResultStatus, number> = {finished: 0, inProgress: 1, notJoined: 2}

export function compareHomeworkResultRows(a: HomeworkResultRow, b: HomeworkResultRow): number {
    const statusOrder = resultStatusOrder[a.status] - resultStatusOrder[b.status]
    if (statusOrder !== 0) return statusOrder

    const dateA = a.status === 'finished' ? a.finishedAt : a.joinedAt
    const dateB = b.status === 'finished' ? b.finishedAt : b.joinedAt
    return Number(!dateA) - Number(!dateB) || timestamp(dateA ?? undefined) - timestamp(dateB ?? undefined)
}

export function buildHomeworkResults(roster: StudentData[], answers: StudentAnswer[]) {
    const groups = new Map<string, StudentAnswer[]>()
    for (const answer of answers) {
        if (!answer.studentName?.trim()) continue
        const key = answer.studentId ? `id:${answer.studentId}` : normalizeStudentName(answer.studentName)
        groups.set(key, [...(groups.get(key) ?? []), answer])
    }
    const nameCounts = new Map<string, number>()
    for (const student of roster) {
        const key = normalizeStudentName(student.name)
        nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1)
    }

    function row(id: string, name: string, phone = '', parentPhone = '', records: StudentAnswer[] = [], facebook = ''): HomeworkResultRow {
        const completed = records.filter(a => !a.provisional && a.questionNumber == null && timestamp(a.finishAt) && (!a.status || a.status === 'completed')).sort((a, b) =>
            b.correctAnswers - a.correctAnswers || timestamp(b.finishAt) - timestamp(a.finishAt))
        const latest = [...records].sort((a, b) =>
            (a.attemptId || b.attemptId ? timestamp(b.beginningAt) - timestamp(a.beginningAt) || (b.revision || 0) - (a.revision || 0) : 0) ||
            (b.trial || 0) - (a.trial || 0) || (b.questionNumber || 0) - (a.questionNumber || 0) || timestamp(b.beginningAt) - timestamp(a.beginningAt))[0]
        const best = completed[0]
        const attempt = best ?? latest
        return {
            id, name, phone, parentPhone, facebook,
            status: best ? 'finished' : latest ? 'inProgress' : 'notJoined',
            score: best ? best.correctAnswers : null,
            questionNumber: latest?.questionNumber ?? null,
            joinedAt: attempt?.beginningAt && timestamp(attempt.beginningAt) ? attempt.beginningAt : null,
            finishedAt: best?.finishAt ?? null,
            location: attempt?.location ?? null,
            currentAttemptId: latest?.attemptId ?? null,
            currentRevision: latest?.revision ?? null,
            currentStatus: latest?.provisional && latest.status === 'completed' && !completed.some(record => record.attemptId === latest.attemptId)
                ? 'completedPending' : latest?.status ?? (latest ? latest.questionNumber == null && timestamp(latest.finishAt) ? 'completed' : 'inProgress' : null),
            currentScore: latest?.correctAnswers ?? null,
            currentBeginningAt: latest?.beginningAt ?? null,
            lastReportedAt: Math.max(0, ...records.map(record => record.receivedAt || 0)) || null,
            refreshRequestId: [...records].sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0))[0]?.requestId ?? null
        }
    }

    const rows = roster.map(student => {
        const key = normalizeStudentName(student.name)
        // A name alone cannot safely identify two different students. Keep the
        // unmatched submission visible separately rather than duplicate its score.
        const idKey = `id:${student.id}`
        const records = [...(groups.get(idKey) ?? []), ...(nameCounts.get(key) === 1 ? groups.get(key) ?? [] : [])]
        groups.delete(idKey)
        if (nameCounts.get(key) === 1) groups.delete(key)
        return row(student.id, student.name, student.phone, student.parentPhone, records, student.facebook)
    })
    for (const [key, records] of groups) rows.push(row(`answer:${key}`, records[0].studentName.trim(), '', '', records))
    const finished = rows.filter(r => r.status === 'finished')
    return {
        rows: rows.sort(compareHomeworkResultRows),
        summary: {
            finished: finished.length,
            inProgress: rows.filter(r => r.status === 'inProgress').length,
            notJoined: rows.filter(r => r.status === 'notJoined').length,
            averageScore: finished.length ? finished.reduce((total, r) => total + (r.score ?? 0), 0) / finished.length : null
        }
    }
}
