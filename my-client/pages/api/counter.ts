import {NextApiRequest, NextApiResponse} from "next";
import {get, query, ref} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            return countObject(req, res)
        default:
            return res.status(405).json({message: 'Request is not supported'})
    }
}

function countObject(req: NextApiRequest, res: NextApiResponse) {
    const {q} = req.query
    console.log(`Retrieving number of ${q}.`)
    get(query(ref(database, `/counter/${q}`))).then(snapshot => {
        const totalObject = snapshot.val() as number
        if (totalObject) {
            res.status(200).send(totalObject)
        } else {
            res.status(404).json({message: `Cannot count for object: ${q}`})
        }
        console.log(`Number of ${q}: ${totalObject} has been retrieved.`)
    })
}
