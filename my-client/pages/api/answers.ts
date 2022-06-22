import {NextApiRequest, NextApiResponse} from "next";
import {push, ref} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";
import {StudentAnswer} from "../join";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const studentAnswer = <StudentAnswer> JSON.parse(req.body)
        push(ref(database, '/answers'), studentAnswer)
        res.status(200).send('success')
    }
}
