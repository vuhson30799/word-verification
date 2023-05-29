import {NextApiRequest, NextApiResponse} from "next";
import {CollectionType, getCollection} from "../../../modules/firebase/FirebaseService";
import {ExaminationData} from "../../admin/examination";
import {toAnswers, toHomeworks} from "../../../modules/utils/dataUtils";
import {StudentAnswer} from "../../join";
import {deleteDoc, doc, getDoc, getDocs, query, where} from "@firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            await retrieveExamination(req, res)
            break
        case 'DELETE':
            await deleteExamination(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

async function retrieveExamination(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    console.log(`Retrieving examination ${examId} from database.`)
    const docSnap = await getDoc(doc(getCollection(CollectionType.EXAMINATION), `${examId}`))
    const examinationData = <ExaminationData> docSnap.data()
    if (examinationData) {
        console.log(`Retrieved examination ${examId} from database.`)
        res.status(200).json(examinationData)
    } else {
        console.log(`Error when try retrieving examination ${examId} from database.`)
        res.status(404).json({message: `Examination with id: ${examId} not found `})
    }
}

async function deleteExamination(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    const examCollection = getCollection(CollectionType.EXAMINATION)
    const homeworkQuery = query(getCollection(CollectionType.HOMEWORK), where('examId', '==', `${examId}`))
    const homeworkSnaps = await getDocs(homeworkQuery)
    if (homeworkSnaps.empty) {
        await deleteDoc(doc(examCollection, `${examId}`))
        return res.status(200).json({message: 'This examination is deleted successfully. There is no homework existed.'})
    }

    const homeworkData = toHomeworks(homeworkSnaps)
    // delete all homework related
    for (const homework of homeworkData) {
        const answerQuery = query(getCollection(CollectionType.ANSWER), where('examId', '==', `${examId}`))
        const answerSnaps = await getDocs(answerQuery)
        if (answerSnaps.empty) {
            continue
        }
        const answers: StudentAnswer[] = toAnswers(answerSnaps).filter((answer) => answer.homeworkId === homework.id)
        // delete all answer related
        for (const answer of answers) {
            if (answer.id) await deleteDoc(doc(getCollection(CollectionType.ANSWER), `${answer.id}`))
        }

        await deleteDoc(doc(getCollection(CollectionType.HOMEWORK), `${homework.id}`))
    }

    await deleteDoc(doc(examCollection, `${examId}`))
    return res.status(200).json({message: 'This examination is deleted successfully. All homework and students answers are also deleted accordingly.'})
}
