import {Admin} from "../../layout/Admin";
import styles from "../../styles/ExaminationList.module.css"
import {fetcher} from "../../modules/configuration/Configuration";
import {MySpinner} from "../../components/MySpinner";
import Link from "next/link";
import QuizIcon from '@mui/icons-material/Quiz';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MyToast from "../../components/MyToast";
import React, {useState} from "react";
import {orderBy} from "lodash";
import useSWR from "swr";
import {format} from "date-fns";

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
    maximumIncorrectAnswers?: number
    creator: string
}

const CARD_GRADIENTS = [
    'linear-gradient(135deg, #E7EEF1, #1C4A63)',
    'linear-gradient(135deg, #F7E9F5, #B541E2)',
    'linear-gradient(135deg, #EFEEF9, #5B5FEF)',
    'linear-gradient(135deg, #FDEFE7, #E0784F)',
]

function Examination() {
    const {
        data: examinations,
        error
    } = useSWR<ExaminationData[]>(['/api/exams', 'get'], fetcher)
    const [searchTerm, setSearchTerm] = useState('')

    if (error) return <MyToast message={error.message} severity={"error"}/>
    if (!examinations) return <MySpinner/>

    const normalizedSearchTerm = searchTerm.toLowerCase()
    const filtered = examinations.filter(examination =>
        !normalizedSearchTerm ||
        (typeof examination.title === 'string' && examination.title.toLowerCase().includes(normalizedSearchTerm)))
    const ordered = orderExamsByCreatedDate(filtered)

    return (
        <Admin>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.headerTitle}>Examinations</h1>
                        <span className={styles.headerSubtitle}>
                            {examinations.length} exam{examinations.length === 1 ? '' : 's'}
                        </span>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.searchBox}>
                            <SearchIcon fontSize="small"/>
                            <input
                                className={styles.searchInput}
                                placeholder="Search examinations…"
                                value={searchTerm}
                                onChange={event => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <Link href="/admin/quiz" className={styles.newExamButton}>
                            <AddIcon fontSize="small"/>
                            New exam
                        </Link>
                    </div>
                </div>

                {ordered.length === 0
                    ? <div className={styles.emptyState}>
                        {searchTerm ? 'No examinations match your search.' : 'No examinations yet — create one to get started.'}
                    </div>
                    : <div className={styles.grid}>
                        {ordered.map((examination, index) => (
                            <Link href={`/admin/examination/${examination.id}`} className={styles.card} key={examination.id}>
                                <div className={styles.cardIcon} style={{background: CARD_GRADIENTS[index % CARD_GRADIENTS.length]}}>
                                    <QuizIcon/>
                                </div>
                                <div>
                                    <div className={styles.cardTitle}>{examination.title}</div>
                                    <span className={styles.cardBadge}>Grade {examination.grade}</span>
                                </div>
                                <div className={styles.cardFooter}>
                                    <span>{examination.questions ? examination.questions.length : 0} questions</span>
                                    <span>{formatCreatedDate(examination.createdDate)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                }
            </div>
        </Admin>
    )
}

function orderExamsByCreatedDate(examinations: ExaminationData[]): ExaminationData[] {
    return orderBy(examinations, (exam) => {
        return Date.parse(exam.createdDate)
    }, ['desc'])
}

function formatCreatedDate(createdDate: string): string {
    const parsed = new Date(createdDate)
    if (isNaN(parsed.getTime())) return createdDate
    return format(parsed, 'MMM d, yyyy')
}

export default Examination;
