/**
 * Minimal promise wrapper over raw IndexedDB — one DB, one object store for
 * the persisted upload queue (upload-pipeline §6.2). Kept dependency-free on
 * purpose (dependency-policy: no new dep where ~60 lines suffice). IndexedDB
 * is the sanctioned persistence here; the `localStorage` lint ban is about
 * PII-bearing web storage, not this.
 */

const DB_NAME = "storage-uploads";
const DB_VERSION = 1;
export const UPLOADS_STORE = "uploads";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(UPLOADS_STORE)) {
        db.createObjectStore(UPLOADS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexedDB open failed"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(UPLOADS_STORE, mode);
      const request = run(tx.objectStore(UPLOADS_STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("indexedDB request failed"));
    });
  } finally {
    db.close();
  }
}

export function idbPut(value: unknown): Promise<IDBValidKey> {
  return withStore("readwrite", (store) => store.put(value));
}

export function idbDelete(key: string): Promise<undefined> {
  return withStore("readwrite", (store) => store.delete(key));
}

export function idbGetAll<T>(): Promise<T[]> {
  return withStore<T[]>("readonly", (store) => store.getAll() as IDBRequest<T[]>);
}
