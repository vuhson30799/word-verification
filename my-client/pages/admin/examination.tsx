import {Admin} from "../../layout/Admin";
import styles from "../../styles/Examination.module.css"
import {fetcher} from "../../modules/configuration/Configuration";
import {MySpinner} from "../../components/MySpinner";
import {Grid, Pagination, Paper, Stack} from "@mui/material";
import Link from "next/link";
import Image from 'next/image'
import {getRandomColor} from "../../modules/utils/color";
import QuizIcon from '@mui/icons-material/Quiz';
import MyToast from "../../components/MyToast";
import React from "react";
import {orderBy} from "lodash";
import useSWR from "swr";
import {pageSize} from "../../constant/ApplicationConstant";


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
    const [page, setPage] = React.useState<number>(0);
    const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value - 1);
    };
    const {
        data: examinations,
        error
    } = useSWR<ExaminationData[]>([`/api/latest-exams?page=${page}`, 'get'], fetcher)

    const {
        data: totalExams,
        error: fetchTotalExamError
    } = useSWR<number>(['/api/counter?q=examination', 'get'], fetcher)
    if (error || fetchTotalExamError) return <MyToast message={error?.message || fetchTotalExamError?.message}
                                                      severity={"error"}/>
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
                    {totalExams &&
                        <Grid item xs={12} md={12} xl={12}>
                            <Stack spacing={2} sx={{display: "flex", alignItems: "center"}}>
                                <Pagination count={Math.ceil(totalExams / pageSize)}
                                            color="secondary"
                                            onChange={handleChange}/>
                            </Stack>
                        </Grid>
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
