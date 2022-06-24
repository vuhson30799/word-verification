import {onValue, push, ref} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";
import {NextApiRequest, NextApiResponse} from "next";
import {ExaminationData} from "../admin/examination";
import {toExaminations} from "../../modules/utils/dataUtils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        console.log('Getting examination from database.')
        onValue(ref(database, `/examinations`), (snapshot => {
            const examinations = toExaminations(snapshot.val())
            if (!!examinations) {
                res.status(200).json(examinations)
                console.log(`${examinations.length} examination are got from database.`)
            } else {
                res.status(404).send({message: 'Getting examinations failed.'})
                console.log('Error when try getting examination.')
            }
        }));
    }

    if (req.method === 'POST') {
        const examination = <ExaminationData>JSON.parse(req.body)
        const invalidMessage = getInvalidMessage(examination)
        if (!!invalidMessage) {
            res.status(400).send({message: invalidMessage})
            return
        }
        push(ref(database, '/examinations'), examination)
        //TODO: return 204 status code
        res.status(200).json({message: 'success'})
    }

}

function getInvalidMessage(examination: ExaminationData): string | undefined {
    if (!examination.title) return 'Missing title for this examination'
    if (!examination.grade) return 'Missing grade for this examination'
    if (!examination.creator) return 'Missing creator for this examination'
    if (!examination.questions || examination.questions.length == 0) return 'Missing questions for this examination'

    return undefined
}
