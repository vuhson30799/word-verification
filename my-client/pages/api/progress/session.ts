import type {NextApiRequest, NextApiResponse} from 'next';
import {createHash} from 'node:crypto';
import {requireRole} from '../../../modules/auth/requireAuth';
import {apiError, createOnce, customToken, HttpError, requestBody, serverGet, serverSet, verifyStudentToken} from '../../../modules/firebase/server';
import {decodeHomeworkUrl} from '../../../modules/utils/dataUtils';
import {validKey} from '../../../modules/progress/types';
import {sameOwner, validAttempt} from '../../../modules/progress/validation';
import type {Attempt} from '../../../modules/progress/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({message: 'Request is not supported'});
    try {
        const body = requestBody(req.body);
        if (body?.teacher) {
            const session = requireRole(req, res, ['admin', 'assistant']);
            if (!session) return;
            if (!validKey(body.examId) || !validKey(body.homeworkId)) throw new HttpError(400, 'Invalid homework.');
            const homework = await serverGet(`homeworks/${body.homeworkId}`);
            if (!homework || homework.examId !== body.examId) throw new HttpError(404, 'Homework not found.');
            const uid = 'teacher-' + createHash('sha256').update(`${session.role}:${session.username}:${body.examId}:${body.homeworkId}`).digest('hex');
            return res.status(200).json({token: customToken(uid, {teacher: true, examId: body.examId, homeworkId: body.homeworkId, accessUntil: Date.now() + 3600000})});
        }
        const uid = await verifyStudentToken(body?.idToken);
        const attempt = body?.attempt;
        if (!validAttempt(attempt) || attempt.ownerUid !== uid || attempt.status !== 'inProgress' || attempt.correctAnswers !== 0 || attempt.revision !== 0) {
            throw new HttpError(400, 'Invalid new attempt.');
        }
        let link;
        try {link = body.link?.q ? decodeHomeworkUrl(body.link.q) : body.link}
        catch {throw new HttpError(400, 'Invalid homework link.')}
        if (!link || link.examId !== attempt.examId) throw new HttpError(400, 'Invalid homework link.');
        const [homework, exam] = await Promise.all([serverGet(`homeworks/${attempt.homeworkId}`), serverGet(`examinations/${attempt.examId}`)]);
        if (!homework || !exam || homework.examId !== attempt.examId || homework.beginningDate !== link.beginningDate || homework.deadlineDate !== link.deadlineDate ||
            !Number.isFinite(Date.parse(homework.deadlineDate)) || Date.parse(homework.deadlineDate) <= Date.now()) {
            throw new HttpError(400, 'This homework is no longer valid.');
        }
        if (Array.isArray(homework.studentIds) && (!attempt.studentId || !homework.studentIds.includes(attempt.studentId))) {
            throw new HttpError(403, 'Please select an assigned student.');
        }
        if (attempt.studentId) {
            const student = await serverGet(`students/${attempt.studentId}`);
            if (!student || student.name.trim() !== attempt.studentName.trim()) throw new HttpError(400, 'Student identity does not match the selected name.');
        }
        // Roster selection retains the identity assurance of public join links;
        // authenticated ownership prevents another browser editing this attempt.
        const registered = await createOnce<Attempt & {questionCount: number}>(`attemptOwners/${attempt.homeworkId}/${attempt.attemptId}`, {...attempt, questionCount: exam.questions.filter((q: {keys?: string[]}) => q?.keys?.length).length});
        if (!sameOwner(registered, attempt)) throw new HttpError(409, 'This attempt belongs to another session.');
        await serverSet(`progressAccess/${uid}/${attempt.examId}/${attempt.homeworkId}`, true);
        return res.status(200).json({success: true});
    } catch (error) {
        const failure = apiError(error);
        return res.status(failure.status).json({message: failure.message});
    }
}
