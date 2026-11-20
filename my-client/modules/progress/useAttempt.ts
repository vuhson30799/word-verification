import {useCallback, useEffect, useRef, useState} from 'react';
import {acknowledgeAttempt, allAttempts, persistAttempt} from './storage';
import {listenForRefresh, SaveError, submitResult} from './client';
import type {LocalAttempt} from './types';

export function useAttempt(examId?: string, homeworkId?: string) {
    const latest = useRef<LocalAttempt | undefined>(undefined);
    const [local, setLocal] = useState<LocalAttempt>();
    const [recoverable, setRecoverable] = useState<LocalAttempt>();
    const [storageError, setStorageError] = useState('');
    const [syncError, setSyncError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [queueError, setQueueError] = useState('');
    const memoryPending = useRef(new Map<string, LocalAttempt>());
    const release = useRef<(() => void) | undefined>(undefined);
    const wake = useRef<() => void>(() => {});
    const write = useCallback(async (value: LocalAttempt) => {
        latest.current = value;
        setLocal(value);
        if (value.pending) {memoryPending.current.set(value.result.attemptId, value); setPendingCount(memoryPending.current.size)}
        try {
            const stored = await persistAttempt(value);
            if (stored.saved && latest.current?.result.attemptId === stored.result.attemptId) {
                latest.current = stored;
                setLocal(stored);
                memoryPending.current.delete(stored.result.attemptId);
            }
        }
        catch {setStorageError('Local recovery is unavailable. Keep this page open until your results are saved.')}
        if (value.pending) wake.current();
    }, []);

    const claim = useCallback(async (value: LocalAttempt) => {
        release.current?.();
        // A lifetime lock prevents two tabs from continuing the same attempt.
        if (!navigator.locks) throw new Error('This browser cannot safely recover attempts across tabs. Please use a current browser.');
        await new Promise<void>((resolve, reject) => {
            void navigator.locks.request(`wv-attempt:${value.result.attemptId}`, {ifAvailable: true}, async lock => {
                if (!lock) {reject(new Error('This attempt is already open in another tab. Close that tab first.')); return}
                await new Promise<void>(unlock => {release.current = unlock; resolve()});
            }).catch(reject);
        });
        setSaveError('');
        setSyncError('');
        setRecoverable(undefined);
        await write(value);
    }, [write]);

    useEffect(() => {
        let cancelled = false;
        if (!examId || !homeworkId) return;
        void allAttempts().then(values => {
            const candidate = values.filter(a => a.active !== false && a.result.examId === examId && a.result.homeworkId === homeworkId)
                .sort((a, b) => Date.parse(b.result.beginningAt!) - Date.parse(a.result.beginningAt!))[0];
            if (!cancelled) setRecoverable(candidate);
        }).catch(() => {if (!cancelled) setStorageError('Local recovery is unavailable. Keep this page open until your results are saved.')});
        return () => {
            cancelled = true;
            release.current?.();
            release.current = undefined;
            latest.current = undefined;
            setLocal(undefined);
        };
    }, [examId, homeworkId]);

    useEffect(() => {
        let running = false, cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const failures = new Map<string, number>();
        async function flush() {
            if (cancelled || running || !navigator.onLine) return;
            running = true;
            clearTimeout(timer);
            let retryDelay: number | undefined;
            try {
                let records: LocalAttempt[] = [];
                try {records = await allAttempts()} catch { /* In-memory submissions still report that recovery is unavailable. */ }
                for (const item of records) if (item.pending && !memoryPending.current.has(item.result.attemptId)) memoryPending.current.set(item.result.attemptId, item);
                if (!cancelled) setPendingCount(memoryPending.current.size);
                for (const [id, item] of memoryPending.current) {
                    if (cancelled) break;
                    if (!item.pending || item.permanentError || (failures.get(id) ?? 0) >= 6) continue;
                    const current = latest.current?.result.attemptId === id;
                    if (current) {setSaving(true); setSaveError('')}
                    try {
                        await submitResult(item);
                        try {await acknowledgeAttempt(id)} catch {setStorageError('Your result was saved, but local recovery storage is unavailable.')}
                        memoryPending.current.delete(id);
                        if (!cancelled) {setPendingCount(memoryPending.current.size); if (!memoryPending.current.size) setQueueError('')}
                        if (latest.current?.result.attemptId === id) {
                            const saved = {...latest.current, saved: true, pending: false, permanentError: undefined};
                            latest.current = saved;
                            if (!cancelled) {setLocal(saved); setSaveError('')}
                        }
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Your results could not be saved.';
                        if (!cancelled) setQueueError(`${item.result.studentName}: ${message}`);
                        const retryable = !(error instanceof SaveError) || error.retryable;
                        const count = (failures.get(id) ?? 0) + 1;
                        failures.set(id, count);
                        if (!retryable) {
                            memoryPending.current.set(id, {...item, permanentError: message});
                            if (latest.current?.result.attemptId === id) {
                                latest.current = {...latest.current, permanentError: message};
                                if (!cancelled) setLocal(latest.current);
                            }
                            try {await acknowledgeAttempt(id, message)} catch { /* The pending payload remains in memory. */ }
                        } else if (count < 6) retryDelay = Math.min(retryDelay ?? Infinity, Math.min(60000, 2000 * 2 ** (count - 1)));
                        if (latest.current?.result.attemptId === id && !cancelled) setSaveError(`${message}${retryable ? ' Results are pending; retrying when connected.' : ''}`);
                    } finally {if (current && !cancelled) setSaving(false)}
                }
            } finally {
                running = false;
                if (!cancelled && retryDelay !== undefined) timer = setTimeout(flush, retryDelay);
            }
        }
        function retry() {
            failures.clear();
            for (const [id, value] of memoryPending.current) memoryPending.current.set(id, {...value, permanentError: undefined});
            void flush();
        }
        wake.current = () => {void flush()};
        const online = () => {failures.clear(); void flush()};
        window.addEventListener('online', online);
        window.addEventListener('wv-retry-results', retry);
        void flush();
        return () => {cancelled = true; clearTimeout(timer); window.removeEventListener('online', online); window.removeEventListener('wv-retry-results', retry); release.current?.()};
    }, []);

    useEffect(() => {
        if (!examId || !homeworkId || !local || local.saved) return;
        return listenForRefresh(examId, homeworkId, () => latest.current, setSyncError);
        // Keep one subscription for the attempt; callbacks read the latest state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId, homeworkId, local?.result.attemptId, local?.saved]);

    async function leave() {
        if (latest.current) await write({...latest.current, active: false});
        else if (recoverable) {
            try {await persistAttempt({...recoverable, active: false})}
            catch {setStorageError('Local recovery is unavailable. Keep this page open until your results are saved.')}
        }
        release.current?.();
        release.current = undefined;
        latest.current = undefined;
        setLocal(undefined);
        setRecoverable(undefined);
    }
    return {local, latest, recoverable, storageError, syncError, saveError, saving, pendingCount, queueError, claim, write, leave,
        retry: () => window.dispatchEvent(new Event('wv-retry-results'))};
}
