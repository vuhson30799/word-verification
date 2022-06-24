import {NextApiRequest, NextApiResponse} from "next";
import {onValue, push, ref} from "firebase/database";
import {database} from "../../../modules/firebase/FirebaseService";
import {ExaminationData} from "../../admin/examination";
import {AssignHomeworkData} from "../../../components/AssignHomeWorkModal";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const {pid} = req.query
    if (req.method === 'GET') {
        console.log(`Retrieving examination ${pid} from database.`)
        onValue(ref(database, `/examinations/${pid}`), (snapshot) => {
            const examinationData = <ExaminationData> snapshot.val()
            if (!!examinationData) {
                res.status(200).json(examinationData)
                console.log(`Retrieved examination ${pid} from database.`)
            } else {
                res.status(404).json({message: `Examination with id: ${pid} not found `})
                console.log(`Error when try retrieving examination ${pid} from database.`)
            }
        }, {
            onlyOnce: true
        })
    }

    if (req.method === 'POST') {
        const assignHomeworkData = <AssignHomeworkData> req.body
        const url = `${req.headers.referer}/join?examId=${pid}&beginningDate=${assignHomeworkData.beginningDate}&deadlineDate=${assignHomeworkData.deadlineDate}`
        push(ref(database, '/homeworks'), {url, examId: pid, ...assignHomeworkData})
        res.status(200).send(url)
    }
}
