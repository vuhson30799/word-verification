import useSWR from "swr";
import {useRouter} from "next/router";
import {fetcher} from "../../../../modules/configuration/Configuration";
import {MySpinner} from "../../../../components/MySpinner";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {Admin} from "../../../../layout/Admin";

export interface HomeworkData {
    url: string
    beginningDate: string
    deadlineDate: string
}
export default function Homework() {
    const router = useRouter()
    const {pid} = router.query
    const {
        data: homeworks,
        error
    } = useSWR<HomeworkData[]>(`/api/exams/${pid}/homeworks`, fetcher)
    if (!homeworks && !error) return <MySpinner/>
    return ( !!homeworks ?
            <Admin>
                <TableContainer component={Paper}>
                    <Table aria-label="homework table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Examination ID </TableCell>
                                <TableCell align="right">Homework URL</TableCell>
                                <TableCell align="right">Beginning</TableCell>
                                <TableCell align="right">Deadline</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {homeworks.map((homeworkData, key) => (
                                <TableRow
                                    key={key}
                                >
                                    <TableCell component="th" scope="row">
                                        {pid}
                                    </TableCell>
                                    <TableCell align="right">{homeworkData.url}</TableCell>
                                    <TableCell align="right">{homeworkData.beginningDate}</TableCell>
                                    <TableCell align="right">{homeworkData.deadlineDate}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Admin>
        : undefined
    )
}
