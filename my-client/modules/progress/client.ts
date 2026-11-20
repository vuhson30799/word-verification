import {getApp, getApps, initializeApp} from 'firebase/app';
import {browserLocalPersistence, getAuth, inMemoryPersistence, setPersistence, signInAnonymously, signInWithCustomToken} from 'firebase/auth';
import {getDatabase, goOffline, goOnline, onValue, ref, runTransaction, serverTimestamp, set} from 'firebase/database';
import {firebaseConfig} from '../firebase/FirebaseService';
import {progressPath} from './types';
import type {LocalAttempt, ProgressSnapshot} from './types';
import {persistAttempt} from './storage';

export class SaveError extends Error {
    constructor(message: string, public status: number) {super(message)}
    get retryable() {return this.status === 408 || this.status === 429 || this.status >= 500}
}
export async function post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(20000)});
    const data = await response.json();
    if (!response.ok) throw new SaveError(data.message || 'Could not save. Please retry.', response.status);
    return data;
}
const appFor = (name: string) => getApps().some(app => app.name === name) ? getApp(name) : initializeApp(firebaseConfig, name);
// Named apps isolate student anonymous identity from teacher custom credentials.
export function studentAuth() {return getAuth(appFor('student-progress'))}
let signingIn: Promise<ReturnType<typeof studentAuth>['currentUser']> | undefined;
export async function studentUser() {
    const auth = studentAuth();
    await auth.authStateReady();
    if (auth.currentUser) return auth.currentUser;
    if (!signingIn) signingIn = (async () => {
        await setPersistence(auth, browserLocalPersistence);
        return (await signInAnonymously(auth)).user;
    })().finally(() => {signingIn = undefined});
    const user = await signingIn;
    if (!user) throw new Error('Student authentication is unavailable.');
    return user;
}
export async function submitResult(local: LocalAttempt) {
    const user = await studentUser();
    if (user.uid !== local.result.ownerUid) throw new SaveError('This result belongs to another browser identity. Restore the original browser session to submit it.', 403);
    return post('/api/answers', {idToken: await user.getIdToken(), result: local.result});
}

export function listenForRefresh(examId: string, homeworkId: string, latest: () => LocalAttempt | undefined, onError: (message: string) => void) {
    const db = getDatabase(appFor('student-progress'));
    goOnline(db);
    const path = progressPath(examId, homeworkId);
    let initialized = false;
    const seen = new Set<string>();
    const unsubscribe = onValue(ref(db, `${path}/signal`), snapshot => {
        const signal = snapshot.val() as {requestId?: string} | null;
        const id = signal?.requestId;
        if (!initialized) {initialized = true; if (id) seen.add(id); return}
        if (!id || seen.has(id)) return;
        seen.add(id);
        const current = latest();
        if (!current || current.saved) return;
        const value = JSON.parse(JSON.stringify({...current.result, questionNumber: current.index + 1,
            requestId: id, receivedAt: serverTimestamp()}));
        // Finish the local write before sending a response. Storage failures are
        // reported by the controller; a server snapshot can still preserve it.
        void persistAttempt(current).catch(() => {}).then(() => runTransaction(ref(db, `${path}/snapshots/${current.result.attemptId}`), previous => {
            if (previous && (previous.revision > value.revision || (previous.status === 'completed' && value.status !== 'completed'))) return;
            return value;
        }, {applyLocally: false})).catch(error => onError(`Progress sync failed: ${error.message}. Ask your teacher to check Firebase authentication and database rules.`));
    }, error => onError(`Progress sync is unavailable: ${error.message}. Ask your teacher to check Firebase authentication and database rules.`));
    return () => {unsubscribe(); goOffline(db)};
}

export async function teacherConnection(examId: string, homeworkId: string) {
    const {token} = await post<{token: string}>('/api/progress/session', {teacher: true, examId, homeworkId});
    const app = appFor(`teacher-progress-${examId}-${homeworkId}`);
    const auth = getAuth(app);
    await setPersistence(auth, inMemoryPersistence);
    await signInWithCustomToken(auth, token);
    const db = getDatabase(app);
    goOnline(db);
    return db;
}
export async function requestRefresh(examId: string, homeworkId: string, onSnapshot: (snapshots: ProgressSnapshot[]) => void,
    onError: (message: string) => void, onDone: () => void, onStarted: (id: string) => void,
    cancelled: () => boolean = () => false): Promise<{requestId: string; stop: () => void}> {
    const db = await teacherConnection(examId, homeworkId);
    if (cancelled()) {goOffline(db); return {requestId: '', stop: () => {}}}
    const path = progressPath(examId, homeworkId);
    const requestId = crypto.randomUUID();
    onStarted(requestId);
    let stopped = false;
    const unsubscribe = onValue(ref(db, `${path}/snapshots`), snapshot => {
        if (!stopped) onSnapshot((Object.values(snapshot.val() ?? {}) as ProgressSnapshot[]).filter(value => value.requestId === requestId));
    }, error => {onError(`Firebase refresh failed: ${error.message}. Check authentication and database rules.`); stop()});
    const timer = setTimeout(() => stop(), 10000);
    function stop() {if (!stopped) {stopped = true; clearTimeout(timer); unsubscribe(); goOffline(db); onDone()}}
    try {await set(ref(db, `${path}/signal`), {requestId, requestedAt: serverTimestamp()})}
    catch (error) {stop(); throw error}
    return {requestId, stop};
}
