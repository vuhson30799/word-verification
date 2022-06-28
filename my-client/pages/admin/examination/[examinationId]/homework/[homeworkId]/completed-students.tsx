import {useRouter} from "next/router";
import useSWR from "swr";
import {StudentAnswer} from "../../../../../join";
import {fetcherWithForm} from "../../../../../../modules/configuration/Configuration";
import {Admin} from "../../../../../../layout/Admin";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import MyToast from "../../../../../../components/MyToast";
import {MySpinner} from "../../../../../../components/MySpinner";

export default function CompletedStudents() {
    const router = useRouter()
    const {examinationId, homeworkId} = router.query
    const criteria = {
        examinationId,
        homeworkId
    }

    const {
        data: studentAnswers,
        error
    } = useSWR<StudentAnswer[]>(examinationId && homeworkId ?
        [`/api/answers/search`, 'post', criteria] : null, fetcherWithForm)
    if (error) return <MyToast message={error.message} severity="error"/>
    if (!studentAnswers) return <MySpinner/>

    return (
        <Admin>
            <TableContainer component={Paper}>
                <Table aria-label="completed student table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">Student Name</TableCell>
                            <TableCell align="right">Correct Answers</TableCell>
                            <TableCell align="right">Start At</TableCell>
                            <TableCell align="right">Finish At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {studentAnswers.map((answer, key) => (
                            <TableRow key={key}>
                                <TableCell align="left">
                                    {answer.studentName}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.correctAnswers}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.beginningAt}
                                </TableCell>
                                <TableCell align="right">
                                    {answer.finishAt}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Admin>
    )
}
