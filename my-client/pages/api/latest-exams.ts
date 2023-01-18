import {get, limitToFirst, onValue, orderByChild, push, query, ref, set, startAt} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";
import {NextApiRequest, NextApiResponse} from "next";
import {ExaminationData} from "../admin/examination";
import {toExaminations} from "../../modules/utils/dataUtils";
import {pageSize} from "../../constant/ApplicationConstant";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            getExaminations(req, res)
            break
        case 'POST':
            createExamination(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

function getExaminations(req: NextApiRequest, res: NextApiResponse) {
    console.log('Getting examination from database.')
    const page = Number(req.query.page) || 0
    const firstExamQuery = query(ref(database, `/examinations`), orderByChild('/createdDate'), limitToFirst(pageSize * page + 1));
    get(firstExamQuery).then(snapshot => {
        const firstExaminations = toExaminations(snapshot.val())
        const first = firstExaminations[firstExaminations.length - 1]
        const mainQuery = query(ref(database, `/examinations`), orderByChild('/createdDate'), startAt(first.createdDate), limitToFirst(pageSize));
        onValue(mainQuery, (snapshot => {
            const examinations = toExaminations(snapshot.val())
            if (examinations) {
                res.status(200).json(examinations)
                console.log(`${examinations.length} examination are got from database.`)
            } else {
                res.status(404).send({message: 'This examination is not existed.'})
                console.log('Error when try getting examination.')
            }
        }))
    })

}

function createExamination(req: NextApiRequest, res: NextApiResponse) {
    const examination = <ExaminationData>JSON.parse(req.body)
    const invalidMessage = getInvalidMessage(examination)
    if (invalidMessage) {
        res.status(400).send({message: invalidMessage})
        return
    }
    push(ref(database, '/examinations'), examination)
    //Update number of examination because firebase database does not support it.
    get(query(ref(database, '/counter/examination'))).then(snapshot => {
        const totalExams = <number>snapshot.val()
        if (totalExams) {
            set(ref(database, '/counter/examination'), totalExams + 1).then()
        } else {
            set(ref(database, '/counter/examination'), 1).then()
        }
    })

    //TODO: return 204 status code
    res.status(200).json({message: 'success'})
}

function getInvalidMessage(examination: ExaminationData): string | undefined {
    if (!examination.title) return 'Missing title for this examination'
    if (!examination.grade) return 'Missing grade for this examination'
    if (!examination.creator) return 'Missing creator for this examination'
    if (!examination.questions || examination.questions.length == 0) return 'Missing questions for this examination'

    return undefined
}
