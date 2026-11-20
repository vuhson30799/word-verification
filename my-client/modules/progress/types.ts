import type {StudentAnswer} from '../../pages/join';
import type {ExaminationData} from '../../pages/admin/examination';

export type AttemptStatus = 'inProgress' | 'interrupted' | 'completed';
export interface Attempt extends StudentAnswer {
    attemptId: string;
    ownerUid: string;
    revision: number;
    status: AttemptStatus;
}
export interface LocalAttempt {
    result: Attempt;
    questions: ExaminationData['questions'];
    index: number;
    feedback: boolean | null;
    answers?: {questionIndex: number; value: string; correct: boolean; answeredAt: string}[];
    questionDeadline?: number;
    pending: boolean;
    saved: boolean;
    permanentError?: string;
    active?: boolean;
}
export interface ProgressSnapshot extends Attempt {
    requestId: string;
    receivedAt: number;
}
export const POLLING_OPTIONS = [0, 300000, 600000] as const;
export const DEFAULT_POLL_INTERVAL = 0;
export function pollingInterval(value: string | null): number {
    if (value === null) return DEFAULT_POLL_INTERVAL;
    const interval = Number(value);
    return POLLING_OPTIONS.some(option => option === interval) ? interval : DEFAULT_POLL_INTERVAL;
}
export function validKey(value: unknown): value is string {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}
export function progressPath(examId: string, homeworkId: string) {
    if (!validKey(examId) || !validKey(homeworkId)) throw new Error('Invalid homework.');
    return `progress/${examId}/${homeworkId}`;
}
