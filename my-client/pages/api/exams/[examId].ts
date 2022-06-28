import {NextApiRequest, NextApiResponse} from "next";
import {onValue, ref} from "firebase/database";
import {database} from "../../../modules/firebase/FirebaseService";
import {ExaminationData} from "../../admin/examination";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            retrieveExamination(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

function retrieveExamination(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    console.log(`Retrieving examination ${examId} from database.`)
    onValue(ref(database, `/examinations/${examId}`), (snapshot) => {
        const examinationData = <ExaminationData> snapshot.val()
        if (examinationData) {
            res.status(200).json(examinationData)
            console.log(`Retrieved examination ${examId} from database.`)
        } else {
            res.status(404).json({message: `Examination with id: ${examId} not found `})
            console.log(`Error when try retrieving examination ${examId} from database.`)
        }
    }, {
        onlyOnce: true
    })
}
