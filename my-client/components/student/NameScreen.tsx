import type {JoinAssignee} from '../../modules/join/assignees';
import {exactAssignees, matchingAssignees} from '../../modules/join/assignees';
import {Button, Heading} from './StudentLayout';
import styles from '../../styles/Join.module.css';

export default function NameScreen({name, selectedId, roster, questionCount, required, onChange, onContinue}: {
    name: string; selectedId?: string; roster: JoinAssignee[]; questionCount: number; required: number;
    onChange: (name: string, id?: string) => void; onContinue: (student?: JoinAssignee) => void
}) {
    const exact = exactAssignees(name, roster);
    const selected = roster.find(student => student.id === selectedId) ?? (exact.length === 1 ? exact[0] : undefined);
    const suggestions = selected ? [] : matchingAssignees(name, roster);
    const joiningUnassigned = !!name.trim() && !selected && exact.length === 0;
    const canContinue = !!name.trim() && (!!selected || joiningUnassigned);
    return <form className={styles.content} onSubmit={event => {event.preventDefault(); if (canContinue) onContinue(selected)}}>
        <Heading eyebrow="Sẵn sàng luyện tập?" title="Họ và tên của em">Cùng ôn lại từ vựng đã học nhé!</Heading>
        <div className={styles.stats}><div><strong>{questionCount}</strong><span>Câu hỏi</span></div><div><strong>{required}<small> / {questionCount}</small></strong><span>Số câu đúng cần đạt</span></div></div>
        <div className={styles.field}><label htmlFor="studentName">Họ và tên</label><input id="studentName" className={styles.input} value={name} onChange={event => onChange(event.target.value)} placeholder="Nhập họ và tên…" autoComplete="name" required aria-describedby="name-help"/><p id="name-help" className={styles.hint}>Nhập họ và tên em dùng trong lớp.</p></div>
        {name.trim() && <section className={styles.panel} aria-label="Xác nhận thông tin học sinh" aria-live="polite">
            {selected ? <p className={styles.selected}>✓ Em sẽ tham gia với tên <strong>{selected.name}</strong>{selected.className && ` · ${selected.className}`}</p> : <>
                {suggestions.length > 0 && <h2>Em có thấy tên mình trong danh sách không?</h2>}
                <div className={styles.options}>{suggestions.map(student => <button type="button" key={student.id} onClick={() => onChange(student.name, student.id)}><strong>{student.name}</strong><span>{student.className || 'Học sinh được giao bài'} <span aria-hidden="true">→</span></span></button>)}</div>
                {joiningUnassigned && <p className={styles.warning}>Tên em chưa có trong danh sách được giao bài. Em vẫn có thể làm bài và kết quả sẽ được lưu theo tên em đã nhập.</p>}
            </>}
        </section>}
        <div className={styles.actions}><Button type="submit" disabled={!canContinue}>{joiningUnassigned ? 'Tiếp tục với tên đã nhập' : 'Tiếp tục'} <span aria-hidden="true">→</span></Button><p className={styles.hint}>Tiếp theo, em sẽ chia sẻ vị trí để bắt đầu làm bài.</p></div>
    </form>;
}
