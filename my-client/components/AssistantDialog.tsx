import {FormEvent, useState} from "react";
import Dialog from "@mui/material/Dialog";
import styles from "../styles/ConfigurationDialog.module.css";
import {
    AssistantData,
    AssistantInput,
    getInvalidAssistantMessage,
    getInvalidPasswordMessage
} from "../modules/configuration/assistants";

export interface AssistantDialogProps {
    open: boolean
    /** When set, the dialog changes this assistant's password; otherwise it creates a new assistant. */
    target?: AssistantData
    saving: boolean
    error?: string
    onCreate: (input: AssistantInput) => void
    onChangePassword: (password: string) => void
    onCancel: () => void
}

export default function AssistantDialog(props: AssistantDialogProps) {
    return (
        <Dialog open={props.open} onClose={props.saving ? undefined : props.onCancel} aria-labelledby="assistant-dialog-title"
                slotProps={{paper: {className: styles.paper}}}>
            {props.target ? <PasswordForm {...props} target={props.target}/> : <CreateForm {...props}/>}
        </Dialog>
    )
}

function Actions({saving, label, onCancel}: {saving: boolean, label: string, onCancel: () => void}) {
    return (
        <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={saving}>Cancel</button>
            <button type="submit" className={styles.submitButton} disabled={saving}>{saving ? 'Saving…' : label}</button>
        </div>
    )
}

function CreateForm({saving, error, onCreate, onCancel}: AssistantDialogProps) {
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [validation, setValidation] = useState<string>()

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        const input = {name: name.trim(), username: username.trim(), password}
        const invalid = getInvalidAssistantMessage(input)
        if (invalid) return setValidation(invalid)
        onCreate(input)
    }
    const message = validation ?? error

    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.title} id="assistant-dialog-title">Add assistant</div>
            <div className={styles.subtitle}>Assistants can manage exams, homework, classes, and students.</div>
            <label className={styles.field}>
                <span className={styles.label}>Full name</span>
                <input className={styles.input} value={name} placeholder="e.g. Mai Thảo" autoFocus
                       onChange={event => setName(event.target.value)}/>
            </label>
            <label className={styles.field}>
                <span className={styles.label}>Username</span>
                <input className={styles.input} value={username} placeholder="e.g. mai.thao"
                       autoComplete="off" autoCapitalize="none" onChange={event => setUsername(event.target.value)}/>
            </label>
            <label className={styles.field}>
                <span className={styles.label}>Password</span>
                <input className={styles.input} type="password" value={password} autoComplete="new-password"
                       onChange={event => setPassword(event.target.value)}/>
            </label>
            {message && <div className={styles.error} role="alert">{message}</div>}
            <Actions saving={saving} label="Add assistant" onCancel={onCancel}/>
        </form>
    )
}

function PasswordForm({target, saving, error, onChangePassword, onCancel}: AssistantDialogProps & {target: AssistantData}) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [validation, setValidation] = useState<string>()

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        const invalid = getInvalidPasswordMessage(password) ?? (password !== confirm ? 'Passwords do not match' : undefined)
        if (invalid) return setValidation(invalid)
        onChangePassword(password)
    }
    const message = validation ?? error

    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.title} id="assistant-dialog-title">Change password</div>
            <div className={styles.subtitle}>{target.name} · {target.username}</div>
            <label className={styles.field}>
                <span className={styles.label}>New password</span>
                <input className={styles.input} type="password" value={password} autoComplete="new-password" autoFocus
                       onChange={event => setPassword(event.target.value)}/>
            </label>
            <label className={styles.field}>
                <span className={styles.label}>Confirm new password</span>
                <input className={styles.input} type="password" value={confirm} autoComplete="new-password"
                       onChange={event => setConfirm(event.target.value)}/>
            </label>
            <div className={styles.hint}>The assistant will need to sign in with the new password next time.</div>
            {message && <div className={styles.error} role="alert">{message}</div>}
            <Actions saving={saving} label="Update password" onCancel={onCancel}/>
        </form>
    )
}
