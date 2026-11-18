import {useEffect, useRef, useState} from 'react';
import type {Question} from '../../pages/admin/examination';
import {translateKey} from '../../modules/utils/verification';
import {StatusIcon} from './StudentLayout';
import styles from '../../styles/Join.module.css';

export default function QuestionScreen({question, index, total, feedback, onAnswer, onNext}: {
    question: Question; index: number; total: number; feedback: boolean | null; onAnswer: (answer: string) => void; onNext: () => void
}) {
    const [answer, setAnswer] = useState('');
    const duration = Math.max(1, question.timeout || 30);
    const [seconds, setSeconds] = useState(duration);
    const expire = useRef(() => onAnswer(''));
    const input = useRef<HTMLInputElement>(null);
    const next = useRef<HTMLButtonElement>(null);
    useEffect(() => {expire.current = () => onAnswer(answer)}, [onAnswer, answer]);
    useEffect(() => {
        if (feedback !== null) return;
        const deadline = Date.now() + duration * 1000;
        const timer = setInterval(() => {
            const remaining = Math.max(0, (deadline - Date.now()) / 1000);
            setSeconds(remaining);
            if (remaining === 0) {clearInterval(timer); expire.current()}
        }, 200);
        return () => clearInterval(timer);
    }, [duration, feedback]);
    useEffect(() => {if (feedback === null) input.current?.focus(); else next.current?.focus()}, [feedback]);
    const Prompt = feedback === null ? 'h1' : 'p';
    return <form className={styles.content} onSubmit={event => {event.preventDefault(); if (feedback === null) onAnswer(answer); else onNext()}}>
        <div className={styles.questionMeta}><span>Question {index + 1} of {total}</span>{feedback !== null && <span>Answer reviewed</span>}</div>
        <div className={styles.progress} role="progressbar" aria-label="Question timer" aria-valuenow={Math.round(seconds / duration * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{width: `${seconds / duration * 100}%`}}/></div>
        <section className={`${styles.questionCard} ${feedback === true ? styles.correct : feedback === false ? styles.incorrect : ''}`} aria-live="polite">
            {feedback !== null && <><StatusIcon kind={feedback ? 'success' : 'error'}/><h1>{feedback ? 'Correct!' : 'Not quite'}</h1><p className={styles.muted}>{feedback ? 'Nicely done. Keep it going.' : seconds === 0 ? 'Time’s up. A new word to remember for next time.' : 'A new word to remember for next time.'}</p></>}
            <Prompt className={styles.questionText}>{question.title}</Prompt>
            {feedback === true && <p className={styles.accepted}>{answer}</p>}
        </section>
        {feedback === null ? <div className={styles.field}><label htmlFor="currentAnswer">Your answer</label><input ref={input} id="currentAnswer" className={styles.input} value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Type your answer…" autoComplete="off" autoCapitalize="none" spellCheck={false}/></div>
            : feedback === false && <div className={styles.field}><h2 className={styles.eyebrow}>Accepted answers</h2><div className={styles.answers}>{question.keys.map((key, i) => <p key={i}>{translateKey(key)}</p>)}</div></div>}
        <div className={styles.actions}><button ref={next} className={styles.button} type="submit">{feedback === null ? 'Submit' : index + 1 === total ? 'See your result' : 'Next question'} <span aria-hidden="true">→</span></button></div>
    </form>;
}
