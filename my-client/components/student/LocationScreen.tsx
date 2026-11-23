import {Button, Heading, StatusIcon} from './StudentLayout';
import styles from '../../styles/Join.module.css';

export type LocationStatus = 'idle' | 'pending' | 'received' | 'blocked' | 'unavailable';
const copy = {
    idle: ['Xác nhận vị trí', 'Em hãy chia sẻ vị trí hiện tại trước khi làm bài.', 'Cần chia sẻ vị trí', 'Nhấn nút bên dưới, rồi chọn Cho phép khi trình duyệt hỏi quyền truy cập vị trí.'],
    pending: ['Đang xác định vị trí…', 'Quá trình này có thể mất vài giây. Em hãy giữ trang này mở.', 'Đang chờ thiết bị phản hồi', 'Hãy bật dịch vụ định vị trên thiết bị. Nếu trình duyệt hỏi quyền truy cập, hãy chọn Cho phép.'],
    received: ['Sẵn sàng làm bài', 'Đã xác nhận vị trí của em.', 'Đã nhận vị trí', 'Em hãy chuẩn bị trả lời câu hỏi đầu tiên.'],
    blocked: ['Quyền truy cập vị trí đang bị chặn', 'Cho phép trang này truy cập vị trí để bắt đầu làm bài.', 'Cần cấp quyền truy cập', 'Mở phần cài đặt trang web trong trình duyệt, cho phép truy cập vị trí, rồi quay lại và thử lại.'],
    unavailable: ['Không thể xác định vị trí', 'Thiết bị có thể chưa xác định được vị trí hoặc yêu cầu đã hết thời gian chờ.', 'Chưa có vị trí', 'Bật dịch vụ định vị, kiểm tra kết nối mạng rồi thử lại.']
};

export default function LocationScreen({status, error, countdown, onStart, onBack}: {status: LocationStatus; error: string; countdown: number; onStart: () => void; onBack: () => void}) {
    const [title, description, label, hint] = copy[status];
    const busy = status === 'pending' || status === 'received';
    return <section className={styles.content} aria-busy={status === 'pending'}>
        <p className={styles.eyebrow}>Trước khi làm bài · Vị trí</p>
        <div className={styles.locationBody} aria-live="polite">
            <StatusIcon kind={status === 'received' ? 'success' : status === 'pending' ? 'waiting' : status === 'blocked' || status === 'unavailable' ? 'error' : 'location'}/>
            <Heading title={title}>{description}</Heading>
            <div className={styles.panel}><h2>{label}</h2><p className={styles.muted}>{error || hint}</p>{status === 'received' && <p className={styles.countdown}>Bắt đầu sau {countdown} giây…</p>}</div>
        </div>
        <div className={styles.actions}><Button onClick={onStart} disabled={busy}>{status === 'pending' ? 'Đang lấy vị trí…' : status === 'received' ? 'Đang bắt đầu làm bài…' : status === 'idle' ? 'Chia sẻ vị trí và bắt đầu →' : 'Thử chia sẻ vị trí lại'}</Button>
            {!busy ? <Button secondary onClick={onBack}>Quay lại bước nhập tên</Button> : <p className={styles.hint}>Bài làm của em chưa bắt đầu.</p>}
        </div>
    </section>;
}
