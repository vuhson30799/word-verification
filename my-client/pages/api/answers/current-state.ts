import type {NextApiRequest, NextApiResponse} from 'next';

// Retired: progress now goes directly to authenticated Firebase paths.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    return res.status(410).json({message: 'Please reload the homework page to use the new progress saving flow.'});
}
