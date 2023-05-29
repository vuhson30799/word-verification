import {QuerySnapshot} from "@firebase/firestore";

export function toExaminations(querySnapshot: QuerySnapshot) {
    const examSnaps = querySnapshot.docs
    return examSnaps.map(examSnap => {
        const exam = examSnap.data()
        return {
            id: examSnap.id,
            title: exam.title,
            questions: exam.questions,
            createdDate: exam.createdDate,
            grade: exam.grade,
            creator: exam.creator
        }
    })
}

export function toHomeworks(querySnapshot: QuerySnapshot) {
    const homeworkSnaps = querySnapshot.docs
    return homeworkSnaps.map(homeworkSnap => {
        const homework = homeworkSnap.data()
        return {
            id: homeworkSnap.id,
            url: homework.url,
            beginningDate: homework.beginningDate,
            deadlineDate: homework.deadlineDate
        }
    })
}

export function toAnswers(querySnapshot: QuerySnapshot) {
    const answerSnaps = querySnapshot.docs
    return answerSnaps.map(answerSnap => {
        const answer = answerSnap.data()
        return {
            id: answerSnap.id,
            examId: answer.examId,
            homeworkId: answer.homeworkId,
            studentName: answer.studentName,
            correctAnswers: answer.correctAnswers,
            trial: answer.trial,
            questionNumber: answer.questionNumber,
            beginningAt: answer.beginningAt,
            finishAt: answer.finishAt
        }
    })
}
