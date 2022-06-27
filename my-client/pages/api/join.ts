import {NextApiRequest, NextApiResponse} from "next";
import {ExaminationData} from "../admin/examination";
import {encoding} from "../../constant/ApplicationConstant";
import {HomeworkData} from "../admin/examination/[pid]/homework";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            await retrieveExaminationForHomework(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

async function retrieveExaminationForHomework(req: NextApiRequest, res: NextApiResponse) {
    const {examId, beginningDate, deadlineDate} = req.query
    if (!req.headers.referer) {
        res.status(400).json({message: 'There are something wrong with this request.\nPlease contact admin for more information'})
        return
    }
    const url = new URL(req.headers.referer)
    const homeworkData = await fetch(`${url.origin}/api/exams/${examId}/homeworks`, {method: 'GET'})
    if (homeworkData.status !== 200) {
        const response = await homeworkData.json()
        res.status(400).json({message: response.message})
        return
    }

    const homework: HomeworkData[] = await homeworkData.json()
    if (validateHomework(homework, <string> beginningDate, <string> deadlineDate)) {
        const examinationData = await fetch(`${url.origin}/api/exams/${examId}`, {method: 'GET'})
        if (examinationData.status !== 200) {
            const response = await examinationData.json()
            res.status(examinationData.status).json({message: response.message})
            return
        }
        const examination: ExaminationData = await examinationData.json()

        res.status(200).json(encodeExamination(examination))
    } else {
        res.status(400).json({message: 'This homework is no longer valid.'})
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
            return Buffer.from(Buffer.from(key.toLowerCase()).toString(encoding).concat(`${process.env.NEXT_PUBLIC_ENCODING_KEY}`)).toString(encoding)
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
