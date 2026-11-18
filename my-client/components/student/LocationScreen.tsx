import {Button, Heading, StatusIcon} from './StudentLayout';
import styles from '../../styles/Join.module.css';

export type LocationStatus = 'idle' | 'pending' | 'received' | 'blocked' | 'unavailable';
const copy = {
    idle: ['One quick location check.', 'Share your current location before starting the test.', 'Location required', 'Tap below, then choose Allow when your browser asks for permission.'],
    pending: ['Finding your location…', 'This may take a few seconds. Keep this page open.', 'Waiting for your device', 'Make sure location services are enabled on your device. If a permission prompt appears, choose Allow.'],
    received: ['You’re ready to go.', 'Your location has been captured successfully.', 'Location received', 'Get ready for your first question.'],
    blocked: ['Location access is blocked.', 'Allow location for this site to start your test.', 'Permission needed', 'Open your browser’s site settings, allow location access, then return here and retry.'],
    unavailable: ['We couldn’t get your location.', 'Your device may be unable to find a location, or the request may have timed out.', 'Location unavailable', 'Enable device location services, check your connection, then try again.']
};

export default function LocationScreen({status, error, countdown, onStart, onBack}: {status: LocationStatus; error: string; countdown: number; onStart: () => void; onBack: () => void}) {
    const [title, description, label, hint] = copy[status];
    const busy = status === 'pending' || status === 'received';
    return <section className={styles.content} aria-busy={status === 'pending'}>
        <p className={styles.eyebrow}>Before you start · Location</p>
        <div className={styles.locationBody} aria-live="polite">
            <StatusIcon kind={status === 'received' ? 'success' : status === 'pending' ? 'waiting' : status === 'blocked' || status === 'unavailable' ? 'error' : 'location'}/>
            <Heading title={title}>{description}</Heading>
            <div className={styles.panel}><h2>{label}</h2><p className={styles.muted}>{error || hint}</p>{status === 'received' && <p className={styles.countdown}>Starting in {countdown}…</p>}</div>
        </div>
        <div className={styles.actions}><Button onClick={onStart} disabled={busy}>{status === 'pending' ? 'Getting location…' : status === 'received' ? 'Starting your test…' : status === 'idle' ? 'Share location & start test →' : 'Retry location & start test'}</Button>
            {!busy ? <Button secondary onClick={onBack}>Back to your name</Button> : <p className={styles.hint}>Your test hasn’t started yet.</p>}
        </div>
    </section>;
}
