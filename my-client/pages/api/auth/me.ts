import {NextApiRequest, NextApiResponse} from "next";
import {getSession} from "../../../modules/auth/requireAuth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            return me(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

function me(req: NextApiRequest, res: NextApiResponse) {
    const session = getSession(req)
    if (!session) return res.status(401).json({message: 'Not authenticated'})
    return res.status(200).json({role: session.role, username: session.username})
}
