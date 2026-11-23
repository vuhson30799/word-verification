import {get, push, ref, runTransaction} from "firebase/database";
import type {NextApiRequest, NextApiResponse} from "next";
import {requireRole} from "../../../modules/auth/requireAuth";
import {parseStudentImport, studentEnrollmentKeys} from "../../../modules/configuration/studentImport";
import type {StudentInput} from "../../../modules/configuration/students";
import {database} from "../../../modules/firebase/FirebaseService";
import {toStudents} from "../../../modules/utils/dataUtils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin'])) return
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({message: 'Request is not supported'})
    }

    let students: StudentInput[]
    try {
        students = parseStudentImport(typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
    } catch (error) {
        return res.status(400).json({message: error instanceof Error ? error.message : 'Invalid student import.'})
    }

    try {
        const classIds = [...new Set(students.flatMap(student => student.classIds))]
        const classes = await get(ref(database, '/classes'))
        if (classIds.some(id => !classes.hasChild(id))) {
            return res.status(400).json({message: 'A selected class no longer exists. Refresh the class list and try again.'})
        }

        const roster = ref(database, '/students')
        const entries = students.map(student => ({
            id: push(roster).key!,
            student,
            key: studentEnrollmentKeys(student)[0]
        }))
        const {snapshot} = await runTransaction(roster, current => {
            const enrolled = new Set(toStudents(current).flatMap(studentEnrollmentKeys))
            const additions: Record<string, StudentInput> = {}
            for (const {id, student, key} of entries) {
                if (enrolled.has(key)) continue
                additions[id] = student
                enrolled.add(key)
            }
            return {...current, ...additions}
        }, {applyLocally: false})

        const imported = entries.filter(({id}) => snapshot.hasChild(id)).length
        return res.status(200).json({imported, skipped: students.length - imported})
    } catch (error) {
        console.error('Error importing students.', error)
        return res.status(500).json({message: error instanceof Error ? error.message : 'Cannot import students.'})
    }
}
