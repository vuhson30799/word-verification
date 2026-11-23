import {useEffect, useRef, useState} from 'react';
import type {Question} from '../../pages/admin/examination';
import {translateKey} from '../../modules/utils/verification';
import {StatusIcon} from './StudentLayout';
import styles from '../../styles/Join.module.css';

export default function QuestionScreen({question, index, total, feedback, initialAnswer, deadline: savedDeadline, onAnswer, onNext}: {
    question: Question; index: number; total: number; feedback: boolean | null; onAnswer: (answer: string) => void; onNext: () => void
    initialAnswer?: string; deadline?: number;
}) {
    const [answer, setAnswer] = useState(initialAnswer ?? '');
    const duration = Math.max(1, question.timeout || 30);
    const [seconds, setSeconds] = useState(duration);
    const expire = useRef(() => onAnswer(''));
    const input = useRef<HTMLInputElement>(null);
    const next = useRef<HTMLButtonElement>(null);
    useEffect(() => {expire.current = () => onAnswer(answer)}, [onAnswer, answer]);
    useEffect(() => {
        if (feedback !== null) return;
        const deadline = savedDeadline ?? Date.now() + duration * 1000;
        const timer = setInterval(() => {
            const remaining = Math.max(0, (deadline - Date.now()) / 1000);
            setSeconds(remaining);
            if (remaining === 0) {clearInterval(timer); expire.current()}
        }, 200);
        return () => clearInterval(timer);
    }, [duration, feedback, savedDeadline]);
    useEffect(() => {if (feedback === null) input.current?.focus(); else next.current?.focus()}, [feedback]);
    const Prompt = feedback === null ? 'h1' : 'p';
    return <form className={styles.content} onSubmit={event => {event.preventDefault(); if (feedback === null) onAnswer(answer); else onNext()}}>
        <div className={styles.questionMeta}><span>Câu {index + 1} / {total}</span>{feedback !== null && <span>Đã chấm</span>}</div>
        <div className={styles.progress} role="progressbar" aria-label="Thời gian trả lời" aria-valuenow={Math.round(seconds / duration * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{width: `${seconds / duration * 100}%`}}/></div>
        <section className={`${styles.questionCard} ${feedback === true ? styles.correct : feedback === false ? styles.incorrect : ''}`} aria-live="polite">
            {feedback !== null && <><StatusIcon kind={feedback ? 'success' : 'error'}/><h1>{feedback ? 'Chính xác!' : 'Chưa đúng'}</h1><p className={styles.muted}>{feedback ? 'Tốt lắm! Tiếp tục nhé.' : seconds === 0 ? 'Hết giờ! Em hãy ghi nhớ từ này cho lần sau nhé.' : 'Em hãy ghi nhớ từ này cho lần sau nhé.'}</p></>}
            <Prompt className={styles.questionText}>{question.title}</Prompt>
            {feedback === true && <p className={styles.accepted}>{answer}</p>}
        </section>
        {feedback === null ? <div className={styles.field}><label htmlFor="currentAnswer">Câu trả lời của em</label><input ref={input} id="currentAnswer" className={styles.input} value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Nhập câu trả lời…" autoComplete="off" autoCapitalize="none" spellCheck={false}/></div>
            : feedback === false && <div className={styles.field}><h2 className={styles.eyebrow}>Đáp án được chấp nhận</h2><div className={styles.answers}>{question.keys.map((key, i) => <p key={i}>{translateKey(key)}</p>)}</div></div>}
        <div className={styles.actions}><button ref={next} className={styles.button} type="submit">{feedback === null ? 'Nộp câu trả lời' : index + 1 === total ? 'Xem kết quả' : 'Câu tiếp theo'} <span aria-hidden="true">→</span></button></div>
    </form>;
}
