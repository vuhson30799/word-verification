import {NextApiRequest, NextApiResponse} from "next";
import {CollectionType, getCollection} from "../../../../modules/firebase/FirebaseService";
import {toHomeworks} from "../../../../modules/utils/dataUtils";
import {AssignHomeworkData} from "../../../../components/AssignHomeWorkModal";
import {addDoc, getDocs, query, where} from "@firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            await getHomeworks(req, res)
            break
        case 'POST':
            await createHomework(req, res)
            break
        default:
            res.status(405).json({message: 'Request is not supported'})
    }
}

async function getHomeworks(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    const homeworkQuery = query(getCollection(CollectionType.HOMEWORK), where('examId', '==', `${examId}`))
    const homeworkSnaps = await getDocs(homeworkQuery)
    if (!homeworkSnaps.empty) {
        const homeworkData = toHomeworks(homeworkSnaps)
        res.status(200).json(homeworkData)
    } else {
        res.status(404).json({message: `Homework not found for exam ${examId}`})
    }
}

async function createHomework(req: NextApiRequest, res: NextApiResponse) {
    const {examId} = req.query
    const assignHomeworkData = <AssignHomeworkData> req.body
    const url = `${req.headers.origin}/join?examId=${examId}&beginningDate=${assignHomeworkData.beginningDate}&deadlineDate=${assignHomeworkData.deadlineDate}`
    await addDoc(getCollection(CollectionType.HOMEWORK), {url, examId, ...assignHomeworkData})
    res.status(200).send(url)
}
