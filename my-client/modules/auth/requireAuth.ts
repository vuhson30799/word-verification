import {NextApiRequest, NextApiResponse} from "next";
import {parse} from "cookie";
import {Role, SessionPayload, verifySessionToken} from "./SessionService";

export const SESSION_COOKIE_NAME = 'wv_session'

export function getSession(req: NextApiRequest): SessionPayload | null {
    const cookieHeader = req.headers.cookie
    if (!cookieHeader) return null
    const token = parse(cookieHeader)[SESSION_COOKIE_NAME]
    if (!token) return null
    return verifySessionToken(token)
}

export function requireRole(req: NextApiRequest, res: NextApiResponse, allowedRoles: Role[]): SessionPayload | null {
    const session = getSession(req)
    if (!session) {
        res.status(401).json({message: 'Not authenticated'})
        return null
    }
    if (!allowedRoles.includes(session.role)) {
        res.status(403).json({message: 'Not authorized'})
        return null
    }
    return session
}
