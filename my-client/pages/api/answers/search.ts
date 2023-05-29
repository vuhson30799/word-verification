import {NextApiRequest, NextApiResponse} from "next";
import {CollectionType, getCollection} from "../../../modules/firebase/FirebaseService";
import {toAnswers} from "../../../modules/utils/dataUtils";
import {getDocs, query, where} from "@firebase/firestore";

export interface AnswerSearchCriteria {
    examinationId: string
    homeworkId: string
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST':
            await searchAnswers(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

async function searchAnswers(req: NextApiRequest, res: NextApiResponse) {
    const criteria = <AnswerSearchCriteria> JSON.parse(req.body)
    if (criteria) {
        const answerQuery = query(getCollection(CollectionType.ANSWER), where('examId', '==', `${criteria.examinationId}`))
        const snapshot = await getDocs(answerQuery)
        if (!snapshot.empty) {
            return res.status(200).json(toAnswers(snapshot).filter((answer) => answer.homeworkId === criteria.homeworkId))
        }
        return res.status(404).json({message: `No answer found for exam ${criteria.examinationId} with homework ${criteria.homeworkId}`})
    }
}
