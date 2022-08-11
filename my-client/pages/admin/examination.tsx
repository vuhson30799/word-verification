import {Admin} from "../../layout/Admin";
import styles from "../../styles/Examination.module.css"
import {fetcher} from "../../modules/configuration/Configuration";
import {MySpinner} from "../../components/MySpinner";
import {Grid, Paper} from "@mui/material";
import Link from "next/link";
import Image from 'next/image'
import {getRandomColor} from "../../modules/utils/color";
import QuizIcon from '@mui/icons-material/Quiz';
import MyToast from "../../components/MyToast";
import React from "react";
import {orderBy} from "lodash";
import useSWR from "swr";


export interface Question {
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
    } = useSWR<ExaminationData[]>(['/api/exams', 'get'], fetcher)
    if (error) return <MyToast message={error.message} severity={"error"} />
    if (!examinations) return <MySpinner/>
    return (
        <Admin>
            <div className={styles.Examination}>
                <Grid rowSpacing={2} container>
                    {
                        orderExamsByCreatedDate(examinations).map((examination, key) => {
                            return (
                                <Grid container key={key}>
                                    <Grid item xs={2} md={2} xl={2}/>
                                    <Grid item xs={8} md={8} xl={8}>
                                        <Link href={`/admin/examination/${examination.id}`}>
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
                                </Grid>
                            )
                        })
                    }
                </Grid>
            </div>
        </Admin>
    )
}

function orderExamsByCreatedDate(examinations: ExaminationData[]): ExaminationData[] {
    return orderBy(examinations, (exam) => {
        return Date.parse(exam.createdDate)
    }, ['desc'])
}

export default Examination;
