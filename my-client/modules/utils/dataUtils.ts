export function toExaminations(object: any) {
    const examIds = Object.keys(object)
    return examIds.map(examId => {
        return {
            id: examId,
            title: object[examId].title,
            questions: object[examId].questions,
            createdDate: object[examId].createdDate,
            grade: object[examId].grade,
            creator: object[examId].creator
        }
    })
}

export function toHomeworks(object: any) {
    const homeworkIds = Object.keys(object)
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
    const answerIds = Object.keys(object)
    return answerIds.map(answerId => {
        return {
            id: answerId,
            examId: object[answerId].examId,
            homeworkId: object[answerId].homeworkId,
            studentName: object[answerId].studentName,
            correctAnswers: object[answerId].correctAnswers,
            beginningAt: object[answerId].beginningAt,
            finishAt: object[answerId].finishAt
        }
    })
}
