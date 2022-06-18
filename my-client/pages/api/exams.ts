import {onValue, ref} from "firebase/database";
import {database} from "../../modules/firebase/FirebaseService";
import {NextApiRequest, NextApiResponse} from "next";
import {ExaminationData} from "../admin/examination";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        console.log('Getting examination from database.')
        onValue(ref(database, `/examinations`), (snapshot => {
            const examinations = <ExaminationData[]> snapshot.val()
            if (!!examinations) {
                res.status(200).json(examinations)
                console.log(`${examinations.length} examination are got from database.`)
            } else {
                res.status(404).json({message: 'Getting examinations failed.'})
                console.log('Error when try getting examination.')
            }

        }));
    }

}
