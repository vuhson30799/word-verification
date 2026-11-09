import {get, push, ref} from "firebase/database";
import {NextApiRequest, NextApiResponse} from "next";
import {database} from "../../modules/firebase/FirebaseService";
import {requireRole} from "../../modules/auth/requireAuth";
import {getInvalidStudentMessage, normalizeStudent, StudentInput} from "../../modules/configuration/students";
import {toStudents} from "../../modules/utils/dataUtils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin'])) return

    switch (req.method) {
        case 'GET':
            return getStudents(res)
        case 'POST':
            return createStudent(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function getStudents(res: NextApiResponse) {
    try {
        const snapshot = await get(ref(database, '/students'))
        res.status(200).json(toStudents(snapshot.val()))
    } catch (error) {
        console.log('Error when try getting students.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot read students.'})
    }
}

async function createStudent(req: NextApiRequest, res: NextApiResponse) {
    let input: StudentInput
    try {
        input = JSON.parse(req.body)
    } catch {
        input = {} as StudentInput
    }
    const invalidMessage = getInvalidStudentMessage(input)
    if (invalidMessage) return res.status(400).json({message: invalidMessage})

    try {
        await push(ref(database, '/students'), normalizeStudent(input))
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try creating student.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot create student.'})
    }
}
