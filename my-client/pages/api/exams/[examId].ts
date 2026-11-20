import {NextApiRequest, NextApiResponse} from "next";
import {onValue, ref} from "firebase/database";
import {database} from "../../../modules/firebase/FirebaseService";
import {ExaminationData} from "../../admin/examination";
import {deleteStudentData} from "../../../modules/progress/deletion";
import {apiError} from "../../../modules/firebase/server";
import {requireRole} from "../../../modules/auth/requireAuth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin', 'assistant'])) return

    switch (req.method) {
        case 'GET':
            return retrieveExamination(req, res)
        case 'DELETE':
            return deleteExamination(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

function retrieveExamination(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    console.log(`Retrieving examination ${examId} from database.`)
    onValue(ref(database, `/examinations/${examId}`), (snapshot) => {
        const examinationData = <ExaminationData>snapshot.val()
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

async function deleteExamination(req: NextApiRequest, res: NextApiResponse) {
    try {
        await deleteStudentData(req.query.examId)
        return res.status(200).json({message: 'This examination is deleted successfully. All homework and students answers are also deleted accordingly.'})
    } catch (error) {
        const failure = apiError(error)
        return res.status(failure.status).json({message: failure.message})
    }
}
