import {useRouter} from "next/router";
import {fetcher} from "../../../../modules/configuration/Configuration";
import {MySpinner} from "../../../../components/MySpinner";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {Admin} from "../../../../layout/Admin";
import useSWRImmutable from "swr/immutable";
import MyToast from "../../../../components/MyToast";
import useSWR from "swr";
import {ExaminationData} from "../../examination";
import HomeworkSplitButton from "../../../../components/HomeworkSplitButton";

export interface HomeworkData {
    id: string
    url: string
    beginningDate: string
    deadlineDate: string
}

export default function Homework() {
    const router = useRouter()
    const {examinationId} = router.query
    const {
        data: homeworks,
        error
    } = useSWR<HomeworkData[]>(examinationId ? [`/api/exams/${examinationId}/homeworks`, 'get'] : null, fetcher)
    const {
        data: examination,
        error: examinationError
    } = useSWRImmutable<ExaminationData>(examinationId ? [`/api/exams/${examinationId}`, 'get'] : null, fetcher)
    if (error || examinationError) return <MyToast message={error.message || examinationError.message} severity="error"/>
    if (!homeworks || !examination) return <MySpinner/>
    return (
        <Admin>
            <TableContainer component={Paper}>
                <Table aria-label="homework table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="right">Beginning</TableCell>
                            <TableCell align="right">Deadline</TableCell>
                            <TableCell align="right">{examination?.title}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {homeworks.map((homeworkData, key) => (
                            <TableRow key={key}>
                                <TableCell align="right">
                                    {homeworkData.beginningDate}
                                </TableCell>
                                <TableCell align="right">{homeworkData.deadlineDate}</TableCell>
                                <TableCell align="right" component="th" scope="row">
                                    <HomeworkSplitButton homeworkData={homeworkData}/>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Admin>)
}
