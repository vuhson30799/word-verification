import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import styles from "../styles/ErrorCard.module.css";

export interface ErrorCardProps {
    title: string
    message: string
    onRetry?: () => void
}

export default function ErrorCard({title, message, onRetry}: ErrorCardProps) {
    return (
        <div className={styles.card} role="alert">
            <div className={styles.icon}><ErrorOutlinedIcon/></div>
            <div className={styles.title}>{title}</div>
            <div className={styles.message}>{message}</div>
            {onRetry && <button type="button" className={styles.retryButton} onClick={onRetry}>Try again</button>}
        </div>
    )
}
