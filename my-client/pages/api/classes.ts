import {get, push, ref} from "firebase/database";
import {NextApiRequest, NextApiResponse} from "next";
import {database} from "../../modules/firebase/FirebaseService";
import {requireRole} from "../../modules/auth/requireAuth";
import {ClassInput, getInvalidClassMessage} from "../../modules/configuration/classes";
import {toClasses} from "../../modules/utils/dataUtils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin'])) return

    switch (req.method) {
        case 'GET':
            return getClasses(res)
        case 'POST':
            return createClass(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function getClasses(res: NextApiResponse) {
    try {
        const [classes, students] = await Promise.all([
            get(ref(database, '/classes')),
            get(ref(database, '/students'))
        ])
        res.status(200).json(toClasses(classes.val(), students.val()))
    } catch (error) {
        console.log('Error when try getting classes.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot read classes.'})
    }
}

async function createClass(req: NextApiRequest, res: NextApiResponse) {
    const input = parseBody(req)
    const invalidMessage = getInvalidClassMessage(input)
    if (invalidMessage) return res.status(400).json({message: invalidMessage})

    try {
        await push(ref(database, '/classes'), {
            name: input.name.trim(),
            grade: input.grade,
            academicYear: input.academicYear
        })
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try creating class.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot create class.'})
    }
}

function parseBody(req: NextApiRequest): ClassInput {
    try {
        return JSON.parse(req.body)
    } catch {
        return {} as ClassInput
    }
}
