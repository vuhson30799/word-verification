import {NextApiRequest, NextApiResponse} from "next";
import {push, ref} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";
import {StudentAnswer} from "../join";
import {goOffline, goOnline} from "@firebase/database";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const studentAnswer = <StudentAnswer> JSON.parse(req.body)
        goOnline(database)
        push(ref(database, '/answers'), studentAnswer)
        res.status(200).json({success: 'Your answer has been recorded.'})
        goOffline(database)
    }
}
