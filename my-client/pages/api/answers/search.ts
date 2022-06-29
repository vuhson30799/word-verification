import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, onValue, orderByChild, query, ref} from "firebase/database";
import {database} from "../../../modules/firebase/FirebaseService";
import {toAnswers} from "../../../modules/utils/dataUtils";
import {StudentAnswer} from "../../join";
import {groupBy, maxBy, uniq} from "lodash";

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
                const answers: StudentAnswer[] = toAnswers(snapshot.val()).filter((answer) => answer.homeworkId === criteria.homeworkId)
                const studentNames = uniq(answers.map(answer => answer.studentName))
                const groupedAnswers = groupBy(answers, 'studentName')
                let response: StudentAnswer[] = []
                studentNames.forEach((studentName) => {
                    const max = maxBy(groupedAnswers[studentName], 'correctAnswers')
                    if (max) response.push(max)
                })
                res.status(200).json(response)
            } else {
                res.status(404).json({message: `No answer found for exam ${criteria.examinationId} with homework ${criteria.homeworkId}`})
            }
        })
    }
}
