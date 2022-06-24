import {NextApiRequest, NextApiResponse} from "next";
import {ExaminationData} from "../admin/examination";
import {applicationEncoding, encodingKey} from "../../constant/ApplicationConstant";
import {HomeworkData} from "../admin/examination/[pid]/homework";
import {goOffline, goOnline} from "@firebase/database";
import {database} from "../../modules/firebase/FirebaseService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {examId, beginningDate, deadlineDate} = req.query
    if (req.method === 'GET') {
        goOnline(database)
        if (!req.headers.referer) {
            res.status(400).json({message: 'There are something wrong with this request.\nPlease contact admin for more information'})
            return
        }
        const url = new URL(req.headers.referer)
        const homeworkData = await fetch(`${url.origin}/api/exams/${examId}/homeworks`, {method: 'GET'})
        const homework: HomeworkData[] = await homeworkData.json()
        if (validateHomework(homework, <string> beginningDate, <string> deadlineDate)) {
            const examinationData = await fetch(`${url.origin}/api/exams/${examId}`, {method: 'GET'})
            const examination: ExaminationData = await examinationData.json()
            res.status(200).json(encodeExamination(examination))
        } else {
            res.status(400).json({message: 'This homework is no longer valid.'})
        }
        goOffline(database)
    }
}

function validateHomework(homeworkData: HomeworkData[], beginningDate: string, deadlineDate: string): boolean {
    return homeworkData.some((homework) => {
        if (homework.deadlineDate !== deadlineDate || homework.beginningDate !== beginningDate) return false
        const deadline = new Date(homework.deadlineDate)
        const now = new Date()
        return  now.getTime() < deadline.getTime()
    })
}

function encodeExamination(examinationData: ExaminationData): ExaminationData {
    const encodedQuestions = examinationData.questions.filter(question => !!question.keys).map((question) => {
        const encodedKeys = question.keys.map((key) => {
            return Buffer.from(Buffer.from(key).toString(applicationEncoding).concat(encodingKey)).toString(applicationEncoding)
        })
        return {
            title: question.title,
            timeout: question.timeout,
            questionType: question.questionType,
            keys: encodedKeys
        }

    })
    return {
        id: examinationData.id,
        title: examinationData.title,
        creator: examinationData.creator,
        grade: examinationData.grade,
        createdDate: examinationData.createdDate,
        questions: encodedQuestions
    }
}
