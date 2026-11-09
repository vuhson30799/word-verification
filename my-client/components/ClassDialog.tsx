import {FormEvent, useState} from "react";
import Dialog from "@mui/material/Dialog";
import styles from "../styles/ConfigurationDialog.module.css";
import {ClassData, ClassInput, formatAcademicYear, getInvalidClassMessage} from "../modules/configuration/classes";

export interface ClassDialogProps {
    open: boolean
    academicYear: string
    editing?: ClassData
    saving: boolean
    error?: string
    onSubmit: (input: ClassInput) => void
    onCancel: () => void
}

export default function ClassDialog(props: ClassDialogProps) {
    return (
        <Dialog open={props.open} onClose={props.saving ? undefined : props.onCancel} aria-labelledby="class-dialog-title"
                slotProps={{paper: {className: styles.paper}}}>
            <ClassForm {...props}/>
        </Dialog>
    )
}

function ClassForm({academicYear, editing, saving, error, onSubmit, onCancel}: ClassDialogProps) {
    const [name, setName] = useState(editing?.name ?? '')
    const [grade, setGrade] = useState(editing ? String(editing.grade) : '')
    const [validation, setValidation] = useState<string>()

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        const input = {name: name.trim(), grade: Number(grade), academicYear: editing?.academicYear ?? academicYear}
        const invalid = getInvalidClassMessage(input)
        if (invalid) return setValidation(invalid)
        onSubmit(input)
    }

    const message = validation ?? error

    return (
            <form onSubmit={handleSubmit}>
                <div className={styles.title} id="class-dialog-title">{editing ? 'Edit class' : 'Add class'}</div>
                <div className={styles.subtitle}>Academic year {formatAcademicYear(editing?.academicYear ?? academicYear)}</div>

                <label className={styles.field}>
                    <span className={styles.label}>Class name</span>
                    <input className={styles.input} value={name} placeholder="e.g. 10A1" autoFocus
                           onChange={event => setName(event.target.value)}/>
                </label>
                <label className={styles.field}>
                    <span className={styles.label}>Grade</span>
                    <input className={styles.input} type="number" min={1} max={12} value={grade} placeholder="e.g. 10"
                           onChange={event => setGrade(event.target.value)}/>
                </label>

                {message && <div className={styles.error} role="alert">{message}</div>}

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="submit" className={styles.submitButton} disabled={saving}>
                        {saving ? 'Saving…' : editing ? 'Save changes' : 'Add class'}
                    </button>
                </div>
            </form>
    )
}
