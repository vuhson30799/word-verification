export function defaultMaximumIncorrectAnswers(questionCount: number): number {
    return Math.floor(questionCount / 10)
}

export function isValidMaximumIncorrectAnswers(value: unknown, questionCount: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= questionCount
}

export function maximumIncorrectAnswers(examination: {maximumIncorrectAnswers?: number; questions?: unknown[]}): number {
    return examination.maximumIncorrectAnswers ?? defaultMaximumIncorrectAnswers(examination.questions?.length ?? 0)
}

export function hasPassedExamination(correctAnswers: number, questionCount: number, maximumIncorrectAnswers: number): boolean {
    return questionCount - correctAnswers <= maximumIncorrectAnswers
}
