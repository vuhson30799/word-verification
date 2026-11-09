import Dialog from "@mui/material/Dialog";
import styles from "../styles/ConfirmDialog.module.css";

export interface ConfirmDialogProps {
    open: boolean
    title: string
    message: string
    confirmLabel: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({open, title, message, confirmLabel, onConfirm, onCancel}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onCancel}
                aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message"
                slotProps={{paper: {className: styles.paper}}}>
            <div className={styles.title} id="confirm-dialog-title">{title}</div>
            <div className={styles.message} id="confirm-dialog-message">{message}</div>
            <div className={styles.actions}>
                <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
                <button type="button" className={styles.confirmButton} onClick={onConfirm} autoFocus>
                    {confirmLabel}
                </button>
            </div>
        </Dialog>
    )
}
