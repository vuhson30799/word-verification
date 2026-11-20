// Server-only Firebase REST adapter. Uses the existing JWT library, without
// adding an authentication SDK to browser bundles or depending on public rules.
import jwt, {type JwtPayload} from 'jsonwebtoken';

export class HttpError extends Error {
    constructor(public status: number, message: string) {super(message)}
}
let access: {token: string; expires: number} | undefined;
let certificates: {keys: Record<string, string>; expires: number} | undefined;

function credentials() {
    const email = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    if (!email || !privateKey || !projectId) throw new HttpError(503, 'Firebase server credentials are not configured. Ask the administrator to configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.');
    return {email, privateKey, projectId};
}

export function customToken(uid: string, claims: Record<string, unknown>) {
    const {email, privateKey} = credentials();
    return jwt.sign({uid, claims}, privateKey, {algorithm: 'RS256', issuer: email, subject: email,
        audience: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', expiresIn: '1h'});
}

async function accessToken() {
    if (access && access.expires > Date.now() + 60000) return access.token;
    const {email, privateKey} = credentials();
    const assertion = jwt.sign({scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email'}, privateKey,
        {algorithm: 'RS256', issuer: email, audience: 'https://oauth2.googleapis.com/token', expiresIn: '1h'});
    const response = await fetch('https://oauth2.googleapis.com/token', {method: 'POST',
        body: new URLSearchParams({grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion}), signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw new HttpError(503, 'Firebase service account authorization failed. Ask the administrator to check the service account configuration.');
    const data = await response.json();
    access = {token: data.access_token, expires: Date.now() + data.expires_in * 1000};
    return access.token;
}

export async function verifyStudentToken(token: unknown): Promise<string> {
    if (typeof token !== 'string') throw new HttpError(401, 'Student authentication is required.');
    const decoded = jwt.decode(token, {complete: true});
    if (!decoded || decoded.header.alg !== 'RS256' || !decoded.header.kid) throw new HttpError(401, 'Invalid student authentication.');
    if (!certificates || certificates.expires <= Date.now()) {
        const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', {signal: AbortSignal.timeout(15000)});
        if (!response.ok) throw new HttpError(503, 'Firebase authentication verification is unavailable.');
        const seconds = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 300);
        certificates = {keys: await response.json(), expires: Date.now() + seconds * 1000};
    }
    const key = certificates.keys[decoded.header.kid];
    if (!key) throw new HttpError(401, 'Invalid student authentication.');
    const project = process.env.NEXT_PUBLIC_PROJECT_ID;
    if (!project) throw new HttpError(503, 'Firebase project ID is not configured.');
    let payload: JwtPayload;
    try {
        payload = jwt.verify(token, key, {algorithms: ['RS256'], audience: project, issuer: `https://securetoken.google.com/${project}`}) as JwtPayload;
    } catch {throw new HttpError(401, 'Student authentication expired. Please retry.')}
    if (!payload.sub || payload.sub.length > 128 || typeof payload.exp !== 'number' || typeof payload.iat !== 'number' ||
        payload.iat > Date.now() / 1000 || typeof payload.auth_time !== 'number' || payload.auth_time > Date.now() / 1000 || payload.teacher) {
        throw new HttpError(401, 'Invalid student authentication.');
    }
    return payload.sub;
}

export async function serverRequest(path: string, init: RequestInit = {}) {
    const base = process.env.NEXT_PUBLIC_DATABASE_URL;
    if (!base) throw new HttpError(503, 'Firebase database URL is not configured.');
    const response = await fetch(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}.json`, {
        ...init, headers: {...init.headers, Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json'}, signal: AbortSignal.timeout(15000)
    });
    if (response.status === 412) return response;
    if (!response.ok) throw new HttpError(503, 'Firebase database request failed. Ask the administrator to check database access and service account configuration.');
    return response;
}
export async function serverGet<T = any>(path: string): Promise<T> {
    return (await serverRequest(path)).json();
}
export async function serverSet(path: string, value: unknown) {
    await serverRequest(path, {method: 'PUT', body: JSON.stringify(value)});
}
// Conditional writes retry conflicts, without ever overwriting a completed attempt.
export async function createOnce<T>(path: string, value: T): Promise<T> {
    for (let retry = 0; retry < 5; retry++) {
        const response = await serverRequest(path, {headers: {'X-Firebase-ETag': 'true'}});
        const existing = await response.json();
        if (existing !== null) return existing as T;
        const etag = response.headers.get('etag');
        if (!etag) throw new HttpError(503, 'Firebase did not return a write precondition.');
        const saved = await serverRequest(path, {method: 'PUT', headers: {'if-match': etag}, body: JSON.stringify(value)});
        if (saved.status !== 412) return value;
    }
    throw new HttpError(503, 'Another save is in progress. Please retry.');
}
export function requestBody(body: unknown): any {
    try {return typeof body === 'string' ? JSON.parse(body) : body}
    catch {throw new HttpError(400, 'Invalid request body.')}
}
export function apiError(error: unknown) {
    if (error instanceof Error && /Index not defined|PERMISSION_DENIED|permission.denied|invalid.api.key|operation.not.allowed/i.test(error.message)) {
        return {status: 503, message: `Firebase configuration error: ${error.message}. Ask the administrator to update the relevant database indexes, security rules, or Authentication settings.`};
    }
    return {status: error instanceof HttpError ? error.status : 503,
        message: error instanceof HttpError ? error.message : 'The save service is temporarily unavailable. Please retry.'};
}
