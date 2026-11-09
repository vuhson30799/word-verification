export interface ClassData {
    id: string
    name: string
    grade: number
    academicYear: string
    studentCount: number
}

export type ClassInput = Pick<ClassData, 'name' | 'grade' | 'academicYear'>

const ACADEMIC_YEAR_PATTERN = /^(\d{4})-(\d{4})$/

export function isValidAcademicYear(value: unknown): value is string {
    if (typeof value !== 'string') return false
    const match = ACADEMIC_YEAR_PATTERN.exec(value)
    return !!match && Number(match[2]) === Number(match[1]) + 1
}

export function academicYearOf(startYear: number): string {
    return `${startYear}-${startYear + 1}`
}

/** Academic years start in September. */
export function currentAcademicYear(today: Date = new Date()): string {
    return academicYearOf(today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1)
}

export function nextAcademicYear(academicYear: string): string {
    return academicYearOf(Number(academicYear.slice(0, 4)) + 1)
}

export function formatAcademicYear(academicYear: string): string {
    return academicYear.replace('-', ' – ')
}

export function getInvalidClassMessage(input: Partial<ClassInput>): string | undefined {
    if (!input.name || !input.name.trim()) return 'Missing name for this class'
    if (!Number.isInteger(input.grade) || input.grade! < 1 || input.grade! > 12) return 'Grade must be a number between 1 and 12'
    if (!isValidAcademicYear(input.academicYear)) return 'Missing or invalid academic year for this class'
    return undefined
}
