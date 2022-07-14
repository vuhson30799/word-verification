import {isEmpty, sortBy} from "lodash";

export interface StudentResult {
    name: string
    grade: string
    wrongQuestions: string[]
}

export interface QuestionResult {
    question: string
    studentNames: string[]
}

export interface Messages {
    warningMessages: string[]
    errorMessages: string[]
}

export function generateStudentResults(input: string): { studentResults: StudentResult[], messages: Messages } {
    const studentResults: StudentResult[] = []
    const messages: Messages = {
        warningMessages: [],
        errorMessages: []
    }
    const lines: string[] = input.split("\n")
    lines.forEach((line, index) => {
        if (isEmpty(line)) {
            messages.warningMessages.push(`Empty string at line ${index + 1}`)
            return
        }
        const [name, grade, wrongQuestions] = line.split("|")
        if (!validateInput(name, grade, wrongQuestions, messages, index)) return

        const wrongQuestionList = wrongQuestions.trim()
            .split(",")
            .map((question) => question.trim())
        studentResults.push({
            name: name.trim(),
            grade: grade? grade.trim() : "",
            wrongQuestions: wrongQuestionList
        })
    })
    return {studentResults, messages}
}

export function generateQuestionResults(studentResults: StudentResult[], gradeToGroup: string): QuestionResult[] {
    const questionResults: Record<string, string[]> = {}
    const filteredStudentResults = studentResults.filter((studentResult) => studentResult.grade === gradeToGroup)
    filteredStudentResults.forEach((studentResult) => {
        studentResult.wrongQuestions.forEach((wrongQuestion) => {

            questionResults[wrongQuestion]
                ? questionResults[wrongQuestion].push(studentResult.name)
                : questionResults[wrongQuestion] = [studentResult.name]
        })
    })
    const questionResultList: QuestionResult[] = []
    Object.entries(questionResults).forEach((questionResult) => {
        questionResultList.push({
            question: questionResult[0],
            studentNames: questionResult[1]
        })
    })
    return sortBy(questionResultList, [function (questionResult: QuestionResult) {
        return parseFloat(questionResult.question)
    }])
}

export function generateFileResult(questionResults: QuestionResult[]): Blob {
    const lines = questionResults.map(question => `${question.question}\t| ${question.studentNames.join(" , ")}\n`)
    return new Blob(lines, {
        type: "text/plain"
    })
}

function validateInput(name: string, grade: string, wrongQuestions: string, messages: Messages, lineNumber: number): boolean {
    if (!name || !grade || !wrongQuestions) {
        messages.errorMessages.push(`Missing name or grade or wrong questions at line ${lineNumber + 1}`)
        return false
    }

    const wrongQuestionList: string[] = wrongQuestions.split(",")
    if (isEmpty(wrongQuestionList)) {
        messages.errorMessages.push(`Wrong questions should be separated with comma at line ${lineNumber + 1}`)
        return false
    }

    wrongQuestionList.forEach((question) => {
        if (isNaN(parseFloat(question))) {
            messages.errorMessages.push(`Wrong format for question "${question}" at line ${lineNumber + 1}`)
        }
    })

    return isEmpty(messages.errorMessages);


}

