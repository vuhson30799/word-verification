import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, get, orderByChild, query, ref} from "firebase/database";
import {stringifySetCookie} from "cookie";
import {database} from "../../../modules/firebase/FirebaseService";
import {verifyPassword} from "../../../modules/auth/PasswordService";
import {createSessionToken} from "../../../modules/auth/SessionService";
import {SESSION_COOKIE_NAME} from "../../../modules/auth/requireAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST':
            return login(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function login(req: NextApiRequest, res: NextApiResponse) {
    const {username, password} = JSON.parse(req.body)
    if (!username || !password) {
        return res.status(401).json({message: 'Invalid credentials'})
    }

    if (username === process.env.ADMIN_USERNAME) {
        const adminHash = process.env.ADMIN_PASSWORD_HASH
        const valid = adminHash ? await verifyPassword(password, adminHash) : false
        if (!valid) return res.status(401).json({message: 'Invalid credentials'})
        return issueSession(res, {role: 'admin', username})
    }

    const snapshot = await get(query(ref(database, '/assistants'), orderByChild('username'), equalTo(username)))
    if (!snapshot.val()) {
        return res.status(401).json({message: 'Invalid credentials'})
    }
    const [assistantId, assistant] = Object.entries<any>(snapshot.val())[0]
    const valid = await verifyPassword(password, assistant.passwordHash)
    if (!valid) return res.status(401).json({message: 'Invalid credentials'})
    return issueSession(res, {role: 'assistant', username, assistantId})
}

function issueSession(res: NextApiResponse, payload: {role: 'admin' | 'assistant', username: string, assistantId?: string}) {
    const token = createSessionToken(payload)
    res.setHeader('Set-Cookie', stringifySetCookie({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    }))
    return res.status(200).json({role: payload.role})
}
