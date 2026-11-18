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
    return <form className={styles.content} onSubmit={event => {event.preventDefault(); if (name.trim() && (!roster.length || selected)) onContinue(selected)}}>
        <Heading eyebrow="Ready to practise?" title="Who are you?">Let’s put your words into practice.</Heading>
        <div className={styles.stats}><div><strong>{questionCount}</strong><span>Questions</span></div><div><strong>{required}<small> / {questionCount}</small></strong><span>Correct to pass</span></div></div>
        <div className={styles.field}><label htmlFor="studentName">Your full name</label><input id="studentName" className={styles.input} value={name} onChange={event => onChange(event.target.value)} placeholder="Your name is…" autoComplete="name" required aria-describedby="name-help"/><p id="name-help" className={styles.hint}>Use the name your teacher knows you by.</p></div>
        {name.trim() && roster.length > 0 && <section className={styles.panel} aria-label="Confirm your student record" aria-live="polite">
            {selected ? <p className={styles.selected}>✓ Ready to join as <strong>{selected.name}</strong>{selected.className && ` · ${selected.className}`}</p> : <>
                <h2>Which student are you?</h2><p className={styles.muted}>Choose your assigned name so your results reach your teacher.</p>
                <div className={styles.options}>{suggestions.map(student => <button type="button" key={student.id} onClick={() => onChange(student.name, student.id)}><strong>{student.name}</strong><span>{student.className || 'Assigned student'} <span aria-hidden="true">→</span></span></button>)}</div>
                {!suggestions.length && <p className={styles.hint}>No matching assigned students. Try your full name or ask your teacher.</p>}
            </>}
        </section>}
        <div className={styles.actions}><Button type="submit" disabled={!name.trim() || (roster.length > 0 && !selected)}>Continue <span aria-hidden="true">→</span></Button><p className={styles.hint}>Next, share your location to start.</p></div>
    </form>;
}
