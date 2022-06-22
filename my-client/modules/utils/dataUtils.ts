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
            url: object[homeworkId].url,
            beginningDate: object[homeworkId].beginningDate,
            deadlineDate: object[homeworkId].deadlineDate
        }
    })
}
