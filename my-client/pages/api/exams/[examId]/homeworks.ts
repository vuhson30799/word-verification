import {NextApiRequest, NextApiResponse} from "next";
import {equalTo, onValue, orderByChild, push, query, ref} from "firebase/database";
import {database} from "../../../../modules/firebase/FirebaseService";
import {encodeHomeworkUrl, toHomeworks} from "../../../../modules/utils/dataUtils";
import {AssignHomeworkData} from "../../../../components/AssignHomeWorkModal";
import {requireRole} from "../../../../modules/auth/requireAuth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireRole(req, res, ['admin', 'assistant'])) return

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
    res.status(200).json(toHomeworks(snapshot.val()))
  })
}

async function createHomework(req: NextApiRequest, res: NextApiResponse) {
  const {examId} = req.query
  const assignHomeworkData = <AssignHomeworkData>req.body
  if (!assignHomeworkData || !Number.isFinite(Date.parse(assignHomeworkData.beginningDate)) ||
      !Number.isFinite(Date.parse(assignHomeworkData.deadlineDate)) ||
      Date.parse(assignHomeworkData.deadlineDate) <= Date.parse(assignHomeworkData.beginningDate)) {
    return res.status(400).json({message: 'Deadline must be after the beginning date.'})
  }
  if (assignHomeworkData.studentIds !== undefined && (!Array.isArray(assignHomeworkData.studentIds) ||
      !assignHomeworkData.studentIds.length || assignHomeworkData.studentIds.some(id => typeof id !== 'string' || !id))) {
    return res.status(400).json({message: 'Select at least one valid student.'})
  }
  const encodedHomeworkData = encodeHomeworkUrl(`${examId}`, assignHomeworkData)
  const url = `${req.headers.origin}/join?q=${encodedHomeworkData}&s=euqinu`
  try {
    await push(ref(database, '/homeworks'), {
      url, examId,
      beginningDate: assignHomeworkData.beginningDate,
      deadlineDate: assignHomeworkData.deadlineDate,
      ...(assignHomeworkData.studentIds ? {studentIds: [...new Set(assignHomeworkData.studentIds)]} : {})
    })
    res.status(200).send(url)
  } catch {
    res.status(500).json({message: 'Could not assign homework. Please try again.'})
  }
}
