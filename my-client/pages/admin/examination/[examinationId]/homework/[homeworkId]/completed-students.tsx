import {useRouter} from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import {useId, useState} from 'react';
import {ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import useSWR from 'swr';
import {format} from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatOutlined';
import {messengerHref} from '../../../../../../modules/utils/messenger';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {fetcher} from '../../../../../../modules/configuration/Configuration';
import {Admin} from '../../../../../../layout/Admin';
import {MySpinner} from '../../../../../../components/MySpinner';
import ErrorCard from '../../../../../../components/ErrorCard';
import {initialsOf} from '../../../../../../modules/configuration/students';
import {normalizeStudentName} from '../../../../../../modules/utils/homeworkResults';
import type {HomeworkResultRow, HomeworkResultsData, ResultStatus} from '../../../../../../modules/utils/homeworkResults';
import styles from '../../../../../../styles/HomeworkResults.module.css';

const STATUS_LABEL: Record<ResultStatus, string> = {finished: 'Finished', inProgress: 'In progress', notJoined: 'Not joined'}

export default function CompletedStudents() {
    const router = useRouter()
    const {examinationId, homeworkId} = router.query
    const [search, setSearch] = useState('')
    const {data, error, mutate} = useSWR<HomeworkResultsData>(examinationId && homeworkId
        ? [`/api/exams/${examinationId}/homeworks/${homeworkId}/results`, 'get'] : null, fetcher,
        {refreshInterval: 15000})
    const homeworkPath = `/admin/examination/${examinationId}/homework`
    const rows = data?.rows.filter(row => normalizeStudentName(row.name).includes(normalizeStudentName(search))) ?? []

    return <Admin>
        <Head><title>Homework results — Word Verification</title></Head>
        <div className={styles.page}>
            <header>
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <Link href="/admin/examination">Examinations</Link><span>/</span>
                    <Link href={homeworkPath}>{data?.title ?? 'Homework assignments'}</Link><span>/</span>
                    <span aria-current="page">Homework results</span>
                </nav>
                <Link href={homeworkPath} className={styles.mobileBack}><ArrowBackIcon fontSize="small"/>{data?.title ?? 'Homework assignments'}</Link>
                <h1 className={styles.title}>{data ? dateRange(data.beginningDate, data.deadlineDate) : 'Homework results'}</h1>
                {data && <p className={styles.subtitle}>{data.assignedCount} students {data.legacyRoster ? 'in current roster' : 'assigned'} · Grade {data.grade}</p>}
            </header>
            {error ? <ErrorCard title="We couldn't load homework results" message={error.message} onRetry={() => mutate()}/>
                : !data ? <MySpinner/> : <>
                    {data.legacyRoster && <p className={styles.note}>This homework has no saved recipient list. Showing the current Grade {data.grade} roster and recorded participants.</p>}
                    <section className={styles.stats} aria-label="Homework summary">
                        <Summary label="Finished" value={data.summary.finished} color="finished"/>
                        <Summary label="In progress" value={data.summary.inProgress} color="inProgress"/>
                        <Summary label="Not joined" value={data.summary.notJoined} color="notJoined"/>
                        <div className={styles.stat}><span>Average score</span><strong className={styles.average}>{data.summary.averageScore === null ? '—' : data.summary.averageScore.toFixed(1)}<small> / {data.questionCount}</small></strong></div>
                    </section>
                    <label className={styles.search}><SearchIcon fontSize="small"/><input type="search" aria-label="Filter by student name" placeholder="Filter by student name…" value={search} onChange={event => setSearch(event.target.value)}/></label>
                    <div className={styles.list} role="table" aria-label="Student homework results">
                        <div className={`${styles.row} ${styles.listHead}`} role="row">
                            {['Student', 'Status', 'Score', 'Joined at', 'Finished at'].map(label => <span key={label} role="columnheader">{label}</span>)}
                            <span role="columnheader" className={styles.srOnly}>Notify</span>
                        </div>
                        {rows.map((row, index) => <ResultRow key={row.id} row={row} index={index} questionCount={data.questionCount} minimumCorrectAnswers={data.minimumCorrectAnswers}/>)}
                    </div>
                    {!rows.length && <div className={styles.empty} role="status">{search.trim() ? 'No students match your search.' : 'No students assigned or answers recorded for this homework.'}</div>}
                    <span className={styles.srOnly} role="status">{rows.length} students shown</span>
                </>}
        </div>
    </Admin>
}

function Summary({label, value, color}: {label: string; value: number; color: ResultStatus}) {
    return <div className={styles.stat}><span>{label}</span><strong className={styles[color]}>{value}</strong></div>
}

function ResultRow({row, index, questionCount, minimumCorrectAnswers}: {row: HomeworkResultRow; index: number; questionCount: number; minimumCorrectAnswers: number}) {
    return <div className={`${styles.row} ${styles.item}`} role="row">
        <div className={styles.student} role="cell">
            <span className={`${styles.avatar} ${styles[`avatar${index % 5}`]}`} aria-hidden="true">{initialsOf(row.name)}</span>
            <div>
                <span>{row.name}</span>
                <div className={styles.location}>
                    {row.location ?
                        <a href={`https://www.google.com/maps/search/?api=1&query=${row.location.latitude},${row.location.longitude}`}
                           target="_blank" rel="noopener noreferrer" aria-label={`View test location for ${row.name} on map`}>
                            Address (Accuracy: {Math.round(row.location.accuracyMeters)} m)
                        </a>
                        : <span>Location not recorded</span>}
                </div>
            </div>
        </div>
        <span className={`${styles.status} ${styles[row.status]}`} role="cell"><i/>{STATUS_LABEL[row.status]}</span>
        <span className={`${styles.score} ${row.status !== 'finished' ? styles.muted : ''}`} role="cell" data-label="Score">{row.status === 'finished' ? `${row.score} / ${questionCount} · ${(row.score ?? 0) >= minimumCorrectAnswers ? 'Passed' : 'Not passed'}` : row.status === 'inProgress' && row.questionNumber !== null ? `Q${row.questionNumber} / ${questionCount}` : '—'}</span>
        <span className={styles.date} role="cell" data-label="Joined at">{displayDate(row.joinedAt)}</span>
        <span className={styles.date} role="cell" data-label="Finished at">{displayDate(row.finishedAt)}</span>
        <div className={styles.notify} role="cell">
            {row.status === 'finished' ? <span className={styles.muted}>—</span> : <NotifyMenu row={row}/>}
        </div>
    </div>
}

function NotifyMenu({row}: {row: HomeworkResultRow}) {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
    const id = useId()
    const messenger = messengerHref(row.facebook)
    const studentPhone = phoneHref(row.phone)
    const parentPhone = row.status === 'notJoined' ? phoneHref(row.parentPhone) : null
    const close = () => setAnchor(null)

    if (!messenger && !studentPhone && !parentPhone) {
        return <span className={styles.noContact}>No contact details</span>
    }

    return <>
        <button type="button" id={`${id}-button`} className={styles.notifyButton}
                aria-label={`Notify ${row.name}`} aria-haspopup="menu"
                aria-expanded={Boolean(anchor)} aria-controls={anchor ? `${id}-menu` : undefined}
                onClick={event => setAnchor(event.currentTarget)}>
            Notify<KeyboardArrowDownIcon fontSize="small"/>
        </button>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}
              anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
              transformOrigin={{vertical: 'top', horizontal: 'right'}}
              slotProps={{paper: {className: styles.notifyMenu}, list: {id: `${id}-menu`, 'aria-labelledby': `${id}-button`}}}>
            {messenger && <MenuItem component="a" href={messenger} target="_blank" rel="noopener noreferrer"
                                    className={styles.notifyMenuItem} onClick={close}>
                <ListItemIcon><ChatBubbleOutlineIcon fontSize="small"/></ListItemIcon>
                <ListItemText>Message on Messenger</ListItemText>
            </MenuItem>}
            {studentPhone && <MenuItem component="a" href={studentPhone} className={styles.notifyMenuItem} onClick={close}>
                <ListItemIcon><PhoneOutlinedIcon fontSize="small"/></ListItemIcon>
                <ListItemText>Call student</ListItemText>
            </MenuItem>}
            {parentPhone && <MenuItem component="a" href={parentPhone} className={styles.notifyMenuItem} onClick={close}>
                <ListItemIcon><PhoneOutlinedIcon fontSize="small"/></ListItemIcon>
                <ListItemText>Call parent</ListItemText>
            </MenuItem>}
        </Menu>
    </>
}

function phoneHref(phone: string): string | null {
    const number = phone.replace(/[^\d+]/g, '')
    return /^\+?\d{6,20}$/.test(number) ? `tel:${number}` : null
}

function displayDate(value: string | null) {
    return value && Number.isFinite(Date.parse(value)) ? format(new Date(value), 'MMM d, HH:mm') : '—'
}

function dateRange(beginning: string, deadline: string) {
    const start = new Date(beginning), end = new Date(deadline)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 'Homework results'
    return `${format(start, start.getFullYear() === end.getFullYear() ? 'MMM d' : 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}
