import {Button, Heading, StatusIcon} from './StudentLayout';
import styles from '../../styles/Join.module.css';

export default function ResultScreen({score, total, required, interrupted, saving, saved, error, onRetrySave, onPlayAgain}: {
    score: number; total: number; required: number; interrupted: boolean; saving: boolean; saved: boolean; error: string;
    onRetrySave: () => void; onPlayAgain: () => void
}) {
    const passed = score >= required;
    return <section className={`${styles.content} ${styles.result}`}>
        <StatusIcon kind={passed && !interrupted ? 'success' : 'error'}/>
        <Heading eyebrow={interrupted ? 'Bài làm bị gián đoạn' : 'Kết quả của em'} title={interrupted ? 'Hãy làm lại nhé' : passed ? 'Em đã đạt yêu cầu!' : 'Bắt buộc làm lại'}>
            {interrupted ? 'Việc chuyển sang thẻ hoặc ứng dụng khác sẽ làm gián đoạn bài làm. Lần sau, em hãy ở lại trang này trong suốt thời gian làm bài.' : passed ? 'Làm tốt lắm! Em có thể nghỉ một chút rồi.' : `Em cần trả lời đúng ít nhất ${required} câu để đạt yêu cầu.`}
        </Heading>
        <p className={styles.score}>{score}<span> / {total}</span></p><p className={styles.muted}>{score} câu đúng · {total - score} câu cần ôn lại</p>
        <div className={styles.panel} role={error ? 'alert' : 'status'}><p>{interrupted ? 'Lần làm bài này chưa được nộp.' : saving ? 'Đang lưu kết quả…' : error || (saved ? '✓ Kết quả đã được lưu để giáo viên xem.' : 'Kết quả của em đang chờ gửi.')}</p></div>
        <div className={styles.actions}>{!interrupted && error && <Button onClick={onRetrySave} disabled={saving}>Thử lưu kết quả lại</Button>}<Button secondary={!!error} onClick={onPlayAgain}>Làm lại <span aria-hidden="true">↻</span></Button></div>
    </section>;
}
