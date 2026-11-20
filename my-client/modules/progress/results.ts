import type {HomeworkResultsData} from '../utils/homeworkResults';
import {buildHomeworkResults, normalizeStudentName} from '../utils/homeworkResults';
import type {ProgressSnapshot} from './types';

// Live snapshots update provisional activity and participation counts. Official
// scores and the average remain those returned by the completed-results API.
export function applySnapshots(data: HomeworkResultsData, snapshots: ProgressSnapshot[]): HomeworkResultsData {
    const names = new Map<string, number>();
    for (const row of data.rows) {const name = normalizeStudentName(row.name); names.set(name, (names.get(name) ?? 0) + 1)}
    const matched = new Set<ProgressSnapshot>();
    const rows = data.rows.map(row => {
        const matches = snapshots.filter(s => s.studentId ? row.id === s.studentId || row.id === `answer:id:${s.studentId}` :
            names.get(normalizeStudentName(row.name)) === 1 && normalizeStudentName(s.studentName) === normalizeStudentName(row.name));
        const newest = [...matches].sort((a, b) => Date.parse(b.beginningAt!) - Date.parse(a.beginningAt!) || b.revision - a.revision)[0];
        for (const snapshot of matches) matched.add(snapshot);
        const response = [...matches].sort((a, b) => b.receivedAt - a.receivedAt)[0];
        if (!newest) return row;
        const older = (row.currentBeginningAt && Date.parse(newest.beginningAt!) < Date.parse(row.currentBeginningAt)) ||
            (row.currentAttemptId === newest.attemptId && (row.currentRevision ?? 0) > newest.revision);
        return {...row, status: row.status === 'notJoined' ? 'inProgress' : row.status,
            lastReportedAt: Math.max(row.lastReportedAt ?? 0, response.receivedAt), refreshRequestId: response.requestId,
            ...(!older ? {currentAttemptId: newest.attemptId, currentRevision: newest.revision, currentBeginningAt: newest.beginningAt,
                currentStatus: newest.status === 'completed'
                    ? row.currentAttemptId === newest.attemptId && row.currentStatus === 'completed' ? 'completed' : 'completedPending'
                    : newest.status,
                currentScore: newest.correctAnswers, questionNumber: newest.questionNumber ?? null} : {})};
    });
    const unmatched = snapshots.filter(snapshot => !matched.has(snapshot));
    rows.push(...buildHomeworkResults([], unmatched.map(snapshot => ({...snapshot, provisional: true}))).rows);
    return {...data, rows, summary: {...data.summary,
        finished: rows.filter(row => row.status === 'finished').length,
        inProgress: rows.filter(row => row.status === 'inProgress').length,
        notJoined: rows.filter(row => row.status === 'notJoined').length}};
}
