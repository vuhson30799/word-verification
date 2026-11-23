import {get, equalTo, orderByChild, query, ref} from 'firebase/database';
import {database} from '../firebase/FirebaseService';
import {HttpError, serverGet, serverRequest} from '../firebase/server';
import {validKey} from './types';
import type {Attempt} from './types';

async function homeworkUpdates(examId: string, homeworkId: string) {
    const owners = await serverGet<Record<string, Attempt> | null>(`attemptOwners/${homeworkId}`);
    const updates: Record<string, null> = {
        [`homeworks/${homeworkId}`]: null,
        [`completedAttempts/${homeworkId}`]: null,
        [`attemptOwners/${homeworkId}`]: null
    };
    for (const owner of Object.values(owners ?? {})) updates[`progressAccess/${owner.ownerUid}/${examId}/${homeworkId}`] = null;
    return updates;
}

export async function deleteStudentData(examId: unknown, homeworkId?: unknown) {
    if (!validKey(examId) || (homeworkId !== undefined && !validKey(homeworkId))) throw new HttpError(400, 'Invalid homework or examination.');
    const answers = await get(query(ref(database, '/answers'), orderByChild('examId'), equalTo(examId)));
    const updates: Record<string, null> = {};
    if (homeworkId !== undefined) {
        const homework = await serverGet(`homeworks/${homeworkId}`);
        if (!homework || homework.examId !== examId) throw new HttpError(404, 'Homework not found.');
        Object.assign(updates, await homeworkUpdates(examId, homeworkId));
        updates[`progress/${examId}/${homeworkId}`] = null;
    } else {
        const homeworks = await get(query(ref(database, '/homeworks'), orderByChild('examId'), equalTo(examId)));
        for (const id of Object.keys(homeworks.val() ?? {})) Object.assign(updates, await homeworkUpdates(examId, id));
        updates[`examinations/${examId}`] = null;
        updates[`progress/${examId}`] = null;
    }
    for (const [id, answer] of Object.entries(answers.val() ?? {}) as [string, Attempt][]) {
        if (answer.examId === examId && (homeworkId === undefined || answer.homeworkId === homeworkId)) updates[`answers/${id}`] = null;
    }
    // One atomic server-authorized update covers both legacy and protected paths.
    await serverRequest('', {method: 'PATCH', body: JSON.stringify(updates)});
}
