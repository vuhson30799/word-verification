import {useState, type ChangeEvent, type Dispatch, type FormEvent} from "react";
import MyFileUpload from "./MyFileUpload";
import Dialog from "@mui/material/Dialog";
import {readSheet} from "read-excel-file/browser";
import type {ClassData} from "../modules/configuration/classes";
import {fetcherWithForm} from "../modules/configuration/Configuration";
import {readStudentImportRows, type StudentImportRow} from "../modules/configuration/studentImport";
import styles from "../styles/ConfigurationDialog.module.css";

interface Props {
    classes: ClassData[]
    initialClassId?: string
    onCancel: () => void
    onImported: Dispatch<{imported: number, skipped: number}>
}

export default function StudentImportDialog({classes, initialClassId, onCancel, onImported}: Props) {
    const [file, setFile] = useState<File>()
    const [rows, setRows] = useState<StudentImportRow[]>([])
    const [assignments, setAssignments] = useState<Record<string, string>>({})
    const [reading, setReading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string>()
    const busy = reading || saving
    const groups = new Map<string, {grade: number, count: number}>()
    for (const {choice, grade} of rows) {
        const count = groups.get(choice)?.count ?? 0
        groups.set(choice, {grade, count: count + 1})
    }

    async function selectFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (busy || !file) return
        setFile(file)
        setRows([])
        setAssignments({})
        setError(undefined)
        if (!/\.xlsx$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
            setError('Choose an .xlsx workbook up to 5 MB.')
            return
        }
        setReading(true)
        try {
            let sheet
            try {
                sheet = await readSheet(file)
            } catch {
                throw new Error('Cannot read this workbook. Choose an Excel file using the student import template.')
            }
            const parsed = readStudentImportRows(sheet)
            const first = parsed[0]
            if (parsed.every(row => row.choice === first.choice) && classes.some(c => c.id === initialClassId && c.grade === first.grade)) {
                setAssignments({[first.choice]: initialClassId!})
            }
            setRows(parsed)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Cannot read this workbook.')
        } finally {
            setReading(false)
        }
    }

    async function submit(event: FormEvent) {
        event.preventDefault()
        if (busy || !ready) return
        setSaving(true)
        setError(undefined)
        try {
            const result = await fetcherWithForm(['/api/students/import', 'POST', rows.map(({student, choice}) => ({
                ...student,
                classIds: [assignments[choice]]
            }))])
            onImported(result)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Cannot import students.')
        } finally {
            setSaving(false)
        }
    }

    const ready = rows.length > 0 && [...groups].every(([choice, {grade}]) =>
        classes.some(c => c.id === assignments[choice] && c.grade === grade))

    return (
        <Dialog open onClose={busy ? undefined : onCancel} aria-labelledby="import-students-title"
                fullWidth maxWidth="sm" slotProps={{paper: {className: `${styles.paper} ${styles.importPaper}`}}}>
            <form className={styles.importForm} onSubmit={submit}>
                <div className={styles.title} id="import-students-title">Import students</div>
                <p className={styles.subtitle}>Upload the student import workbook and match each spreadsheet choice to a class.</p>
                <div className={styles.importContent}>
                    <MyFileUpload file={file} handleFileChange={selectFile} accept=".xlsx"
                                  hint=".xlsx up to 5 MB" invalid={Boolean(error && !rows.length)} disabled={busy}/>
                    {reading && <p role="status">Reading workbook…</p>}
                    {rows.length > 0 && <p role="status">{rows.length} student rows ready to assign.</p>}
                    {[...groups].map(([choice, {grade, count}]) => {
                        const available = classes.filter(c => c.grade === grade)
                        return (
                            <label className={styles.field} key={choice}>
                                <span className={styles.label}>{choice} ({count})</span>
                                <select className={styles.input} value={assignments[choice] ?? ''} disabled={saving || !available.length}
                                        onChange={event => setAssignments({...assignments, [choice]: event.target.value})}>
                                    <option value="">{available.length ? 'Select a class' : `No Grade ${grade} classes available`}</option>
                                    {available.map(c => <option value={c.id} key={c.id}>{c.name} · {c.academicYear}</option>)}
                                </select>
                            </label>
                        )
                    })}
                    {error && <div className={styles.error} role="alert">{error}</div>}
                </div>
                <div className={styles.actions}>
                    <button type="button" className={styles.cancelButton} disabled={busy} onClick={onCancel}>Cancel</button>
                    <button type="submit" className={styles.submitButton} disabled={busy || !ready}>
                        {saving ? 'Importing…' : 'Import students'}
                    </button>
                </div>
            </form>
        </Dialog>
    )
}
