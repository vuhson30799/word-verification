import Head from 'next/head';
import type {ButtonHTMLAttributes, ReactNode} from 'react';
import styles from '../../styles/Join.module.css';

export function StudentLayout({children, title, progress}: {children: ReactNode; title?: string; progress?: string}) {
    return <main className={styles.page}>
        <Head><title>{title ? `${title} · Word Verification` : 'Word Verification'}</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
        <div className={styles.shell}>
            <header className={styles.header}><span className={styles.brand}><span className={styles.logo}>w.</span>Word Verification</span>{progress && <span>{progress}</span>}</header>
            {children}
        </div>
    </main>
}

export function Button({secondary, className = '', ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {secondary?: boolean}) {
    return <button type="button" className={`${styles.button} ${secondary ? styles.secondary : ''} ${className}`} {...props}/>;
}

export function Heading({eyebrow, title, children}: {eyebrow?: string; title: string; children?: ReactNode}) {
    return <div className={styles.heading}>{eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}<h1>{title}</h1>{children && <p className={styles.muted}>{children}</p>}</div>;
}

export function StatusIcon({kind}: {kind: 'location' | 'waiting' | 'success' | 'error'}) {
    return <span aria-hidden="true" className={`${styles.icon} ${kind === 'waiting' ? styles.spinner : ''} ${kind === 'success' ? styles.success : kind === 'error' ? styles.error : ''}`}>
        {kind === 'location' ? <svg viewBox="0 0 24 24" fill="none"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> : kind === 'waiting' ? <span/> : kind === 'success' ? '✓' : '!'}
    </span>;
}
