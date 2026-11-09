import {get, ref, remove, update} from "firebase/database";
import {NextApiRequest, NextApiResponse} from "next";
import {database} from "../../../modules/firebase/FirebaseService";
import {requireRole} from "../../../modules/auth/requireAuth";
import {hashPassword} from "../../../modules/auth/PasswordService";
import {getInvalidPasswordMessage} from "../../../modules/configuration/assistants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!requireRole(req, res, ['admin'])) return

    switch (req.method) {
        case 'PUT':
            return changePassword(req, res)
        case 'DELETE':
            return deleteAssistant(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

async function changePassword(req: NextApiRequest, res: NextApiResponse) {
    const {assistantId} = req.query
    let password: unknown
    try {
        password = JSON.parse(req.body).password
    } catch {
        password = undefined
    }
    const invalidMessage = getInvalidPasswordMessage(password)
    if (invalidMessage) return res.status(400).json({message: invalidMessage})

    try {
        const existing = await get(ref(database, `/assistants/${assistantId}`))
        if (!existing.exists()) return res.status(404).json({message: `Assistant with id: ${assistantId} not found`})
        await update(ref(database, `/assistants/${assistantId}`), {passwordHash: await hashPassword(password as string)})
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try changing assistant password.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot change password.'})
    }
}

async function deleteAssistant(req: NextApiRequest, res: NextApiResponse) {
    const {assistantId} = req.query
    try {
        await remove(ref(database, `/assistants/${assistantId}`))
        res.status(200).json({message: 'success'})
    } catch (error) {
        console.log('Error when try deleting assistant.', error)
        res.status(500).json({message: error instanceof Error ? error.message : 'Cannot delete assistant.'})
    }
}
