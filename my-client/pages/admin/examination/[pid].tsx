import {useRouter} from "next/router";
import {Admin} from "../../../layout/Admin";
import useSWR from "swr";
import {fetcher} from "../../../modules/configuration/Configuration";
import {MySpinner} from "../../../components/MySpinner";
import {ExaminationData} from "../examination";
import {Button, Grid, Paper, TextareaAutosize} from "@mui/material";
import styles from "../../../styles/Examination.module.css";
import Image from "next/image";
import {getRandomColor} from "../../../modules/utils/color";
import QuizIcon from "@mui/icons-material/Quiz";
import AssignHomeworkModal from "../../../components/AssignHomeWorkModal";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function ExaminationDetail() {
    const router = useRouter()
    const { pid, homework_url } = router.query

    const {
        data: examination,
        error
    } = useSWR<ExaminationData>([!!pid ? `http://localhost:8080/exams/${pid}` : null, 'get'], fetcher)
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
                                {!!questions ? questions.length : 0} Questions
                            </div>
                            <div
                                className={styles.ExaminationInfoAuthor}>{examination.creator} . {examination.createdDate}</div>
                        </div>
                    </Paper>
                    <div className={styles.GroupButtonHomework}>
                        <AssignHomeworkModal title={"Assign Homework"} examinationId={examination.id}/>
                        <Button variant={"contained"} onClick={() => router.push(`/admin/examination/${pid}/homework`)}>
                            Available Homework
                        </Button>
                    </div>
                    <div className={styles.HomeworkBox}>
                        {
                            !!homework_url ?
                                <>
                                    <TextareaAutosize minRows={3}
                                                      aria-label="maximum height"
                                                      placeholder="Homework url link"
                                                      readOnly={true}
                                                      className={styles.HomeworkURL}
                                                      defaultValue={homework_url}/>
                                    <Button variant="contained"
                                            startIcon={<ContentCopyIcon />}
                                            onClick={() => navigator.clipboard.writeText(homework_url as string)}>
                                        Copy Link
                                    </Button>
                                </>
                                : undefined
                        }

                    </div>
                    <>
                        {
                            !!questions && questions.length !== 0 ?
                                questions.map((question, key) => {
                                    return (
                                        <div key={key}>
                                            <div>
                                                <strong>Question[{question.questionType}|{question.timeout}s]: {question.title}</strong>
                                            </div>
                                            <div>Answer: {question.keys[0]}</div>
                                            <div>Alternative:
                                                {question.keys.map((key, index) => {
                                                    return (
                                                        <div key={index}>
                                                            Key {index}: {key}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
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
