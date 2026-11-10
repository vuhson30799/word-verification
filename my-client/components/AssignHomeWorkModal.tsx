import {Alert, Button, Dialog} from "@mui/material";
import {FormEvent, useState} from "react";
import useSWR from "swr";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {convertDate} from "../modules/utils/dateUtils";
import {assignHomeworkFetcher, fetcher} from "../modules/configuration/Configuration";
import {StudentData} from "../modules/configuration/students";
import {ClassData} from "../modules/configuration/classes";
import styles from "../styles/AssignHomeworkModal.module.css";

export interface AssignHomeworkModalProps {
    title: string
    examinationId: string
    examinationTitle?: string
    grade?: number
    onChange: (url: string) => unknown
    buttonClassName?: string
}

export interface AssignHomeworkData {
    beginningDate: string
    deadlineDate: string
    studentIds?: string[]
}

interface Roster { students: StudentData[]; classes: ClassData[] }

export default function AssignHomeworkModal(props: AssignHomeworkModalProps) {
    const [open, setOpen] = useState(false)
    return <div className={props.buttonClassName ? undefined : styles.AssignHomework}>
        {props.buttonClassName
            ? <button type="button" className={props.buttonClassName} onClick={() => setOpen(true)}><AddIcon fontSize="small"/>{props.title}</button>
            : <Button variant="contained" endIcon={<AddIcon/>} onClick={() => setOpen(true)}>{props.title}</Button>}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false}
                aria-labelledby="assign-homework-title"
                slotProps={{paper: {className: styles.dialog}, backdrop: {sx: {backgroundColor: 'rgba(28,27,31,.35)'}}}}>
            {open && <AssignmentForm {...props} onClose={() => setOpen(false)}/>}
        </Dialog>
    </div>
}

function AssignmentForm(props: AssignHomeworkModalProps & {onClose: () => void}) {
    const {data, error, mutate} = useSWR<Roster>([`/api/exams/${props.examinationId}/assignment-roster`, 'get'], fetcher)
    const [dates, setDates] = useState(() => {
        const start = new Date()
        const end = new Date(start)
        end.setDate(end.getDate() + 7)
        end.setHours(23, 59, 0, 0)
        return {beginningDate: convertDate(start, 'yyyy-MM-ddThh:mm'), deadlineDate: convertDate(end, 'yyyy-MM-ddThh:mm')}
    })
    const [selection, setSelection] = useState<string[] | null>(null)
    const [search, setSearch] = useState('')
    const [showAll, setShowAll] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const classes = data?.classes ?? []
    const students = data?.students ?? []
    const gradeClasses = classes.filter(c => Number(c.grade) === Number(props.grade))
    const selectedIds = selection ?? students.filter(s => s.classIds.some(id => gradeClasses.some(c => c.id === id))).map(s => s.id)
    const selected = students.filter(s => selectedIds.includes(s.id))
    const results = search.trim() ? students.filter(s => !selectedIds.includes(s.id) && s.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) : []
    const classLabel = (student: StudentData) => classes.filter(c => student.classIds.includes(c.id)).map(c => c.name).join(', ') || 'Unassigned'

    async function assign(event: FormEvent) {
        event.preventDefault()
        if (submitting) return
        if (!dates.beginningDate || !dates.deadlineDate || !Number.isFinite(Date.parse(dates.beginningDate)) || !Number.isFinite(Date.parse(dates.deadlineDate)) || Date.parse(dates.deadlineDate) <= Date.parse(dates.beginningDate)) {
            setSubmitError('Deadline must be after the beginning date.'); return
        }
        if (!selectedIds.length) { setSubmitError('Select at least one student.'); return }
        setSubmitting(true)
        setSubmitError('')
        try {
            const url = await assignHomeworkFetcher([`/api/exams/${props.examinationId}/homeworks`, 'post', {...dates, studentIds: selectedIds}])
            props.onChange(url)
            props.onClose()
        } catch (failure) {
            setSubmitError(failure instanceof Error ? failure.message : 'Could not assign homework. Please try again.')
        } finally { setSubmitting(false) }
    }

    return <form className={styles.form} onSubmit={assign} aria-busy={submitting}>
        <div className={styles.header}>
            <div><h2 id="assign-homework-title">Assign homework</h2><p>{props.examinationTitle}</p></div>
            <button type="button" className={styles.close} aria-label="Close assignment modal" onClick={props.onClose}><CloseIcon fontSize="small"/></button>
        </div>
        <fieldset disabled={submitting} className={styles.fields}>
            <div className={styles.dates}>
                <label>Beginning date<input type="datetime-local" required value={dates.beginningDate} onChange={e => setDates({...dates, beginningDate: e.target.value})}/></label>
                <label>Deadline date<input type="datetime-local" required value={dates.deadlineDate} min={dates.beginningDate} onChange={e => setDates({...dates, deadlineDate: e.target.value})}/></label>
            </div>
            <div className={styles.divider}/>
            <div className={styles.rosterHeader}>
                <div><h3>Assign to</h3><p>Defaults to Grade {props.grade} — add or remove students below.</p></div>
                <button type="button" className={styles.removeAll} disabled={!selectedIds.length} onClick={() => setSelection([])}><DeleteOutlinedIcon/>Remove all</button>
            </div>
            {error ? <Alert severity="error" action={<Button onClick={() => mutate()}>Retry</Button>}>Could not load students.</Alert>
                : !data ? <p role="status">Loading students…</p> : <>
                    <label className={styles.search}><SearchIcon fontSize="small"/><input aria-label="Add a student by name" placeholder="Add a student by name…" value={search} onChange={e => setSearch(e.target.value)}/></label>
                    {search.trim() && <div className={styles.results}>
                        {results.length ? results.map(s => <button type="button" key={s.id} onClick={() => {setSelection([...selectedIds, s.id]); setSearch('')}}>{s.name}<span>{classLabel(s)}</span><AddIcon fontSize="small"/></button>) : <p>No matching students to add.</p>}
                    </div>}
                    <div className={`${styles.chips} ${showAll ? styles.expanded : ''}`}>
                        {(showAll ? selected : selected.slice(0, 7)).map(s => <span key={s.id} className={`${styles.chip} ${s.classIds.some(id => gradeClasses.some(c => c.id === id)) ? '' : styles.otherGrade}`}>
                            {s.name}<span>· {classLabel(s)}</span><button type="button" aria-label={`Remove ${s.name}`} onClick={() => setSelection(selectedIds.filter(id => id !== s.id))}>×</button>
                        </span>)}
                        {!selected.length && <p>No students selected. Search above to add students.</p>}
                    </div>
                    {selected.length > 7 && <button type="button" className={styles.showAll} onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer students' : `Show all ${selected.length} students`}</button>}
                </>}
        </fieldset>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <div className={styles.footer}>
            <span aria-live="polite">{selected.length} student{selected.length === 1 ? '' : 's'} selected</span>
            <button type="button" className={styles.cancel} onClick={props.onClose}>Cancel</button>
            <button type="submit" className={styles.assign} disabled={submitting || !data || !!error || !selected.length}>{submitting ? 'Assigning…' : 'Assign'}</button>
        </div>
    </form>
}
