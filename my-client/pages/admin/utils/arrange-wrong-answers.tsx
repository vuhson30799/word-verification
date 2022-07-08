import {Admin} from "../../../layout/Admin";
import {
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextareaAutosize,
    TextField
} from "@mui/material";
import {useState} from "react";
import {
    generateQuestionResults,
    generateStudentResults, Messages,
    QuestionResult,
    StudentResult
} from "../../../modules/utils/englishUtils";
import styles from '../../../styles/ArrangeWrongAnswers.module.css'
import {isEmpty} from "lodash";
import MyToast from "../../../components/MyToast";

export default function EnglishUtils() {
    const [displayTable, setDisplayTable] = useState<boolean>(false)
    const [input, setInput] = useState<string>("")
    const [gradeToGroup, setGradeToGroup] = useState<string>("")
    const [studentResults, setStudentResults] = useState<StudentResult[]>([])
    const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
    function onProceedArrangingAnswers() {
        setDisplayTable(true)
        const {
            studentResults: latestStudentResults,
            messages: latestMessages
        } = generateStudentResults(input)
        setStudentResults(latestStudentResults)
        latestMessages.errorMessages.forEach((message) => console.log(message))
        latestMessages.warningMessages.forEach((message) => console.log(message))
    }
    function updateGradeStudentResult(key: number, value: string): void {
        const updatedStudentResults = studentResults.map((studentResult, index) => {
            if (index === key) studentResult.grade = value
            return studentResult
        })
        setStudentResults(updatedStudentResults)
    }
    function onGroupingQuestion() {
        setQuestionResults(generateQuestionResults(studentResults, gradeToGroup))
    }
    return (
        <Admin>
            <div className={styles.InputAnswers}>
                <div>
                    <TextareaAutosize className={styles.InputTextarea}
                                      aria-label="maximum height"
                                      placeholder="Input"
                                      onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <Button className={styles.ProceedButton}
                    variant={"contained"}
                        onClick={onProceedArrangingAnswers}>
                    Proceed
                </Button>
            </div>

            {displayTable &&
                <>
                    <TableContainer component={Paper}>
                        <Table aria-label="student result table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Student Name</TableCell>
                                    <TableCell align="right">Grade</TableCell>
                                    <TableCell align="right">Wrong questions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {studentResults.map((studentResult, key) => (
                                    <TableRow key={key}>
                                        <TableCell align="left">
                                            {studentResult.name}
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField variant="standard"
                                                       value={studentResult.grade}
                                                       onChange={(e) => updateGradeStudentResult(key, e.target.value)}/>
                                        </TableCell>
                                        <TableCell align="left">
                                            {studentResult.wrongQuestions.join(" ")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <div className={styles.GroupButton}>
                        <TextField variant="outlined"
                                   value={gradeToGroup}
                                   autoComplete={"off"}
                                   onChange={(e) => setGradeToGroup(e.target.value)}/>
                        <Button variant="text" onClick={onGroupingQuestion}>
                            Group By Class
                        </Button>
                    </div>
                    <TableContainer component={Paper}>
                        <Table aria-label="student result table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Question</TableCell>
                                    <TableCell align="left">Wrong students</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {questionResults.map((questionResult, key) => (
                                    <TableRow key={key}>
                                        <TableCell align="left">
                                            {questionResult.question}
                                        </TableCell>
                                        <TableCell align="left">
                                            {questionResult.studentNames.join(", ")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <MyToast message="Proceed successfully" severity="success"/>
                </>
            }
        </Admin>
    )
}

