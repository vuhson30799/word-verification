import React, {useMemo, useState} from "react";
import {useRouter} from "next/router";
import useSWR from "swr";
import {orderBy, uniq} from "lodash";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {Admin} from "../../../layout/Admin";
import ConfigurationTabs from "../../../components/ConfigurationTabs";
import StudentDialog from "../../../components/StudentDialog";
import ConfirmDialog from "../../../components/ConfirmDialog";
import ErrorCard from "../../../components/ErrorCard";
import MyToast from "../../../components/MyToast";
import {MySpinner} from "../../../components/MySpinner";
import {fetcher, fetcherWithForm} from "../../../modules/configuration/Configuration";
import {ClassData} from "../../../modules/configuration/classes";
import {
    facebookHref,
    facebookLabel,
    initialsOf,
    StudentData,
    StudentInput
} from "../../../modules/configuration/students";
import page from "../../../styles/Configuration.module.css";
import styles from "../../../styles/ConfigurationStudents.module.css";

const AVATAR_COLORS = ['#D9D3C4', '#E7C9DA', '#C7D6DC', '#E0784F', '#5B5FEF']
const STUDENTS_KEY = ['/api/students', 'get']
const CLASSES_KEY = ['/api/classes', 'get']

function avatarColor(name: string): string {
    const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0)
    return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function Students() {
    const router = useRouter()
    const classFilter = typeof router.query.classId === 'string' ? router.query.classId : undefined
    const {data: students, error, mutate} = useSWR<StudentData[]>(STUDENTS_KEY, fetcher)
    const {data: classes, error: classesError} = useSWR<ClassData[]>(CLASSES_KEY, fetcher)
    const [searchTerm, setSearchTerm] = useState('')
    const [gradeFilter, setGradeFilter] = useState<number | 'unassigned'>()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<StudentData>()
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string>()
    const [deleting, setDeleting] = useState<StudentData>()
    const [toast, setToast] = useState<{message: string, severity: 'success' | 'error', key: number}>()

    const classById = useMemo(() => new Map((classes ?? []).map(c => [c.id, c])), [classes])
    const grades = useMemo(() => uniq((classes ?? []).map(c => c.grade)).sort((a, b) => a - b), [classes])

    const visible = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        const filtered = (students ?? []).filter(student => {
            if (term && !student.name.toLowerCase().includes(term)) return false
            if (classFilter && !student.classIds.includes(classFilter)) return false
            if (gradeFilter === 'unassigned') return student.classIds.length === 0
            if (gradeFilter !== undefined) return student.classIds.some(id => classById.get(id)?.grade === gradeFilter)
            return true
        })
        return orderBy(filtered, [s => s.name.toLowerCase()])
    }, [students, searchTerm, classFilter, gradeFilter, classById])

    const notify = (message: string, severity: 'success' | 'error') => setToast({message, severity, key: Date.now()})

    const openDialog = (target?: StudentData) => {
        setEditing(target)
        setSaveError(undefined)
        setDialogOpen(true)
    }

    const handleSave = async (input: StudentInput) => {
        setSaving(true)
        setSaveError(undefined)
        try {
            await fetcherWithForm(editing
                ? [`/api/students/${editing.id}`, 'PUT', input]
                : ['/api/students', 'POST', input])
            await mutate()
            setDialogOpen(false)
            notify(editing ? 'Student updated.' : 'Student added.', 'success')
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Cannot save this student.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        const target = deleting
        setDeleting(undefined)
        if (!target) return
        try {
            await fetcherWithForm([`/api/students/${target.id}`, 'DELETE', undefined])
            await mutate()
            notify(`${target.name} deleted.`, 'success')
        } catch (e) {
            notify(e instanceof Error ? e.message : 'Cannot delete this student.', 'error')
        }
    }

    const loadError = error ?? classesError

    return (
        <Admin>
            <div className={page.page}>
                <div>
                    <h1 className={page.title}>Configuration</h1>
                    <ConfigurationTabs/>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterLeft}>
                        <div className={styles.searchBox}>
                            <SearchIcon fontSize="small"/>
                            <input className={styles.searchInput} placeholder="Search students…" value={searchTerm}
                                   aria-label="Search students" onChange={event => setSearchTerm(event.target.value)}/>
                        </div>
                        <div className={styles.pills}>
                            <button type="button" className={`${styles.pill} ${gradeFilter === undefined ? styles.pillActive : ''}`}
                                    onClick={() => setGradeFilter(undefined)}>All grades</button>
                            {grades.map(grade => (
                                <button type="button" key={grade}
                                        className={`${styles.pill} ${gradeFilter === grade ? styles.pillActive : ''}`}
                                        onClick={() => setGradeFilter(grade)}>Grade {grade}</button>
                            ))}
                            <button type="button" className={`${styles.pill} ${gradeFilter === 'unassigned' ? styles.pillActive : ''}`}
                                    onClick={() => setGradeFilter('unassigned')}>Unassigned</button>
                            {classFilter &&
                                <button type="button" className={`${styles.pill} ${styles.pillActive}`}
                                        title="Show all classes"
                                        onClick={() => router.replace('/admin/configuration/students')}>
                                    Class {classById.get(classFilter)?.name ?? ''} ×
                                </button>}
                        </div>
                    </div>
                    <button type="button" className={styles.addButton} onClick={() => openDialog()}>
                        <AddIcon fontSize="small"/>
                        Add student
                    </button>
                </div>

                {loadError
                    ? <ErrorCard title="Cannot load students" message={loadError.message} onRetry={() => mutate()}/>
                    : !students || !classes
                        ? <MySpinner/>
                        : visible.length === 0
                            ? <div className={styles.emptyState}>
                                {students.length === 0 ? 'No students yet — add one to get started.' : 'No students match your filters.'}
                            </div>
                            : <div className={styles.list}>
                                <div className={styles.columns}>
                                    <span>Student</span><span>Facebook</span><span>Phone</span><span>Parent phone</span><span>Classes</span><span>Actions</span>
                                </div>
                                {visible.map(student => (
                                    <div className={styles.row} key={student.id}>
                                        <div className={styles.studentCell}>
                                            <div className={styles.studentAvatar} style={{background: avatarColor(student.name)}}>
                                                {initialsOf(student.name)}
                                            </div>
                                            <span className={styles.studentName}>{student.name}</span>
                                        </div>
                                        <span className={styles.cell}>
                                            {student.facebook
                                                ? <a className={styles.facebook} href={facebookHref(student.facebook)}
                                                     target="_blank" rel="noopener noreferrer">{facebookLabel(student.facebook)}</a>
                                                : <span className={styles.muted}>—</span>}
                                        </span>
                                        <span className={styles.cell}>{student.phone || <span className={styles.muted}>—</span>}</span>
                                        <span className={styles.cell}>{student.parentPhone || <span className={styles.muted}>—</span>}</span>
                                        <div className={styles.classChips}>
                                            {student.classIds.length === 0
                                                ? <span className={`${styles.classChip} ${styles.classChipMuted}`}>Unassigned</span>
                                                : student.classIds.map(id => (
                                                    <span key={id} className={styles.classChip}>{classById.get(id)?.name ?? 'Unknown'}</span>
                                                ))}
                                        </div>
                                        <div className={styles.actions}>
                                            <button type="button" className={styles.iconButton} aria-label={`Edit ${student.name}`}
                                                    onClick={() => openDialog(student)}>
                                                <EditOutlinedIcon sx={{fontSize: 16}}/>
                                            </button>
                                            <button type="button" className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                                                    aria-label={`Delete ${student.name}`} onClick={() => setDeleting(student)}>
                                                <DeleteOutlineIcon sx={{fontSize: 16}}/>
                                            </button>
                                        </div>
                                        <div className={styles.mobileMeta}>
                                            {student.phone && <a href={`tel:${student.phone.replace(/[^\d+]/g, '')}`}>Student: {student.phone}</a>}
                                            {student.parentPhone && <a href={`tel:${student.parentPhone.replace(/[^\d+]/g, '')}`}>Parent: {student.parentPhone}</a>}
                                            {student.facebook && <a href={facebookHref(student.facebook)} target="_blank" rel="noopener noreferrer">{facebookLabel(student.facebook)}</a>}
                                        </div>
                                    </div>
                                ))}
                            </div>}
            </div>

            <StudentDialog open={dialogOpen} classes={classes ?? []} editing={editing}
                           initialClassId={classFilter} saving={saving} error={saveError}
                           onSubmit={handleSave} onCancel={() => setDialogOpen(false)}/>
            <ConfirmDialog open={Boolean(deleting)} title="Delete student"
                           message={`Delete ${deleting?.name ?? ''}? This cannot be undone.`}
                           confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleting(undefined)}/>
            {toast && <MyToast key={toast.key} message={toast.message} severity={toast.severity}/>}
        </Admin>
    )
}

export default Students;
