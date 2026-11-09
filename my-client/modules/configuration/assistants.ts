export interface AssistantData {
    id: string
    name: string
    username: string
}

export interface AssistantInput {
    name: string
    username: string
    password: string
}

export const MIN_PASSWORD_LENGTH = 8

const USERNAME_PATTERN = /^\S{3,}$/

export function getInvalidPasswordMessage(password: unknown): string | undefined {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }
    return undefined
}

export function getInvalidAssistantMessage(input: Partial<AssistantInput>): string | undefined {
    if (typeof input.name !== 'string' || !input.name.trim()) return 'Missing full name for this assistant'
    if (typeof input.username !== 'string' || !USERNAME_PATTERN.test(input.username.trim())) return 'Username must be at least 3 characters and contain no spaces'
    return getInvalidPasswordMessage(input.password)
}
