import {get, ref, remove, update} from "firebase/database";
import {NextApiRequest, NextApiResponse} from "next";
import {database} from "../../../modules/firebase/FirebaseService";
import {requireRole} from "../../../modules/auth/requireAuth";
import {ClassInput, getInvalidClassMessage} from "../../../modules/configuration/classes";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin'])) return

    switch (req.method) {
        case 'PUT':
            return updateClass(req, res)
        case 'DELETE':
            return deleteClass(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function updateClass(req: NextApiRequest, res: NextApiResponse) {
    const {classId} = req.query
    let input: ClassInput
    try {
        input = JSON.parse(req.body)
    } catch {
        input = {} as ClassInput
    }
    const invalidMessage = getInvalidClassMessage(input)
    if (invalidMessage) return res.status(400).json({message: invalidMessage})

    try {
        const existing = await get(ref(database, `/classes/${classId}`))
        if (!existing.exists()) return res.status(404).json({message: `Class with id: ${classId} not found`})
        await update(ref(database, `/classes/${classId}`), {
            name: input.name.trim(),
            grade: input.grade,
            academicYear: input.academicYear
        })
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try updating class.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot update class.'})
    }
}

async function deleteClass(req: NextApiRequest, res: NextApiResponse) {
    const {classId} = req.query
    try {
        const students = await get(ref(database, '/students'))
        const hasStudents = Object.values<any>(students.val() || {}).some(student => (student.classIds || []).includes(classId))
        if (hasStudents) {
            return res.status(409).json({message: 'This class still has students. Move or remove them first.'})
        }
        await remove(ref(database, `/classes/${classId}`))
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try deleting class.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot delete class.'})
    }
}
