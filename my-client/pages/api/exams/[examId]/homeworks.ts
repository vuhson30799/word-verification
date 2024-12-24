import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, onValue, orderByChild, push, query, ref} from "firebase/database";
import {database} from "../../../../modules/firebase/FirebaseService";
import {encodeHomeworkUrl, toHomeworks} from "../../../../modules/utils/dataUtils";
import {AssignHomeworkData} from "../../../../components/AssignHomeWorkModal";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      getHomeworks(req, res)
      break
    case 'POST':
      createHomework(req, res)
      break
    default:
      res.status(405).json({message: 'Request is not supported'})
  }
}

function getHomeworks(req: NextApiRequest, res: NextApiResponse) {
  const {examId} = req.query
  onValue(query(ref(database, `/homeworks`), orderByChild('examId'),
    equalTo(`${examId}`)), (snapshot) => {
    if (snapshot.val()) {
      const homeworkData = toHomeworks(snapshot.val())
      res.status(200).json(homeworkData)
    } else {
      res.status(404).json({message: `Homework not found for exam ${examId}`})
    }
  })
}

function createHomework(req: NextApiRequest, res: NextApiResponse) {
  const {examId} = req.query
  const assignHomeworkData = <AssignHomeworkData>req.body
  const encodedHomeworkData = encodeHomeworkUrl(`${examId}`, assignHomeworkData)
  const url = `${req.headers.origin}/join?q=${encodedHomeworkData}&s=euqinu`
  push(ref(database, '/homeworks'), {url, examId, ...assignHomeworkData})
  res.status(200).send(url)
}
