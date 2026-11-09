export interface StudentData {
    id: string
    name: string
    facebook: string
    phone: string
    parentPhone: string
    classIds: string[]
}

export type StudentInput = Omit<StudentData, 'id'>

const PHONE_PATTERN = /^\+?[0-9 .-]{6,20}$/

export function getInvalidStudentMessage(input: Partial<StudentInput>): string | undefined {
    if (typeof input.name !== 'string' || !input.name.trim()) return 'Missing full name for this student'
    if (input.phone && !PHONE_PATTERN.test(input.phone)) return 'Invalid phone number'
    if (input.parentPhone && !PHONE_PATTERN.test(input.parentPhone)) return "Invalid parent's phone number"
    if (input.classIds !== undefined && (!Array.isArray(input.classIds) || input.classIds.some(id => typeof id !== 'string'))) {
        return 'Invalid classes for this student'
    }
    return undefined
}

export function normalizeStudent(input: StudentInput): StudentInput {
    return {
        name: input.name.trim(),
        facebook: (input.facebook || '').trim(),
        phone: (input.phone || '').trim(),
        parentPhone: (input.parentPhone || '').trim(),
        classIds: Array.from(new Set(input.classIds || []))
    }
}

export function initialsOf(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return '?'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
}

export function facebookHref(link: string): string {
    return /^https?:\/\//i.test(link) ? link : `https://${link}`
}

export function facebookLabel(link: string): string {
    return link.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}
