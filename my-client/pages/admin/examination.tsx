import useSWR from "swr";
import {Admin} from "../../layout/Admin";
import styles from "../../styles/Examination.module.css"
import {fetcher} from "../../modules/configuration/Configuration";
import {MySpinner} from "../../components/MySpinner";
import {Grid, Paper} from "@mui/material";
import Link from "next/link";
import Image from 'next/image'
import {getRandomColor} from "../../modules/utils/color";
import QuizIcon from '@mui/icons-material/Quiz';


interface Question {
    title: string
    keys: string[]
    timeout: number
    questionType: string
}

export interface ExaminationData {
    id: string
    title: string
    questions: Question[]
    createdDate: string
    grade: number
    creator: string
}

function Examination() {
    const {
        data: examinations,
        error
    } = useSWR<ExaminationData[]>(['http://localhost:8080/exams', 'get'], fetcher)
    if (!examinations && !error) return <MySpinner/>
    return (
        !!examinations ? <Admin>
            <div className={styles.Examination}>
                <Grid rowSpacing={2} container>
                    {
                        examinations.map((examination, key) => {
                            return (
                                <>
                                    <Grid item xs={2} md={2} xl={2}/>
                                    <Grid item xs={8} md={8} xl={8}>
                                        <Link href={`/admin/examination/${examination.id}`} key={key}>
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
                                        </Link>
                                    </Grid>
                                    <Grid item xs={2} md={2} xl={2}/>
                                </>
                            )
                        })
                    }
                </Grid>
            </div>
        </Admin> : <MySpinner/>
    )
}

export default Examination;
