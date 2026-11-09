import React, {useMemo, useState} from "react";
import Link from "next/link";
import useSWR from "swr";
import {orderBy} from "lodash";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {Admin} from "../../../layout/Admin";
import ConfigurationTabs from "../../../components/ConfigurationTabs";
import ClassDialog from "../../../components/ClassDialog";
import ConfirmDialog from "../../../components/ConfirmDialog";
import ErrorCard from "../../../components/ErrorCard";
import MyToast from "../../../components/MyToast";
import {MySpinner} from "../../../components/MySpinner";
import {fetcher, fetcherWithForm} from "../../../modules/configuration/Configuration";
import {
    ClassData,
    ClassInput,
    currentAcademicYear,
    formatAcademicYear,
    nextAcademicYear
} from "../../../modules/configuration/classes";
import styles from "../../../styles/Configuration.module.css";

const AVATAR_COLORS = ['#D9D3C4', '#E7C9DA', '#C7D6DC', '#E0784F', '#5B5FEF']
const CLASSES_KEY = ['/api/classes', 'get']

function Classes() {
    const {data: classes, error, mutate} = useSWR<ClassData[]>(CLASSES_KEY, fetcher)
    const [selectedYear, setSelectedYear] = useState(currentAcademicYear())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ClassData>()
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string>()
    const [menu, setMenu] = useState<{anchor: HTMLElement, target: ClassData}>()
    const [deleting, setDeleting] = useState<ClassData>()
    const [toast, setToast] = useState<{message: string, severity: 'success' | 'error', key: number}>()

    const years = useMemo(() => {
        const current = currentAcademicYear()
        const all = new Set([current, nextAcademicYear(current), selectedYear, ...(classes ?? []).map(c => c.academicYear)])
        return Array.from(all).sort().reverse()
    }, [classes, selectedYear])

    const visible = useMemo(() => orderBy(
        (classes ?? []).filter(c => c.academicYear === selectedYear),
        [c => c.grade, c => c.name.toLowerCase()]), [classes, selectedYear])

    const notify = (message: string, severity: 'success' | 'error') => setToast({message, severity, key: Date.now()})

    const openDialog = (target?: ClassData) => {
        setEditing(target)
        setSaveError(undefined)
        setDialogOpen(true)
    }

    const handleSave = async (input: ClassInput) => {
        setSaving(true)
        setSaveError(undefined)
        try {
            await fetcherWithForm(editing
                ? [`/api/classes/${editing.id}`, 'PUT', input]
                : ['/api/classes', 'POST', input])
            await mutate()
            setDialogOpen(false)
            notify(editing ? 'Class updated.' : 'Class added.', 'success')
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Cannot save this class.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        const target = deleting
        setDeleting(undefined)
        if (!target) return
        try {
            await fetcherWithForm([`/api/classes/${target.id}`, 'DELETE', undefined])
            await mutate()
            notify(`Class ${target.name} deleted.`, 'success')
        } catch (e) {
            notify(e instanceof Error ? e.message : 'Cannot delete this class.', 'error')
        }
    }

    return (
        <Admin>
            <div className={styles.page}>
                <div>
                    <h1 className={styles.title}>Configuration</h1>
                    <div className={styles.toolbar}>
                        <ConfigurationTabs/>
                        <label className={styles.yearPicker}>
                            <CalendarTodayOutlinedIcon sx={{fontSize: 16}}/>
                            <select className={styles.yearSelect} value={selectedYear} aria-label="Academic year"
                                    onChange={event => setSelectedYear(event.target.value)}>
                                {years.map(year => <option key={year} value={year}>Academic year {formatAcademicYear(year)}</option>)}
                            </select>
                            <KeyboardArrowDownIcon sx={{fontSize: 16}}/>
                        </label>
                    </div>
                </div>

                {error
                    ? <ErrorCard title="Cannot load classes" message={error.message} onRetry={() => mutate()}/>
                    : !classes
                        ? <MySpinner/>
                        : <div className={styles.grid}>
                            {visible.map(item => (
                                <div className={styles.card} key={item.id}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardName}>{item.name}</span>
                                        <span className={styles.badge}>Grade {item.grade}</span>
                                    </div>
                                    <div className={styles.students}>
                                        {item.studentCount > 0 &&
                                            <div className={styles.avatars}>
                                                {AVATAR_COLORS.slice(0, Math.min(3, item.studentCount)).map((color, index) =>
                                                    <div key={index} className={styles.avatar} style={{background: color}}/>)}
                                            </div>}
                                        <span>{item.studentCount} student{item.studentCount === 1 ? '' : 's'}</span>
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <Link className={styles.manageLink}
                                              href={{pathname: '/admin/configuration/students', query: {classId: item.id}}}>
                                            Manage roster →
                                        </Link>
                                        <button type="button" className={styles.menuButton} aria-label={`Actions for ${item.name}`}
                                                onClick={event => setMenu({anchor: event.currentTarget, target: item})}>
                                            <MoreHorizIcon fontSize="small"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" className={styles.addCard} onClick={() => openDialog()}>
                                <AddIcon/>
                                Add class
                            </button>
                        </div>}
            </div>

            <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(undefined)}>
                <MenuItem onClick={() => {
                    openDialog(menu?.target)
                    setMenu(undefined)
                }}>Edit</MenuItem>
                <MenuItem onClick={() => {
                    setDeleting(menu?.target)
                    setMenu(undefined)
                }}>Delete</MenuItem>
            </Menu>

            <ClassDialog open={dialogOpen} academicYear={selectedYear} editing={editing} saving={saving}
                         error={saveError} onSubmit={handleSave} onCancel={() => setDialogOpen(false)}/>
            <ConfirmDialog open={Boolean(deleting)} title="Delete class"
                           message={`Delete class ${deleting?.name ?? ''}? This cannot be undone.`}
                           confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleting(undefined)}/>
            {toast && <MyToast key={toast.key} message={toast.message} severity={toast.severity}/>}
        </Admin>
    )
}

export default Classes;
