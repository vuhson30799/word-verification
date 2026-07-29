import jwt from "jsonwebtoken"

export type Role = 'admin' | 'assistant'

export interface SessionPayload {
    role: Role
    username: string
    assistantId?: string
}

const SESSION_EXPIRY = '7d'

function getSecret(): string {
    const secret = process.env.SESSION_SECRET
    if (!secret) throw new Error('SESSION_SECRET is not set')
    return secret
}

export function createSessionToken(payload: SessionPayload): string {
    return jwt.sign(payload, getSecret(), {expiresIn: SESSION_EXPIRY})
}

export function verifySessionToken(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, getSecret()) as SessionPayload
    } catch (e) {
        return null
    }
}
