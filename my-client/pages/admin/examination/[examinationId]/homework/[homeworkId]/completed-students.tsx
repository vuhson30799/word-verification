import {hasPassedExamination} from "../../../../../../modules/utils/examinationPassing";
import {useRouter} from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import {useEffect, useId, useRef, useState} from 'react';
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

import {DEFAULT_POLL_INTERVAL, pollingInterval} from '../../../../../../modules/progress/types';
import type {ProgressSnapshot} from '../../../../../../modules/progress/types';
import {requestRefresh} from '../../../../../../modules/progress/client';
import {applySnapshots} from '../../../../../../modules/progress/results';

const STATUS_LABEL: Record<ResultStatus, string> = {finished: 'Finished', inProgress: 'In progress', notJoined: 'Not joined'}

export default function CompletedStudents() {
    const router = useRouter()
    const {examinationId, homeworkId} = router.query
    const [search, setSearch] = useState('')
    const [interval, setIntervalValue] = useState(DEFAULT_POLL_INTERVAL)
    const [lastRefresh, setLastRefresh] = useState<Date>()
    const [collecting, setCollecting] = useState(false)
    const [refreshError, setRefreshError] = useState('')
    const [requestId, setRequestId] = useState('')
    const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([])
    const cleanup = useRef<(() => void) | undefined>(undefined)
    const generation = useRef(0)
    useEffect(() => {
        try {setIntervalValue(pollingInterval(localStorage.getItem('wv:results-poll-interval')))} catch { /* Auto-refresh stays off. */ }
    }, [])
    useEffect(() => {
        generation.current++
        setSnapshots([]); setRequestId(''); setRefreshError(''); setCollecting(false); setLastRefresh(undefined)
        return () => {generation.current++; cleanup.current?.()}
    }, [examinationId, homeworkId])
    const {data, error, mutate, isValidating} = useSWR<HomeworkResultsData>(examinationId && homeworkId
        ? [`/api/exams/${examinationId}/homeworks/${homeworkId}/results`, 'get'] : null, fetcher,
        {refreshInterval: interval, refreshWhenHidden: false, refreshWhenOffline: false, revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false, onSuccess: () => setLastRefresh(new Date())})
    const homeworkPath = `/admin/examination/${examinationId}/homework`
    const displayed = data ? applySnapshots(data, snapshots) : undefined
    const rows = displayed?.rows.filter(row => normalizeStudentName(row.name).includes(normalizeStudentName(search))) ?? []

    function changeInterval(value: string) {
        const next = pollingInterval(value)
        setIntervalValue(next)
        try {localStorage.setItem('wv:results-poll-interval', `${next}`)} catch { /* The selection still applies to this screen. */ }
    }
    async function refreshProgress() {
        if (collecting || isValidating || typeof examinationId !== 'string' || typeof homeworkId !== 'string') return
        const current = generation.current
        cleanup.current?.()
        setCollecting(true); setRefreshError(''); setSnapshots([]); setRequestId('')
        try {
            await mutate()
            if (current !== generation.current) return
            setLastRefresh(new Date())
            const active = await requestRefresh(examinationId, homeworkId,
                values => {if (current === generation.current) setSnapshots(values)},
                message => {if (current === generation.current) setRefreshError(message)},
                () => {if (current === generation.current) setCollecting(false)},
                id => {if (current === generation.current) setRequestId(id)},
                () => current !== generation.current)
            if (current !== generation.current) active.stop()
            else cleanup.current = active.stop
        } catch (problem) {
            if (current === generation.current) {setRefreshError(problem instanceof Error ? problem.message : 'Could not refresh progress.'); setCollecting(false)}
        }
    }

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
            <section className={styles.refreshControls} aria-label="Progress refresh controls">
                <label>Auto-refresh <select aria-label="Auto-refresh" value={interval} onChange={event => changeInterval(event.target.value)}>
                    <option value={0}>Off</option><option value={300000}>5 minutes</option><option value={600000}>10 minutes</option>
                </select></label>
                <button type="button" className={styles.notifyButton} disabled={collecting || isValidating} onClick={refreshProgress}>{collecting ? 'Collecting progress…' : 'Refresh progress'}</button>
                <span role="status">{lastRefresh ? `Results updated ${lastRefresh.toLocaleTimeString()}` : 'Loading results…'}</span>
            </section>
            <p className={styles.note}>Auto-refresh reads saved results. Refresh progress asks connected students for an update. Progress and scores are last reported, not a connectivity check.</p>
            {refreshError && <p role="alert" className={styles.refreshError}>{refreshError}</p>}
            {error && data && <p role="alert" className={styles.refreshError}>{error.message}</p>}
            {error && !data ? <ErrorCard title="We couldn't load homework results" message={error.message} onRetry={() => mutate()}/>
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
                            {['Student', 'Status', 'Best score', 'Joined at', 'Finished at'].map(label => <span key={label} role="columnheader">{label}</span>)}
                            <span role="columnheader" className={styles.srOnly}>Notify</span>
                        </div>
                        {rows.map((row, index) => <ResultRow key={row.id} row={row} index={index} questionCount={data.questionCount} maximumIncorrectAnswers={data.maximumIncorrectAnswers} requestId={requestId} collecting={collecting}/>)}
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

function ResultRow({row, index, questionCount, maximumIncorrectAnswers, requestId, collecting}: {row: HomeworkResultRow; index: number; questionCount: number; maximumIncorrectAnswers: number; requestId: string; collecting: boolean}) {
    const progress = row.status === 'inProgress' && row.questionNumber != null
        ? `Q${row.questionNumber}/${questionCount}`
        : null
    const points = row.score ?? row.currentScore
    const outcome = row.score == null ? '' : hasPassedExamination(row.score, questionCount, maximumIncorrectAnswers) ? ' · Passed' : ' · Not passed'

    return <div className={`${styles.row} ${styles.item}`} role="row">
        <div className={styles.student} role="cell">
            <span className={`${styles.avatar} ${styles[`avatar${index % 5}`]}`} aria-hidden="true">{initialsOf(row.name)}</span>
            <div>
                <span>{row.name}</span>
                <div className={styles.location}>
                    {row.currentStatus && <span>Latest attempt: {row.currentStatus === 'completed' ? 'completed' : row.currentStatus === 'completedPending' ? 'finished, submission pending' : row.currentStatus === 'interrupted' ? 'interrupted' : progress ? 'in progress' : `Q${row.questionNumber ?? '?'} / ${questionCount}`} {row.score != null && row.currentScore != null ? `· ${row.currentScore} points` : ''}</span>}
                    <span>{row.lastReportedAt ? `Last reported ${displayDate(new Date(row.lastReportedAt).toISOString())}` : 'No progress report yet'}</span>
                    {requestId && <span>{row.refreshRequestId === requestId ? 'Responded to refresh' : collecting ? 'Waiting for response…' : 'No response — status may be stale'}</span>}
                    {row.location ?
                        <a href={`https://www.google.com/maps/search/?api=1&query=${row.location.latitude},${row.location.longitude}`}
                           target="_blank" rel="noopener noreferrer" aria-label={`View test location for ${row.name} on map`}>
                            Address (Accuracy: {Math.round(row.location.accuracyMeters)} m)
                        </a>
                        : <span>Location not recorded</span>}
                </div>
            </div>
        </div>
        <span className={`${styles.status} ${styles[row.status]}`} role="cell">
            <i/><span>{STATUS_LABEL[row.status]}{progress && <small className={styles.questionProgress}>{progress}</small>}</span>
        </span>
        <span className={`${styles.score} ${points == null ? styles.muted : ''}`} role="cell" data-label="Best score">
            {points == null ? '—' : `${points} / ${questionCount}${outcome}`}
        </span>
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
