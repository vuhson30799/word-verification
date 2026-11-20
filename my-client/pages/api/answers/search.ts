import type {NextApiRequest, NextApiResponse} from 'next';
import {equalTo, get, orderByChild, query, ref} from 'firebase/database';
import {database} from '../../../modules/firebase/FirebaseService';
import {toAnswers} from '../../../modules/utils/dataUtils';
import {requireRole} from '../../../modules/auth/requireAuth';
import {apiError, requestBody, serverGet} from '../../../modules/firebase/server';
import {validKey} from '../../../modules/progress/types';
import type {Attempt, ProgressSnapshot} from '../../../modules/progress/types';

export interface AnswerSearchCriteria {examinationId: string; homeworkId: string}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Cache-Control', 'no-store');
    if (!requireRole(req, res, ['admin', 'assistant'])) return;
    if (req.method !== 'POST') return res.status(405).json({message: 'Request is not supported'});
    try {
        const criteria = requestBody(req.body);
        if (!validKey(criteria?.examinationId) || !validKey(criteria?.homeworkId)) return res.status(400).json({message: 'Invalid homework.'});
        const {examinationId: examId, homeworkId} = criteria;
        const [legacy, completed, snapshots] = await Promise.all([
            get(query(ref(database, '/answers'), orderByChild('examId'), equalTo(examId))),
            serverGet<Record<string, Attempt> | null>(`completedAttempts/${homeworkId}`),
            serverGet<Record<string, ProgressSnapshot> | null>(`progress/${examId}/${homeworkId}/snapshots`)
        ]);
        const answers = [...toAnswers(legacy.val()),
            ...Object.entries(completed ?? {}).map(([id, value]) => ({...value, id})),
            ...Object.entries(snapshots ?? {}).map(([id, value]) => ({...value, id, provisional: true}))]
            .filter(answer => answer.examId === examId && answer.homeworkId === homeworkId);
        return answers.length ? res.status(200).json(answers) : res.status(404).json({message: 'No answers found for this homework.'});
    } catch (error) {
        const failure = apiError(error);
        return res.status(failure.status).json({message: failure.message});
    }
}
