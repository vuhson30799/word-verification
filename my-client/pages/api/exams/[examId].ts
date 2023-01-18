import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, get, onValue, orderByChild, query, ref, set, update} from "firebase/database";
import {database} from "../../../modules/firebase/FirebaseService";
import {ExaminationData} from "../../admin/examination";
import {toAnswers, toHomeworks} from "../../../modules/utils/dataUtils";
import {StudentAnswer} from "../../join";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            return retrieveExamination(req, res)
        case 'DELETE':
            return deleteExamination(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

function retrieveExamination(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    console.log(`Retrieving examination ${examId} from database.`)
    onValue(ref(database, `/examinations/${examId}`), (snapshot) => {
        const examinationData = <ExaminationData> snapshot.val()
        if (examinationData) {
            res.status(200).json(examinationData)
            console.log(`Retrieved examination ${examId} from database.`)
        } else {
            res.status(404).json({message: `Examination with id: ${examId} not found `})
            console.log(`Error when try retrieving examination ${examId} from database.`)
        }
    }, {
        onlyOnce: true
    })
}

async function deleteExamination(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    const updates: Record<string, any> = {}
    // delete examination
    updates[`/examinations/${examId}`] = null
    // delete homework of this examination
    await onValue(query(ref(database, `/homeworks`), orderByChild('examId'),
        equalTo(`${examId}`)), async (snapshot) => {
        if (snapshot.val()) {
            const homeworkData = toHomeworks(snapshot.val())
            for (const homework of homeworkData) {
                updates[`/homeworks/${homework.id}`] = null
                // delete all answer related
                await onValue(query(ref(database, `/answers`), orderByChild('examId'),
                    equalTo(`${examId}`)), (snapshot) => {
                    if (snapshot.val()) {
                        const answers: StudentAnswer[] = toAnswers(snapshot.val()).filter((answer) => answer.homeworkId === homework.id)
                        answers.forEach(answer => {
                            if (answer.id) updates[`/answers/${answer.id}`] = null
                        })
                    }
                })
            }
        }

    })

    await update(ref(database), updates);

    //Update number of examination because firebase database does not support it.
    get(query(ref(database, '/counter/examination'))).then(snapshot => {
        const totalExams = <number>snapshot.val()
        if (totalExams) {
            set(ref(database, '/counter/examination'), totalExams - 1).then()
        } else {
            set(ref(database, '/counter/examination'), 0).then()
        }
    })
    return res.status(200).json({message: 'This examination is deleted successfully. All homework and students answers are also deleted accordingly.'})
}
