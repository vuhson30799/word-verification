import type {Attempt} from './types';
import {validKey} from './types';

export function validAttempt(value: unknown): value is Attempt {
    if (!value || typeof value !== 'object') return false;
    const a = value as Attempt;
    const location = a.location;
    return validKey(a.attemptId) && validKey(a.examId) && validKey(a.homeworkId) &&
        typeof a.ownerUid === 'string' && a.ownerUid.length > 0 && a.ownerUid.length <= 128 &&
        (a.studentId === undefined || validKey(a.studentId)) &&
        typeof a.studentName === 'string' && a.studentName.trim().length > 0 && a.studentName.length <= 150 &&
        Number.isSafeInteger(a.correctAnswers) && a.correctAnswers >= 0 &&
        Number.isSafeInteger(a.trial) && a.trial >= 1 && Number.isSafeInteger(a.revision) && a.revision >= 0 &&
        ['inProgress', 'interrupted', 'completed'].includes(a.status) &&
        typeof a.beginningAt === 'string' && Number.isFinite(Date.parse(a.beginningAt)) &&
        (a.status !== 'completed' || (typeof a.finishAt === 'string' && Number.isFinite(Date.parse(a.finishAt)))) &&
        (!location || (Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90 &&
            Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180 &&
            Number.isFinite(location.accuracyMeters) && location.accuracyMeters >= 0 &&
            typeof location.capturedAt === 'string' && Number.isFinite(Date.parse(location.capturedAt))));
}
export function sameOwner(a: Attempt, b: Attempt) {
    return a.attemptId === b.attemptId && a.ownerUid === b.ownerUid && a.examId === b.examId &&
        a.homeworkId === b.homeworkId && a.studentId === b.studentId && a.studentName === b.studentName &&
        a.trial === b.trial && a.beginningAt === b.beginningAt;
}
export function finalPayload(a: Attempt): Attempt {
    // questionNumber stays absent for compatibility with legacy result readers.
    return {attemptId: a.attemptId, ownerUid: a.ownerUid, examId: a.examId, homeworkId: a.homeworkId,
        studentName: a.studentName, ...(a.studentId ? {studentId: a.studentId} : {}),
        correctAnswers: a.correctAnswers, trial: a.trial, revision: a.revision, status: 'completed',
        beginningAt: a.beginningAt, finishAt: a.finishAt, ...(a.location ? {location: a.location} : {})};
}
