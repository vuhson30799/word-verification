import {Button, Heading, StatusIcon} from './StudentLayout';
import styles from '../../styles/Join.module.css';

export default function ResultScreen({score, total, required, interrupted, saving, error, onRetrySave, onPlayAgain}: {
    score: number; total: number; required: number; interrupted: boolean; saving: boolean; error: string;
    onRetrySave: () => void; onPlayAgain: () => void
}) {
    const passed = score >= required;
    return <section className={`${styles.content} ${styles.result}`}>
        <StatusIcon kind={passed && !interrupted ? 'success' : 'error'}/>
        <Heading eyebrow={interrupted ? 'Attempt interrupted' : 'Your result'} title={interrupted ? 'Let’s start over.' : passed ? 'Look at you go!' : 'Keep practising.'}>
            {interrupted ? 'Switching tabs or apps interrupts your test. Stay on this page during your next attempt.' : passed ? 'You passed! Your brain needs a holiday now.' : `Get at least ${required} answers right to pass. You’ve got this.`}
        </Heading>
        <p className={styles.score}>{score}<span> / {total}</span></p><p className={styles.muted}>{score} correct · {total - score} to keep practising</p>
        <div className={styles.panel} role={error ? 'alert' : 'status'}><p>{interrupted ? 'This attempt has not been submitted.' : saving ? 'Saving your results…' : error || '✓ Your results have been saved for your teacher.'}</p></div>
        <div className={styles.actions}>{error && <Button onClick={onRetrySave}>Retry saving results</Button>}<Button secondary={!!error} onClick={onPlayAgain} disabled={!interrupted && (saving || !!error)}>Play again <span aria-hidden="true">↻</span></Button></div>
    </section>;
}
