import {NextApiRequest, NextApiResponse} from "next";
import {requireRole} from "../../../../../modules/auth/requireAuth";
import {deleteStudentData} from "../../../../../modules/progress/deletion";
import {apiError} from "../../../../../modules/firebase/server";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin', 'assistant'])) return

    switch (req.method) {
        case 'DELETE':
            return deleteHomework(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function deleteHomework(req: NextApiRequest, res: NextApiResponse) {
    try {
        await deleteStudentData(req.query.examId, req.query.homeworkId)
        return res.status(200).json({message: 'This homework is deleted successfully. All students answers are also deleted accordingly.'})
    } catch (error) {
        const failure = apiError(error)
        return res.status(failure.status).json({message: failure.message})
    }
}
