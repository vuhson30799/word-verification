import {NextApiRequest, NextApiResponse} from "next";
import {serialize} from "cookie";
import {SESSION_COOKIE_NAME} from "../../../modules/auth/requireAuth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST':
            return logout(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

function logout(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Set-Cookie', serialize(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    }))
    return res.status(200).json({message: 'Logged out'})
}
