import useSWR from "swr";
import {Admin} from "../../layout/Admin";
import styles from "../../styles/Examination.module.css"
import {getSWRConfiguration} from "../../modules/configuration/Configuration";
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
    } = useSWR<ExaminationData[]>('/exams', getSWRConfiguration('http://localhost:8080/exams', 'get'))
    if (!examinations && !error) return <MySpinner/>
    return (
        !!examinations ? <Admin>
            <div className={styles.Examination}>
                <Grid columns={1} rowSpacing={2} container>
                    {
                        examinations.map((examination, key) => {
                            return (
                                <Link href={`/admin/exam/${examination.id}`} key={key}>
                                    <Grid item xs={12} md={12} xl={12}>
                                        <Paper className={styles.Paper} elevation={3}>
                                            <Image src="/logo.png" width="90px" height="90px"
                                                   style={{backgroundColor: getRandomColor()}}/>
                                            <div className={styles.ExaminationInfo}>
                                                <strong className={styles.ExaminationInfoTitle}>{examination.title}</strong>
                                                <div className={styles.ExaminationInfoQuestion}>
                                                    <QuizIcon />
                                                    {examination.questions ? examination.questions.length : 0} Questions
                                                </div>
                                                <div className={styles.ExaminationInfoAuthor}>{examination.creator} . {examination.createdDate}</div>
                                            </div>
                                        </Paper>
                                    </Grid>
                                </Link>
                            )
                        })
                    }
                </Grid>
            </div>
        </Admin> : <MySpinner/>
    )
}

export default Examination;
