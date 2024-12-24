import {useRouter} from "next/router";
import useSWR from "swr";
import {StudentAnswer} from "../../../../../join";
import {fetcherWithForm} from "../../../../../../modules/configuration/Configuration";
import {Admin} from "../../../../../../layout/Admin";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import MyToast from "../../../../../../components/MyToast";
import {MySpinner} from "../../../../../../components/MySpinner";
import {groupBy, orderBy, uniq} from "lodash";
import {DataGrid, GridColDef, GridToolbar} from "@mui/x-data-grid";
import {useCallback} from "react";
import Box from "@mui/material/Box";
import {compareAsc, format} from "date-fns";

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
  const highestStudentAnswers = useCallback((studentAnswers: StudentAnswer[], sortBy: string[]) => {
    const studentNames = uniq(studentAnswers.map(answer => answer.studentName))
    const groupedAnswers = groupBy(studentAnswers, 'studentName')
    let response: StudentAnswer[] = []
    studentNames.forEach((studentName) => {
      const orderedAnswers = orderBy(groupedAnswers[studentName], sortBy, sortBy.map(() => 'desc'))
      if (orderedAnswers.length > 1) response.push(orderedAnswers[0])
    })
    return response
  }, [studentAnswers])
  if (studentAnswersError) return <MyToast message={studentAnswersError.message} severity="error"/>
  if (studentAnswerStatesError) return <MyToast message={studentAnswerStatesError.message} severity="error"/>
  if (!studentAnswers) return <MySpinner/>
  if (!studentAnswerStates) return <MySpinner/>
  const columns: GridColDef[] = [
    {field: 'studentName', headerName: 'Student Name', minWidth: 500},
    {field: 'correctAnswers', headerName: 'Correct Answers', minWidth: 150},
    {field: 'trial', headerName: 'Trial'},
    {
      field: 'beginningAt',
      headerName: 'Start At',
      minWidth: 300,
      valueFormatter: value => format(Date.parse(value), "HH:mm dd/MM/yyyy"),
      sortComparator: (v1, v2) => {
        const d1 = Date.parse(v1)
        const d2 = Date.parse(v2)
        return compareAsc(d1, d2)
      }
    },
    {
      field: 'finishAt',
      headerName: 'Finish At',
      minWidth: 300,
      valueFormatter: value => format(Date.parse(value), "HH:mm dd/MM/yyyy"),
      sortComparator: (v1, v2) => {
        const d1 = Date.parse(v1)
        const d2 = Date.parse(v2)
        return compareAsc(d1, d2)
      }
    },
  ];

  return (
    <Admin>
      <Box sx={{padding: '0 20px', height: '85vh', width: '100%'}}>
        <DataGrid rows={highestStudentAnswers(studentAnswers, ['correctAnswers'])}
                  columns={columns}
                  disableColumnFilter
                  disableColumnSelector
                  disableDensitySelector
                  slots={{toolbar: GridToolbar}}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                    },
                  }}/>
      </Box>
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
            {highestStudentAnswers(studentAnswerStates, ['trial', 'questionNumber']).map((answer, key) => (
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
