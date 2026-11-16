import {NextApiRequest, NextApiResponse} from "next";
import type {ExaminationData} from "../admin/examination";
import {encoding} from "../../constant/ApplicationConstant";
import type {HomeworkData} from "../admin/examination/[examinationId]/homework";
import type {HomeworkExam} from "../join";
import {decodeHomeworkUrl, toHomeworks} from "../../modules/utils/dataUtils";
import {equalTo, get, orderByChild, query, ref} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";

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
    try {
        const {examId, beginningDate, deadlineDate} = req.query.q
            ? decodeHomeworkUrl(`${req.query.q}`)
            : req.query
        if (typeof examId !== 'string' || !examId || /[.#$\[\]\/]/.test(examId) ||
            typeof beginningDate !== 'string' || typeof deadlineDate !== 'string') {
            return res.status(400).json({message: 'Invalid homework link.'})
        }
        // Public homework links must work without an admin session. Read the
        // specific homework here rather than calling authenticated admin APIs.
        const snapshot = await get(query(ref(database, '/homeworks'), orderByChild('examId'), equalTo(examId)))
        const homework = toHomeworks(snapshot.val()).find(item =>
            item.beginningDate === beginningDate && item.deadlineDate === deadlineDate)
        if (!homework || !validateHomework(homework)) {
            return res.status(400).json({message: 'This homework is no longer valid.'})
        }
        const examinationSnapshot = await get(ref(database, `/examinations/${examId}`))
        const examination = examinationSnapshot.val() as ExaminationData | null
        if (!examination) return res.status(404).json({message: 'This examination no longer exists.'})
        const homeworkExam: HomeworkExam = {
            examination: encodeExamination({...examination, id: examId}),
            homeworkId: homework.id
        }
        return res.status(200).json(homeworkExam)
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Could not decode homework url:')) {
            return res.status(400).json({message: 'Invalid homework link.'})
        }
        return res.status(500).json({message: 'Could not load this homework. Please try again.'})
    }
}

function validateHomework(homework: HomeworkData): boolean {
    const deadline = new Date(homework.deadlineDate)
    const now = new Date()
    return  now.getTime() < deadline.getTime()
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
        maximumIncorrectAnswers: examinationData.maximumIncorrectAnswers,
        questions: encodedQuestions
    }
}
