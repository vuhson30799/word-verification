import {FormEvent, useState} from "react";
import Dialog from "@mui/material/Dialog";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import styles from "../styles/ConfigurationDialog.module.css";
import {ClassData} from "../modules/configuration/classes";
import {getInvalidStudentMessage, StudentData, StudentInput} from "../modules/configuration/students";

export interface StudentDialogProps {
    open: boolean
    classes: ClassData[]
    editing?: StudentData
    initialClassId?: string
    saving: boolean
    error?: string
    onSubmit: (input: StudentInput) => void
    onCancel: () => void
}

export default function StudentDialog(props: StudentDialogProps) {
    return (
        <Dialog open={props.open} onClose={props.saving ? undefined : props.onCancel} aria-labelledby="student-dialog-title"
                slotProps={{paper: {className: styles.paper}}}>
            <StudentForm {...props}/>
        </Dialog>
    )
}

function StudentForm({classes, editing, initialClassId, saving, error, onSubmit, onCancel}: StudentDialogProps) {
    const [name, setName] = useState(editing?.name ?? '')
    const [facebook, setFacebook] = useState(editing?.facebook ?? '')
    const [phone, setPhone] = useState(editing?.phone ?? '')
    const [parentPhone, setParentPhone] = useState(editing?.parentPhone ?? '')
    const [classIds, setClassIds] = useState<string[]>(editing?.classIds ?? (initialClassId ? [initialClassId] : []))
    const [classMenu, setClassMenu] = useState<HTMLElement | null>(null)
    const [validation, setValidation] = useState<string>()

    const classById = (id: string) => classes.find(c => c.id === id)
    const available = classes.filter(c => !classIds.includes(c.id))

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        const input = {name, facebook, phone, parentPhone, classIds}
        const invalid = getInvalidStudentMessage(input)
        if (invalid) return setValidation(invalid)
        onSubmit(input)
    }

    const message = validation ?? error

    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.title} id="student-dialog-title">{editing ? 'Edit student' : 'Add student'}</div>
            <div className={styles.subtitle}>Students can be added without a class and assigned later.</div>

            <label className={styles.field}>
                <span className={styles.label}>Full name</span>
                <input className={styles.input} value={name} placeholder="e.g. Nguyễn Văn An" autoFocus
                       onChange={event => setName(event.target.value)}/>
            </label>
            <label className={styles.field}>
                <span className={styles.label}>Facebook link</span>
                <input className={styles.input} value={facebook} placeholder="facebook.com/username"
                       onChange={event => setFacebook(event.target.value)}/>
            </label>
            <div className={styles.row}>
                <label className={styles.field}>
                    <span className={styles.label}>Phone number</span>
                    <input className={styles.input} value={phone} placeholder="090 xxx xxxx" inputMode="tel"
                           onChange={event => setPhone(event.target.value)}/>
                </label>
                <label className={styles.field}>
                    <span className={styles.label}>Parent&apos;s phone</span>
                    <input className={styles.input} value={parentPhone} placeholder="090 xxx xxxx" inputMode="tel"
                           onChange={event => setParentPhone(event.target.value)}/>
                </label>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Assign to class (optional)</span>
                <div className={styles.chipBox}>
                    {classIds.map(id => (
                        <span className={styles.chip} key={id}>
                            {classById(id)?.name ?? 'Unknown class'}
                            <button type="button" className={styles.chipRemove} aria-label="Remove class"
                                    onClick={() => setClassIds(classIds.filter(c => c !== id))}>×</button>
                        </span>
                    ))}
                    <button type="button" className={styles.addChip} disabled={available.length === 0}
                            onClick={event => setClassMenu(event.currentTarget)}>
                        + Add class
                    </button>
                </div>
                <Menu anchorEl={classMenu} open={Boolean(classMenu)} onClose={() => setClassMenu(null)}>
                    {available.map(c => (
                        <MenuItem key={c.id} onClick={() => {
                            setClassIds([...classIds, c.id])
                            setClassMenu(null)
                        }}>{c.name} · {c.academicYear.replace('-', ' – ')}</MenuItem>
                    ))}
                </Menu>
            </div>

            {message && <div className={styles.error} role="alert">{message}</div>}

            <div className={styles.actions}>
                <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={saving}>Cancel</button>
                <button type="submit" className={styles.submitButton} disabled={saving}>
                    {saving ? 'Saving…' : 'Save student'}
                </button>
            </div>
        </form>
    )
}
