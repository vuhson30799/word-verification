import {useRouter} from "next/router";
import Link from "next/link";
import {Admin} from "../../../layout/Admin";
import {fetcher} from "../../../modules/configuration/Configuration";
import {MySpinner} from "../../../components/MySpinner";
import {ExaminationData, Question} from "../examination";
import {HomeworkData} from "./[examinationId]/homework";
import {getHomeworkStatus} from "../../../modules/utils/homeworkStatus";
import styles from "../../../styles/Examination.module.css";
import QuizIcon from "@mui/icons-material/Quiz";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AssignHomeworkModal from "../../../components/AssignHomeWorkModal";
import MyToast from "../../../components/MyToast";
import ErrorCard from "../../../components/ErrorCard";
import ConfirmDialog from "../../../components/ConfirmDialog";
import {useState} from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import {format} from "date-fns";

const ALL_TYPES = 'All'
const COLLAPSED_QUESTION_COUNT = 6
const TYPE_CHIP_STYLES = [styles.typeChipPrimary, styles.typeChipAccent]

export default function ExaminationDetail() {
    const router = useRouter()
    const {examinationId} = router.query
    const [homeworkURL, setHomeworkURL] = useState<string>()
    const [copied, setCopied] = useState<boolean>(false)
    const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<boolean>(false)
    const [deleteError, setDeleteError] = useState<string>()
    const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [showAll, setShowAll] = useState<boolean>(false)

    const {
        data: examination,
        error,
        mutate: refreshExamination
    } = useSWRImmutable<ExaminationData>(examinationId ? [`/api/exams/${examinationId}`, 'get'] : null, fetcher)

    const {
        data: homeworks,
        mutate: refreshHomeworks
    } = useSWR<HomeworkData[]>(examinationId ? [`/api/exams/${examinationId}/homeworks`, 'get'] : null, fetcher)

    if (error) {
        return (
            <Admin>
                <div className={styles.page}>
                    <ErrorCard title="We couldn't load this examination"
                               message={error.message}
                               onRetry={() => refreshExamination()}/>
                </div>
            </Admin>
        )
    }
    if (!examination || deleting) return <MySpinner/>
    // missing id when get examination from firebase database
    if (examination) examination.id = `${examinationId}`

    const questions = (examination.questions ?? []).filter(question => !!question)
    const questionTypes = Array.from(new Set(questions.map(question => question.questionType)))
    const filteredQuestions = questions.filter(question =>
        (typeFilter === ALL_TYPES || question.questionType === typeFilter)
        && question.title.toLowerCase().includes(searchTerm.toLowerCase()))
    const visibleQuestions = showAll ? filteredQuestions : filteredQuestions.slice(0, COLLAPSED_QUESTION_COUNT)
    const homeworkStatus = countHomeworkByStatus(homeworks ?? [])

    function handleHomeworkAssigned(url: string) {
        setHomeworkURL(url)
        setCopied(false)
        refreshHomeworks()
    }

    function handleCopyLink() {
        navigator.clipboard.writeText(homeworkURL as string).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    function handleDelete() {
        setConfirmingDelete(false)
        setDeleteError(undefined)
        setDeleting(true)
        fetcher([`/api/exams/${examinationId}`, 'delete'])
            .then(() => router.push('/admin/examination'))
            .then(() => router.reload())
            .catch(failure => {
                setDeleting(false)
                setDeleteError(failure.message)
            })
    }

    return (
        <Admin>
            <div className={styles.page}>
                {deleteError && <MyToast message={deleteError} severity="error"/>}
                <ConfirmDialog open={confirmingDelete}
                               title="Delete this examination?"
                               message={`"${examination.title}" and its questions will be permanently deleted. This cannot be undone.`}
                               confirmLabel="Delete examination"
                               onConfirm={handleDelete}
                               onCancel={() => setConfirmingDelete(false)}/>
                <div className={styles.breadcrumb}>
                    <Link href="/admin/examination" className={styles.breadcrumbLink}>Examinations</Link>
                    {' / '}
                    <span className={styles.breadcrumbCurrent}>{examination.title}</span>
                </div>

                <div className={styles.headerCard}>
                    <div className={styles.headerIcon}>
                        <QuizIcon/>
                    </div>
                    <div className={styles.headerInfo}>
                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>{examination.title}</h1>
                            <span className={styles.badge}>Grade {examination.grade}</span>
                        </div>
                        <div className={styles.meta}>
                            <span className={styles.creator}>
                                <span className={styles.avatar}>{getInitials(examination.creator)}</span>
                                {examination.creator}
                            </span>
                            <span>Created {formatCreatedDate(examination.createdDate)}</span>
                            <span>{questions.length} question{questions.length === 1 ? '' : 's'}</span>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button type="button" className={styles.secondaryButton}
                                onClick={() => router.push(`/admin/examination/${examinationId}/homework`)}>
                            Available homework
                        </button>
                        <AssignHomeworkModal title="Assign homework"
                                             buttonClassName={styles.primaryButton}
                                             examinationId={examination.id}
                                             onChange={handleHomeworkAssigned}/>
                        <button type="button" className={styles.dangerButton}
                                title="Delete examination" aria-label="Delete examination"
                                onClick={() => setConfirmingDelete(true)}>
                            <DeleteOutlinedIcon fontSize="small"/>
                        </button>
                    </div>
                </div>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Questions</span>
                        <span className={`${styles.statValue} ${styles.statValuePrimary}`}>{questions.length}</span>
                        <span className={styles.statHint}>{describeQuestionTypes(questions, questionTypes)}</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Total time</span>
                        <span className={styles.statValue}>{formatDuration(sumTimeouts(questions))}</span>
                        <span className={styles.statHint}>Sum of per-question timeouts</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Homework</span>
                        <span className={`${styles.statValue} ${styles.statValueSuccess}`}>{homeworks?.length ?? 0}</span>
                        <span className={styles.statHint}>
                            {homeworkStatus.active} active · {homeworkStatus.upcoming} upcoming · {homeworkStatus.ended} ended
                        </span>
                    </div>
                </div>

                {homeworkURL &&
                    <div className={styles.linkBanner}>
                        <div className={styles.linkBannerIcon}><CheckIcon fontSize="small"/></div>
                        <div className={styles.linkBannerText}>
                            <span className={styles.linkBannerTitle}>Homework assigned</span>
                            <span className={styles.linkBannerHint}>Share this link with students.</span>
                        </div>
                        <div className={styles.linkValue}>{homeworkURL}</div>
                        <button type="button" className={styles.copyButton} onClick={handleCopyLink}>
                            <ContentCopyIcon fontSize="small"/>
                            {copied ? 'Copied' : 'Copy link'}
                        </button>
                    </div>
                }

                <div className={styles.questions}>
                    <div className={styles.questionsHeader}>
                        <div className={styles.questionsTitle}>
                            Questions
                            <span className={styles.questionsCount}>{questions.length} in total</span>
                        </div>
                        <div className={styles.questionsTools}>
                            {questionTypes.length > 1 &&
                                <div className={styles.filter}>
                                    {[ALL_TYPES, ...questionTypes].map(type => (
                                        <button type="button" key={type}
                                                className={`${styles.filterOption} ${typeFilter === type ? styles.filterOptionActive : ''}`}
                                                onClick={() => setTypeFilter(type)}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            }
                            <div className={styles.searchBox}>
                                <SearchIcon fontSize="small"/>
                                <input className={styles.searchInput}
                                       placeholder="Search questions…"
                                       value={searchTerm}
                                       onChange={event => setSearchTerm(event.target.value)}/>
                            </div>
                        </div>
                    </div>

                    {filteredQuestions.length === 0
                        ? <div className={styles.emptyState}>
                            {questions.length === 0 ? 'There are no questions.' : 'No questions match your search.'}
                        </div>
                        : <>
                            <div className={styles.tableHead}>
                                <span>#</span><span>Question</span><span>Type</span><span>Timeout</span><span>Answer &amp; alternatives</span>
                            </div>
                            {visibleQuestions.map(question => (
                                <QuestionRow key={questions.indexOf(question)}
                                             number={questions.indexOf(question) + 1}
                                             question={question}
                                             chipStyle={TYPE_CHIP_STYLES[questionTypes.indexOf(question.questionType) % TYPE_CHIP_STYLES.length]}/>
                            ))}
                            {filteredQuestions.length > COLLAPSED_QUESTION_COUNT &&
                                <button type="button" className={styles.showMore} onClick={() => setShowAll(!showAll)}>
                                    {showAll ? 'Show fewer questions' : `Show all ${filteredQuestions.length} questions`}
                                </button>
                            }
                        </>
                    }
                </div>
            </div>
        </Admin>
    )
}

function QuestionRow({number, question, chipStyle}: { number: number, question: Question, chipStyle: string }) {
    const [answer, ...alternatives] = question.keys ?? []
    return (
        <div className={styles.row}>
            <span className={styles.rowNumber}>{String(number).padStart(2, '0')}</span>
            <span className={styles.rowTitle}>{question.title}</span>
            <span className={`${styles.typeChip} ${chipStyle}`}>{question.questionType}</span>
            <span className={styles.timeout}><AccessTimeIcon/>{question.timeout}s</span>
            <div className={styles.keys}>
                {answer && <span className={styles.keyAnswer}>{answer}</span>}
                {alternatives.length === 0
                    ? <span className={styles.noAlternatives}>No alternatives</span>
                    : alternatives.map((alternative, index) => (
                        <span className={styles.keyAlternative} key={index}>{alternative}</span>
                    ))}
            </div>
        </div>
    )
}

function describeQuestionTypes(questions: Question[], questionTypes: string[]): string {
    if (questionTypes.length === 0) return 'No questions yet'
    return questionTypes
        .map(type => `${questions.filter(question => question.questionType === type).length} ${type.toLowerCase()}`)
        .join(' · ')
}

function sumTimeouts(questions: Question[]): number {
    return questions.reduce((total, question) => total + (Number(question.timeout) || 0), 0)
}

function formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    if (minutes === 0) return `${seconds}s`
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
}

function countHomeworkByStatus(homeworks: HomeworkData[]) {
    const status = {active: 0, upcoming: 0, ended: 0}
    homeworks.forEach(homework => status[getHomeworkStatus(homework)]++)
    return status
}

function getInitials(name: string | undefined): string {
    if (!name) return '?'
    return name.split(/\s+/).filter(Boolean).slice(-2).map(part => part[0].toUpperCase()).join('')
}

function formatCreatedDate(createdDate: string): string {
    const parsed = new Date(createdDate)
    if (isNaN(parsed.getTime())) return createdDate
    return format(parsed, 'MMM d, yyyy')
}
