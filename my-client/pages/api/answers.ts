import type {NextApiRequest, NextApiResponse} from 'next';
import {apiError, createOnce, HttpError, requestBody, serverGet, verifyStudentToken} from '../../modules/firebase/server';
import {finalPayload, sameOwner, validAttempt} from '../../modules/progress/validation';
import type {Attempt} from '../../modules/progress/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({message: 'Request is not supported'});
    try {
        const body = requestBody(req.body);
        const uid = await verifyStudentToken(body?.idToken);
        const result = body?.result;
        if (!validAttempt(result) || result.status !== 'completed' || result.ownerUid !== uid) throw new HttpError(400, 'Invalid completed attempt.');
        const registered = await serverGet<Attempt | null>(`attemptOwners/${result.homeworkId}/${result.attemptId}`);
        if (!registered || !sameOwner(registered, result)) throw new HttpError(403, 'Attempt ownership could not be verified.');
        const [homework, exam] = await Promise.all([serverGet(`homeworks/${result.homeworkId}`), serverGet(`examinations/${result.examId}`)]);
        const questionCount = exam?.questions?.filter((q: {keys?: string[]}) => q?.keys?.length).length;
        // Allow late retries of an attempt registered before the homework expired.
        if (!homework || homework.examId !== result.examId || !questionCount || result.correctAnswers > questionCount ||
            Date.parse(result.finishAt!) < Date.parse(result.beginningAt!) || result.revision < questionCount) {
            throw new HttpError(400, 'The result does not match this homework.');
        }
        const payload = finalPayload(result);
        const stored = await createOnce<Attempt>(`completedAttempts/${result.homeworkId}/${result.attemptId}`, payload);
        if (!sameOwner(stored, payload)) throw new HttpError(409, 'This attempt ID is already in use.');
        if (stored.correctAnswers !== payload.correctAnswers || stored.finishAt !== payload.finishAt || stored.revision !== payload.revision) {
            throw new HttpError(409, 'A different final result has already been saved for this attempt.');
        }
        return res.status(200).json({success: 'Your answer has been recorded.', attemptId: stored.attemptId});
    } catch (error) {
        const failure = apiError(error);
        return res.status(failure.status).json({message: failure.message});
    }
}
