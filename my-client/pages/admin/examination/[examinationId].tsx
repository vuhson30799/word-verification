import {useRouter} from "next/router";
import {Admin} from "../../../layout/Admin";
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
import MyToast from "../../../components/MyToast";
import {useState} from "react";
import useSWRImmutable from "swr/immutable";

export default function ExaminationDetail() {
    const router = useRouter()
    const {examinationId} = router.query
    const [homeworkURL, setHomeworkURL] = useState<string>()
    const [submitDeletion, setSubmitDeletion] = useState<boolean>(false)

    let {
        data: examination,
        error
    } = useSWRImmutable<ExaminationData>(examinationId ? [`/api/exams/${examinationId}`, 'get'] : null, fetcher)

    const {
        data: deleteExaminationSuccess,
        error: deleteExaminationError
    } = useSWRImmutable<{message: string}>(submitDeletion ?  [`/api/exams/${examinationId}`, 'delete'] : null, fetcher)
    if (error) return <MyToast message={error.message} severity="error"/>
    if (deleteExaminationError) return <MyToast message={deleteExaminationError.message} severity="error"/>
    if (!examination) return <MySpinner/>
    if (submitDeletion && !deleteExaminationSuccess) return <MySpinner/>
    if (submitDeletion && deleteExaminationSuccess) {
        router.push('/admin/examination').then(() => {
            router.reload()
        })
    }
    const questions = examination?.questions
    // missing id when get examination from firebase database
    if (examination) examination.id = `${examinationId}`

    return (
        <Admin>
            <Grid rowSpacing={2} container>
                <Grid item xs={2} md={2} xl={2}/>
                <Grid item xs={8} md={8} xl={8}>
                    <Paper className={styles.Paper} elevation={3}>
                        <Image src="/logo.png" width={90} height={90}
                               alt="logo.png"
                               style={{backgroundColor: getRandomColor()}}/>
                        <div className={styles.ExaminationInfo}>
                            <strong
                                className={styles.ExaminationInfoTitle}>{examination.title}</strong>
                            <div className={styles.ExaminationInfoQuestion}>
                                <QuizIcon/>
                                {questions ? questions.length : 0} Questions
                            </div>
                            <div
                                className={styles.ExaminationInfoAuthor}>{examination.creator} . {examination.createdDate}</div>
                        </div>
                    </Paper>
                    <div className={styles.GroupButtonHomework}>
                        <AssignHomeworkModal title={"Assign Homework"}
                                             examinationId={examination.id}
                                             onChange={setHomeworkURL}/>
                        <Button variant={"contained"} onClick={() => router.push(`/admin/examination/${examinationId}/homework`)}>
                            Available Homework
                        </Button>
                    </div>
                    <div className={styles.HomeworkBox}>
                        {homeworkURL &&
                            <>
                                <TextareaAutosize minRows={3}
                                                  aria-label="maximum height"
                                                  placeholder="Homework url link"
                                                  readOnly={true}
                                                  className={styles.HomeworkURL}
                                                  value={homeworkURL}
                                />
                                <Button variant="contained"
                                        startIcon={<ContentCopyIcon/>}
                                        onClick={() => navigator.clipboard.writeText(homeworkURL as string)}>
                                    Copy Link
                                </Button>
                            </>
                        }
                    </div>
                    <>
                        {!!questions && questions.length !== 0 ?
                            questions.map((question, key) => {
                                return (
                                    <div key={key}>
                                        <div>
                                            <strong>Question {key + 1} [{question.questionType}|{question.timeout}s]: {question.title}</strong>
                                        </div>
                                        {!!question.keys &&
                                            <>
                                                <div>Answer: {question.keys[0]}</div>
                                                <div>Alternative:
                                                    {question.keys.map((key, index) => {
                                                        return (
                                                            <div key={index}>
                                                                Key {index + 1}: {key}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </>
                                        }
                                    </div>
                                )
                            }) : <div>There are no questions.</div>
                        }
                    </>
                    <div className={styles.DeleteExamination}>
                        <Button variant={"contained"}
                                color="error"
                                onClick={() => setSubmitDeletion(true)}>
                            Delete Examination
                        </Button>
                    </div>
                </Grid>
                <Grid item xs={2} md={2} xl={2}/>
            </Grid>
        </Admin>
    )
}
