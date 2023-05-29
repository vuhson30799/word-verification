import {NextApiRequest, NextApiResponse} from "next";
import {CollectionType, getCollection} from "../../../modules/firebase/FirebaseService";
import {addDoc} from "@firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST':
            await updateCurrentStudentAnswerState(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

async function updateCurrentStudentAnswerState(req: NextApiRequest, res: NextApiResponse) {
    let studentAnswer = {}
    try {
        studentAnswer = JSON.parse(req.body)
        await addDoc(getCollection(CollectionType.ANSWER), studentAnswer)
        return res.status(200).json({success: 'Your answer has been recorded.'})
    } catch (e: any) {
        await addDoc(getCollection(CollectionType.ERROR), {
            message: e.message,
            studentAnswer,
            inProgress: true,
            occurAt: new Date()
        })
        return res.status(400).json({message: 'Your answer has not been submitted but logged. Please contact Ms. Lien for more information.'})
    }
}
