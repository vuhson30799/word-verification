import {NextApiRequest, NextApiResponse} from 'next';
import {get, ref} from 'firebase/database';
import {database} from '../../../../modules/firebase/FirebaseService';
import {requireRole} from '../../../../modules/auth/requireAuth';
import {toClasses, toStudents} from '../../../../modules/utils/dataUtils';
import {currentAcademicYear} from '../../../../modules/configuration/classes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin', 'assistant'])) return
    if (req.method !== 'GET') return res.status(405).json({message: 'Request is not supported'})
    try {
        const [classes, students] = await Promise.all([
            get(ref(database, '/classes')), get(ref(database, '/students'))
        ])
        res.status(200).json({
            classes: toClasses(classes.val(), students.val()).filter(c => c.academicYear === currentAcademicYear()),
            students: toStudents(students.val()).map(s => ({id: s.id, name: s.name, classIds: s.classIds}))
        })
    } catch {
        res.status(500).json({message: 'Could not load the assignment roster.'})
    }
}
