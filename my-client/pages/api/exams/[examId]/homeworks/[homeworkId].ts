import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, onValue, orderByChild, query, ref, update} from "firebase/database";
import {database} from "../../../../../modules/firebase/FirebaseService";
import {toAnswers} from "../../../../../modules/utils/dataUtils";
import {StudentAnswer} from "../../../../join";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'DELETE':
            return deleteHomework(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function deleteHomework(req: NextApiRequest, res: NextApiResponse) {
    const {examId, homeworkId} = req.query
    const updates: Record<string, any> = {}

    // delete homework
    updates[`/homeworks/${homeworkId}`] = null
    // delete all answer related
    await onValue(query(ref(database, `/answers`), orderByChild('examId'),
        equalTo(`${examId}`)), (snapshot) => {
        if (snapshot.val()) {
            const answers: StudentAnswer[] = toAnswers(snapshot.val()).filter((answer) => answer.homeworkId === homeworkId)
            answers.forEach(answer => {
                if (answer.id) updates[`/answers/${answer.id}`] = null
            })
        }
    })

    await update(ref(database), updates);
    return res.status(200).json({message: 'This homework is deleted successfully. All students answers are also deleted accordingly.'})
}
