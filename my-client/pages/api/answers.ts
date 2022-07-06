import {NextApiRequest, NextApiResponse} from "next";
import {push, ref} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";
import {StudentAnswer} from "../join";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST':
            return createStudentAnswer(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

function createStudentAnswer(req: NextApiRequest, res: NextApiResponse) {
    const studentAnswer = <StudentAnswer> JSON.parse(req.body)
    push(ref(database, '/answers'), studentAnswer).then(() => {
        return res.status(200).json({success: 'Your answer has been recorded.'})
    }, () => {
        return res.status(400).json({message: 'Your answer has not been submitted. Retrying..'})
    })
}
