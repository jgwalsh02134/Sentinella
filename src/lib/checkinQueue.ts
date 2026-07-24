/**
 * Local-first check-in queue. THE PRINCIPLE: A CHECK-IN NEVER FAILS.
 *
 * Every check-in is written to IndexedDB first — instantly, before any
 * network or auth is consulted — and a sync worker drains the queue when
 * conditions allow (connectivity regained, app focus/open, after login).
 * Each record carries a client-generated UUID; the server has a unique
 * index on it, so retries are idempotent and can never duplicate.
 *
 * Queued items are NEVER discarded by the sync worker: auth failures and
 * server errors leave them pending for the next attempt.
 */

export type QueuedCheckIn = {
  clientId: string;
  status: "safe" | "caution" | "help";
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  placeName: string | null;
  note: string | null;
  isAuto: boolean;
  /** ISO — when the user actually checked in, not when it synced. */
  createdAt: string;
};

export type SyncResult = {
  synced: number;
  remaining: number;
  /** True when the server said 401: signed out, items kept pending. */
  authRequired: boolean;
};

const DB_NAME = "sentinella";
const STORE = "checkin-queue";

/** Fired on every queue mutation so open screens can re-render. */
export const QUEUE_EVENT = "sentinella:checkin-queue";

function hasIdb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "clientId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
        t.onabort = () => db.close();
      }),
  );
}

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QUEUE_EVENT));
}

/** Instant local save — the moment this resolves, the check-in exists. */
export async function enqueueCheckIn(item: QueuedCheckIn): Promise<void> {
  if (!hasIdb()) throw new Error("This browser can't store check-ins offline.");
  await tx("readwrite", (s) => s.put(item));
  notifyChanged();
}

export async function listQueued(): Promise<QueuedCheckIn[]> {
  if (!hasIdb()) return [];
  try {
    const all = await tx<QueuedCheckIn[]>("readonly", (s) => s.getAll());
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

/**
 * Patch a still-pending item (a GPS fix landing after the instant save).
 * Returns false if the item already synced and left the queue.
 */
export async function updateQueued(
  clientId: string,
  patch: Partial<Pick<QueuedCheckIn, "lat" | "lng" | "accuracyM">>,
): Promise<boolean> {
  if (!hasIdb()) return false;
  const existing = await tx<QueuedCheckIn | undefined>("readonly", (s) => s.get(clientId));
  if (!existing) return false;
  await tx("readwrite", (s) => s.put({ ...existing, ...patch }));
  notifyChanged();
  return true;
}

async function removeQueued(clientId: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(clientId));
  notifyChanged();
}

let inFlight: Promise<SyncResult> | null = null;

/**
 * Drain the queue. Safe to call from every trigger at once — concurrent
 * calls share one run. Items stay queued on any failure; only a 2xx (or
 * an idempotent duplicate) removes them.
 */
export function syncQueue(): Promise<SyncResult> {
  if (inFlight) return inFlight;
  inFlight = doSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doSync(): Promise<SyncResult> {
  const items = await listQueued();
  let synced = 0;
  let authRequired = false;

  for (const item of items) {
    if (typeof navigator !== "undefined" && !navigator.onLine) break;
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.status === 401) {
        // Signed out: keep everything pending and let the UI say so once.
        authRequired = true;
        break;
      }
      if (res.ok) {
        await removeQueued(item.clientId);
        synced += 1;
        continue;
      }
      // Server rejected or errored: keep the item for the next run —
      // a queued check-in is never discarded.
    } catch {
      // Network dropped mid-run: stop, the next trigger retries.
      break;
    }
  }

  const remaining = (await listQueued()).length;
  return { synced, remaining, authRequired };
}
