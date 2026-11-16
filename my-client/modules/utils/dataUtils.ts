import {ClassData} from "../configuration/classes";
import {AssistantData} from "../configuration/assistants";
import {StudentData} from "../configuration/students";
import {decoding, encoding} from "../../constant/ApplicationConstant";
import {AssignHomeworkData} from "../../components/AssignHomeWorkModal";

export function toExaminations(object: any) {
    const examIds = Object.keys(object || {})
    return examIds.map(examId => {
        return {
            id: examId,
            title: object[examId].title,
            questions: object[examId].questions,
            createdDate: object[examId].createdDate,
            grade: object[examId].grade,
            minimumCorrectAnswers: object[examId].minimumCorrectAnswers,
            creator: object[examId].creator
        }
    })
}

export function toHomeworks(object: any) {
    const homeworkIds = Object.keys(object || {})
    return homeworkIds.map(homeworkId => {
        return {
            id: homeworkId,
            url: object[homeworkId].url,
            beginningDate: object[homeworkId].beginningDate,
            deadlineDate: object[homeworkId].deadlineDate
        }
    })
}

export function toAnswers(object: any) {
    const answerIds = Object.keys(object || {})
    return answerIds.map(answerId => {
        return {
            id: answerId,
            examId: object[answerId].examId,
            homeworkId: object[answerId].homeworkId,
            studentName: object[answerId].studentName,
            correctAnswers: object[answerId].correctAnswers,
            trial: object[answerId].trial,
            questionNumber: object[answerId].questionNumber,
            beginningAt: object[answerId].beginningAt,
            finishAt: object[answerId].finishAt,
            location: object[answerId].location
        }
    })
}

export function encodeHomeworkUrl(examId: string, assignHomeworkData: AssignHomeworkData) {
    return Buffer.from(`${examId}|${assignHomeworkData.beginningDate}|${assignHomeworkData.deadlineDate}`, decoding).toString(encoding)
}

export function decodeHomeworkUrl(url: string) {
    const inputs = Buffer.from(url, encoding).toString(decoding).split('|')
    if (inputs.length !== 3) {
        throw new Error(`Could not decode homework url: ${url}`)
    }
    return {
        examId: inputs[0],
        beginningDate: inputs[1],
        deadlineDate: inputs[2]
    }
}

export function toClasses(classes: any, students: any): ClassData[] {
    const studentCounts: Record<string, number> = {}
    Object.values<any>(students || {}).forEach(student => {
        ;(student.classIds || []).forEach((classId: string) => {
            studentCounts[classId] = (studentCounts[classId] || 0) + 1
        })
    })
    return Object.keys(classes || {}).map(classId => ({
        id: classId,
        name: classes[classId].name,
        grade: classes[classId].grade,
        academicYear: classes[classId].academicYear,
        studentCount: studentCounts[classId] || 0
    }))
}

export function toStudents(students: any): StudentData[] {
    return Object.keys(students || {}).map(studentId => ({
        id: studentId,
        name: students[studentId].name,
        facebook: students[studentId].facebook || '',
        phone: students[studentId].phone || '',
        parentPhone: students[studentId].parentPhone || '',
        classIds: students[studentId].classIds || []
    }))
}

export function toAssistants(assistants: any): AssistantData[] {
    return Object.keys(assistants || {}).map(assistantId => ({
        id: assistantId,
        name: assistants[assistantId].name || assistants[assistantId].username,
        username: assistants[assistantId].username
    }))
}
