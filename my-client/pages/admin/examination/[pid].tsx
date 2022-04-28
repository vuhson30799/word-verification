import {useRouter} from "next/router";
import {Admin} from "../../../layout/Admin";
import useSWR from "swr";
import {fetcher} from "../../../modules/configuration/Configuration";
import {MySpinner} from "../../../components/MySpinner";
import {ExaminationData} from "../examination";
import {Button, Grid, Paper} from "@mui/material";
import styles from "../../../styles/Examination.module.css";
import Image from "next/image";
import {getRandomColor} from "../../../modules/utils/color";
import QuizIcon from "@mui/icons-material/Quiz";

export default function ExaminationDetail() {
    const router = useRouter()
    const { pid } = router.query

    const {
        data: examination,
        error
    } = useSWR<ExaminationData>([`http://localhost:8080/exams/${pid}`, 'get'], fetcher)
    if (!examination && !error) return <MySpinner/>
    const questions = examination?.questions

    return (examination !== undefined ?
        <Admin>
            <Grid rowSpacing={2} container>
                <Grid item xs={2} md={2} xl={2}/>
                <Grid item xs={8} md={8} xl={8}>
                    <Paper className={styles.Paper} elevation={3}>
                        <Image src="/logo.png" width="90px" height="90px"
                               alt="logo.png"
                               style={{backgroundColor: getRandomColor()}}/>
                        <div className={styles.ExaminationInfo}>
                            <strong
                                className={styles.ExaminationInfoTitle}>{examination.title}</strong>
                            <div className={styles.ExaminationInfoQuestion}>
                                <QuizIcon/>
                                {examination.questions ? examination.questions.length : 0} Questions
                            </div>
                            <div
                                className={styles.ExaminationInfoAuthor}>{examination.creator} . {examination.createdDate}</div>
                        </div>
                    </Paper>
                    <Button variant="contained">Assigned Homework</Button>
                    <>
                        {
                            questions !== undefined && questions.length !== 0 ?
                                questions.map((question) => {
                                    return (
                                        <>
                                            <div className="questionMetadata">
                                                <div>Type: {question.questionType}</div>
                                                <div>Timeout: {question.timeout}</div>
                                            </div>
                                            <div>
                                                <strong>Question: {question.title}</strong>
                                            </div>
                                            <br/>
                                            <div>Answer: {question.keys[0]}</div>
                                            <br/>
                                            <div>Alternative:
                                                {question.keys.map((key, index) => {
                                                    return (
                                                        <div key={index}>
                                                            Key {index}: {key}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                        )
                                }) : <div>There are no questions.</div>
                        }
                    </>
                </Grid>
                <Grid item xs={2} md={2} xl={2}/>
            </Grid>
        </Admin> : <></>
    )
}
