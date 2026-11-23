import {get, ref, remove, set} from "firebase/database";
import {NextApiRequest, NextApiResponse} from "next";
import {database} from "../../../modules/firebase/FirebaseService";
import {requireRole} from "../../../modules/auth/requireAuth";
import {getInvalidStudentMessage, normalizeStudent, StudentInput} from "../../../modules/configuration/students";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin', 'assistant'])) return

    switch (req.method) {
        case 'PUT':
            return updateStudent(req, res)
        case 'DELETE':
            return deleteStudent(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function updateStudent(req: NextApiRequest, res: NextApiResponse) {
    const {studentId} = req.query
    let input: StudentInput
    try {
        input = JSON.parse(req.body)
    } catch {
        input = {} as StudentInput
    }
    const invalidMessage = getInvalidStudentMessage(input)
    if (invalidMessage) return res.status(400).json({message: invalidMessage})

    try {
        const existing = await get(ref(database, `/students/${studentId}`))
        if (!existing.exists()) return res.status(404).json({message: `Student with id: ${studentId} not found`})
        await set(ref(database, `/students/${studentId}`), normalizeStudent(input))
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try updating student.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot update student.'})
    }
}

async function deleteStudent(req: NextApiRequest, res: NextApiResponse) {
    const {studentId} = req.query
    try {
        await remove(ref(database, `/students/${studentId}`))
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try deleting student.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot delete student.'})
    }
}
