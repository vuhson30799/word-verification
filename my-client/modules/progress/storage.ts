import type {LocalAttempt} from './types';

const DATABASE = 'wv-progress-v1';
let connection: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
    if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('attempts', {keyPath: 'result.attemptId'});
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Please close other homework tabs to enable local recovery.'));
    }).catch(error => {connection = undefined; throw error});
    return connection;
}
export async function allAttempts(): Promise<LocalAttempt[]> {
    const db = await open();
    return new Promise((resolve, reject) => {
        const request = db.transaction('attempts').objectStore('attempts').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Serialize reads and updates in one transaction, including across browser tabs.
// Older render/effect writes cannot undo a successful acknowledgment or revision.
export async function persistAttempt(value: LocalAttempt): Promise<LocalAttempt> {
    const db = await open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('attempts', 'readwrite');
        const store = transaction.objectStore('attempts');
        const request = store.get(value.result.attemptId);
        let stored = value;
        request.onsuccess = () => {
            const previous = request.result as LocalAttempt | undefined;
            if (previous && (previous.result.revision > value.result.revision ||
                (previous.result.status === 'completed' && value.result.status !== 'completed'))) stored = previous;
            else if (previous?.saved) stored = {...value, pending: false, saved: true, permanentError: undefined};
            else if (previous?.permanentError) stored = {...value, permanentError: previous.permanentError};
            store.put(stored);
        };
        transaction.oncomplete = () => resolve(stored);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Local save was interrupted.'));
    });
}

export async function acknowledgeAttempt(attemptId: string, error?: string) {
    const db = await open();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('attempts', 'readwrite');
        const store = transaction.objectStore('attempts');
        const request = store.get(attemptId);
        request.onsuccess = () => {
            const value = request.result as LocalAttempt | undefined;
            if (value) store.put({...value, pending: !!error, saved: !error, permanentError: error});
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Local acknowledgment was interrupted.'));
    });
}
