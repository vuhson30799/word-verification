import {NextApiRequest, NextApiResponse} from "next";
import {CollectionType, getCollection} from "../../../../../modules/firebase/FirebaseService";
import {toAnswers} from "../../../../../modules/utils/dataUtils";
import {StudentAnswer} from "../../../../join";
import {deleteDoc, doc, getDocs, query, where} from "@firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'DELETE':
            await deleteHomework(req, res)
            break
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function deleteHomework(req: NextApiRequest, res: NextApiResponse) {
    const {examId, homeworkId} = req.query
    const homeworkCollection = getCollection(CollectionType.HOMEWORK)
    const answerQuery = query(getCollection(CollectionType.ANSWER), where('examId', '==', `${examId}`))
    const answerSnaps = await getDocs(answerQuery)
    if (answerSnaps.empty) {
        await deleteDoc(doc(homeworkCollection, `${homeworkId}`))
        return res.status(200).json({message: 'This homework is deleted successfully. Student answers are not existed yet.'})
    }
    const answers: StudentAnswer[] = toAnswers(answerSnaps).filter((answer) => answer.homeworkId === homeworkId)
    // delete all answer related
    for (const answer of answers) {
        if (answer.id) await deleteDoc(doc(getCollection(CollectionType.ANSWER), `${answer.id}`))
    }

    await deleteDoc(doc(homeworkCollection, `${homeworkId}`))
    return res.status(200).json({message: 'This homework is deleted successfully. All students answers are also deleted accordingly.'})
}
