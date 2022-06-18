import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, onValue, orderByChild, query, ref} from "firebase/database";
import {database} from "../../../../modules/firebase/FirebaseService";
import {HomeworkData} from "../../../admin/examination/[pid]/homework";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const {pid} = req.query
    if (req.method === 'GET') {
        onValue(query(ref(database, `/homeworks`), orderByChild('examId'),
            equalTo(`${pid}`)), (snapshot) => {
            const homeworkData = <HomeworkData> snapshot.val()
            if (!!homeworkData) {
                res.status(200).json(homeworkData)
            } else {
                res.status(404).json({message: `Homework not found for exam ${pid}`})
            }

        }, {
            onlyOnce: true
        })
    }
}
