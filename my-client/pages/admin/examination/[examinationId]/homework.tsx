import {useRouter} from "next/router";
import Link from "next/link";
import {useState} from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import {format} from "date-fns";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {Admin} from "../../../../layout/Admin";
import {fetcher} from "../../../../modules/configuration/Configuration";
import {getHomeworkStatus, HomeworkStatus} from "../../../../modules/utils/homeworkStatus";
import {MySpinner} from "../../../../components/MySpinner";
import MyToast from "../../../../components/MyToast";
import AssignHomeworkModal from "../../../../components/AssignHomeWorkModal";
import ErrorCard from "../../../../components/ErrorCard";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import {ExaminationData} from "../../examination";
import styles from "../../../../styles/Homework.module.css";

export interface HomeworkData {
    id: string
    url: string
    beginningDate: string
    deadlineDate: string
}

const STATUS_LABELS: Record<HomeworkStatus, string> = {
    active: 'Active',
    upcoming: 'Upcoming',
    ended: 'Ended'
}

export default function Homework() {
    const router = useRouter()
    const {examinationId} = router.query
    const [deleteError, setDeleteError] = useState<string>()
    const [homeworkToDelete, setHomeworkToDelete] = useState<HomeworkData>()
    const {
        data: homeworks,
        error: homeworksError,
        mutate: refreshHomeworks
    } = useSWR<HomeworkData[]>(examinationId ? [`/api/exams/${examinationId}/homeworks`, 'get'] : null, fetcher)
    const {
        data: examination,
        error: examinationError
    } = useSWRImmutable<ExaminationData>(examinationId ? [`/api/exams/${examinationId}`, 'get'] : null, fetcher)

    const error = homeworksError || examinationError
    if (!error && (!homeworks || !examination)) return <MySpinner/>

    function handleDelete(homework: HomeworkData) {
        setHomeworkToDelete(undefined)
        setDeleteError(undefined)
        fetcher([`/api/exams/${examinationId}/homeworks/${homework.id}`, 'delete'])
            .then(() => refreshHomeworks())
            .catch(failure => setDeleteError(failure.message))
    }

    const assignButton = (
        <AssignHomeworkModal title="Assign homework"
                             examinationTitle={examination?.title}
                             grade={examination?.grade}
                             buttonClassName={styles.primaryButton}
                             examinationId={`${examinationId}`}
                             onChange={() => refreshHomeworks()}/>
    )

    return (
        <Admin>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.breadcrumb}>
                            <Link href="/admin/examination" className={styles.breadcrumbLink}>Examinations</Link>
                            {' / '}
                            <Link href={`/admin/examination/${examinationId}`} className={styles.breadcrumbLink}>
                                {examination?.title ?? 'Examination'}
                            </Link>
                        </div>
                        <h1 className={styles.title}>Homework assignments</h1>
                    </div>
                    {!error && homeworks && homeworks.length > 0 && assignButton}
                </div>

                {deleteError && <MyToast message={deleteError} severity="error"/>}
                <ConfirmDialog open={!!homeworkToDelete}
                               title="Delete this homework?"
                               message="All answers students submitted for this homework will be permanently deleted too. This cannot be undone."
                               confirmLabel="Delete homework"
                               onConfirm={() => homeworkToDelete && handleDelete(homeworkToDelete)}
                               onCancel={() => setHomeworkToDelete(undefined)}/>

                {error
                    ? <ErrorCard title="We couldn't load the homework"
                                 message={error.message}
                                 onRetry={() => refreshHomeworks()}/>
                    : homeworks && homeworks.length === 0
                        ? <div className={styles.state}>
                            <div className={styles.stateIcon}><AssignmentOutlinedIcon/></div>
                            <div className={styles.stateTitle}>No homework assigned yet</div>
                            <div className={styles.stateText}>
                                Assign this examination to get a link your students can open to take it.
                            </div>
                            {assignButton}
                        </div>
                        : <div className={styles.list}>
                            <div className={`${styles.row} ${styles.listHead}`}>
                                <span>Status</span><span>Beginning</span><span>Deadline</span><span>Actions</span>
                            </div>
                            {homeworks && [...homeworks]
                                .sort((a, b) => Date.parse(b.beginningDate) - Date.parse(a.beginningDate))
                                .map(homework => (
                                    <HomeworkRow key={homework.id}
                                                 homework={homework}
                                                 onResults={() => router.push(`/admin/examination/${examinationId}/homework/${homework.id}/completed-students`)}
                                                 onDelete={() => setHomeworkToDelete(homework)}/>
                                ))}
                        </div>
                }
            </div>
        </Admin>
    )
}

function HomeworkRow({homework, onResults, onDelete}: {
    homework: HomeworkData,
    onResults: () => void,
    onDelete: () => void
}) {
    const [copied, setCopied] = useState<boolean>(false)
    const status = getHomeworkStatus(homework)

    function handleCopy() {
        navigator.clipboard.writeText(homework.url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <div className={`${styles.row} ${styles.item} ${status === 'ended' ? styles.itemEnded : ''}`}>
            <span className={`${styles.status} ${styles[`status_${status}`]}`}>
                <span className={styles.statusDot}/>
                {STATUS_LABELS[status]}
            </span>
            <span data-label="Beginning">{formatDateTime(homework.beginningDate)}</span>
            <span data-label="Deadline">{formatDateTime(homework.deadlineDate)}</span>
            <div className={styles.actions}>
                <button type="button" className={styles.iconButton}
                        title={copied ? 'Copied' : 'Copy homework link'} aria-label="Copy homework link"
                        onClick={handleCopy}>
                    {copied ? <CheckIcon fontSize="small"/> : <ContentCopyIcon fontSize="small"/>}
                    <span className={styles.copyLabel}>{copied ? 'Copied' : 'Copy link'}</span>
                </button>
                <button type="button" className={styles.textButton} onClick={onResults}>Results</button>
                <button type="button" className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                        title="Delete homework" aria-label="Delete homework"
                        onClick={onDelete}>
                    <DeleteOutlinedIcon fontSize="small"/>
                </button>
            </div>
        </div>
    )
}

function formatDateTime(value: string): string {
    const parsed = new Date(value)
    if (isNaN(parsed.getTime())) return value
    return format(parsed, 'MMM d, yyyy HH:mm')
}
