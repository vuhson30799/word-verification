import {get, push, ref} from "firebase/database";
import {NextApiRequest, NextApiResponse} from "next";
import {database} from "../../modules/firebase/FirebaseService";
import {requireRole} from "../../modules/auth/requireAuth";
import {hashPassword} from "../../modules/auth/PasswordService";
import {AssistantInput, getInvalidAssistantMessage} from "../../modules/configuration/assistants";
import {toAssistants} from "../../modules/utils/dataUtils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin'])) return

    switch (req.method) {
        case 'GET':
            return getAssistants(res)
        case 'POST':
            return createAssistant(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function getAssistants(res: NextApiResponse) {
    try {
        const snapshot = await get(ref(database, '/assistants'))
        res.status(200).json(toAssistants(snapshot.val()))
    } catch (error) {
        console.log('Error when try getting assistants.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot read assistants.'})
    }
}

async function createAssistant(req: NextApiRequest, res: NextApiResponse) {
    let input: AssistantInput
    try {
        input = JSON.parse(req.body)
    } catch {
        input = {} as AssistantInput
    }
    const invalidMessage = getInvalidAssistantMessage(input)
    if (invalidMessage) return res.status(400).json({message: invalidMessage})

    const username = input.username.trim()
    try {
        if (username === process.env.ADMIN_USERNAME) {
            return res.status(409).json({message: 'This username is already in use'})
        }
        const existing = await get(ref(database, '/assistants'))
        const usernameTaken = toAssistants(existing.val()).some(assistant => assistant.username === username)
        if (usernameTaken) return res.status(409).json({message: 'This username is already in use'})

        await push(ref(database, '/assistants'), {
            name: input.name.trim(),
            username,
            passwordHash: await hashPassword(input.password)
        })
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try creating assistant.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot create assistant.'})
    }
}
