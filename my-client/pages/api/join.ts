import {NextApiRequest, NextApiResponse} from "next";
import {ExaminationData} from "../admin/examination";
import {applicationEncoding, encodingKey} from "../../constant/ApplicationConstant";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {examId, beginningDate, deadlineDate} = req.query
    if (req.method === 'GET') {
        validateHomework(<string>examId, <string>beginningDate, <string>deadlineDate)

        fetch(`http://${req.headers.host}/api/exams/${examId}`, {method: 'GET'})
            .then(response => response.json().then(value => res.status(200).json(encodeExamination(value))))
    }
}

function validateHomework(examId: string, beginningDate: string, deadlineDate: string): boolean {
    return true
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
