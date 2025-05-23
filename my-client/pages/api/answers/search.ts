import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, onValue, orderByChild, query, ref} from "firebase/database";
import {database} from "../../../modules/firebase/FirebaseService";
import {toAnswers} from "../../../modules/utils/dataUtils";

export interface AnswerSearchCriteria {
    examinationId: string
    homeworkId: string
}
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST':
            searchAnswers(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

function searchAnswers(req: NextApiRequest, res: NextApiResponse) {
    const criteria = <AnswerSearchCriteria> JSON.parse(req.body)
    if (criteria) {
        onValue(query(ref(database, `/answers`), orderByChild('examId'),
            equalTo(`${criteria.examinationId}`)), (snapshot) => {
            if (snapshot.val()) {
                return res.status(200).json(toAnswers(snapshot.val()).filter((answer) => answer.homeworkId === criteria.homeworkId))
            }
            return res.status(404).json({message: `No answer found for exam ${criteria.examinationId} with homework ${criteria.homeworkId}`})
        })
    }
}
