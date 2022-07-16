import {useRouter} from "next/router";
import useSWR from "swr";
import {StudentAnswer} from "../../../../../join";
import {fetcherWithForm} from "../../../../../../modules/configuration/Configuration";
import {Admin} from "../../../../../../layout/Admin";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import MyToast from "../../../../../../components/MyToast";
import {MySpinner} from "../../../../../../components/MySpinner";
import {groupBy, orderBy, uniq} from "lodash";

export default function CompletedStudents() {
    const router = useRouter()
    const {examinationId, homeworkId} = router.query
    const criteria = {
        examinationId,
        homeworkId
    }

    const {
        data: studentAnswers,
        error: studentAnswersError
    } = useSWR<StudentAnswer[]>(examinationId && homeworkId ?
        [`/api/answers/search`, 'post', criteria] : null, fetcherWithForm)

    const {
        data: studentAnswerStates,
        error: studentAnswerStatesError
    } = useSWR<StudentAnswer[]>(examinationId && homeworkId ?
        [`/api/answers/search`, 'post', criteria] : null, fetcherWithForm)
    if (studentAnswersError) return <MyToast message={studentAnswersError.message} severity="error"/>
    if (studentAnswerStatesError) return <MyToast message={studentAnswerStatesError.message} severity="error"/>
    if (!studentAnswers) return <MySpinner/>
    if (!studentAnswerStates) return <MySpinner/>

    function getHighestStudentScores(studentAnswers: StudentAnswer[], sortBy: string[]) {
        const studentNames = uniq(studentAnswers.map(answer => answer.studentName))
        const groupedAnswers = groupBy(studentAnswers, 'studentName')
        let response: StudentAnswer[] = []
        studentNames.forEach((studentName) => {
            const orderedAnswers = orderBy(groupedAnswers[studentName], sortBy, sortBy.map(() => 'desc'))
            if (orderedAnswers.length > 1) response.push(orderedAnswers[0])
        })
        return response
    }

    return (
        <Admin>
            <TableContainer style={{margin: '0  0 20px 0'}} component={Paper}>
                <Table aria-label="completed student table">
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={5} align="center">FINAL RESULT</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell align="left">Student Name</TableCell>
                            <TableCell align="right">Correct Answers</TableCell>
                            <TableCell align="right">Trial</TableCell>
                            <TableCell align="right">Start At</TableCell>
                            <TableCell align="right">Finish At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getHighestStudentScores(studentAnswers, ['correctAnswers']).map((answer, key) => (
                            <TableRow key={key}>
                                <TableCell align="left">
                                    {answer.studentName}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.correctAnswers}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.trial}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.beginningAt}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.finishAt}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={4} align="right">Total</TableCell>
                            <TableCell align="right">{getHighestStudentScores(studentAnswers, ['correctAnswers']).length}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <TableContainer component={Paper}>
                <Table aria-label="current state student table">
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={5} align="center">PROGRESS</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell align="left">Student Name</TableCell>
                            <TableCell align="right">Current Question</TableCell>
                            <TableCell align="right">Correct Answers</TableCell>
                            <TableCell align="right">Trial</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getHighestStudentScores(studentAnswerStates, ['trial', 'questionNumber']).map((answer, key) => (
                            <TableRow key={key}>
                                <TableCell align="left">
                                    {answer.studentName}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.questionNumber}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.correctAnswers}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.trial}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Admin>
    )
}
