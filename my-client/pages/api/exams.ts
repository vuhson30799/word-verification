import {CollectionType, getCollection} from "../../modules/firebase/FirebaseService";
import {NextApiRequest, NextApiResponse} from "next";
import {ExaminationData} from "../admin/examination";
import {toExaminations} from "../../modules/utils/dataUtils";
import {addDoc, getDocs} from "@firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            await getExaminations(req, res)
            break
        case 'POST':
            await createExamination(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

async function getExaminations(req: NextApiRequest, res: NextApiResponse) {
    console.log('Getting examination from database.')
    const snapshot = await getDocs(getCollection(CollectionType.EXAMINATION))
    const examinations = toExaminations(snapshot)
    if (examinations) {
        console.log(`${examinations.length} examination are got from database.`)
        res.status(200).json(examinations)
    } else {
        console.log('Error when try getting examination.')
        res.status(404).send({message: 'This examination is not existed.'})
    }
}

async function createExamination(req: NextApiRequest, res: NextApiResponse) {
    const examination = <ExaminationData>JSON.parse(req.body)
    const invalidMessage = getInvalidMessage(examination)
    if (invalidMessage) {
        res.status(400).send({message: invalidMessage})
        return
    }
    await addDoc(getCollection(CollectionType.EXAMINATION), examination)
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
