/**
 * Client-side storage for offline map packs.
 *
 * Each downloaded city is one .pmtiles file kept as a Blob in IndexedDB.
 * PMTiles archives are read by byte range, and Blob.slice gives us exactly
 * that without ever loading the whole file into memory — so the same
 * archive format works offline (from the Blob) and online (HTTP range
 * requests against /map-packs/<city>.pmtiles).
 */
import type { RangeResponse, Source } from "pmtiles";

const DB_NAME = "sentinella-maps";
const STORE = "packs";

type StoredPack = { id: string; blob: Blob; savedAt: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredPack(id: string): Promise<StoredPack | undefined> {
  const db = await openDb();
  try {
    return await requestToPromise(db.transaction(STORE).objectStore(STORE).get(id));
  } finally {
    db.close();
  }
}

export async function listStoredPackIds(): Promise<string[]> {
  const db = await openDb();
  try {
    const keys = await requestToPromise(db.transaction(STORE).objectStore(STORE).getAllKeys());
    return keys.map(String);
  } finally {
    db.close();
  }
}

export async function storePack(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  try {
    const pack: StoredPack = { id, blob, savedAt: Date.now() };
    await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(pack));
  } finally {
    db.close();
  }
}

export async function removePack(id: string): Promise<void> {
  const db = await openDb();
  try {
    await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(id));
  } finally {
    db.close();
  }
}

/**
 * Ask the browser to protect our storage from automatic eviction. Best
 * effort: iOS Safari may still evict under storage pressure, which the UI
 * warns about.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/**
 * Minimum time between onProgress calls. Network chunks arrive every few
 * milliseconds, and each report triggers a React re-render in the caller —
 * unthrottled, a multi-megabyte pack means thousands of renders (jank and
 * battery drain on phones). ~7 updates/second is plenty for a progress bar.
 */
const PROGRESS_REPORT_INTERVAL_MS = 150;

/**
 * Streams a pack, reporting (receivedBytes, totalBytes) as it downloads.
 * Progress is throttled to one report per PROGRESS_REPORT_INTERVAL_MS,
 * with a final report guaranteed once the download completes.
 */
export async function downloadPack(
  url: string,
  onProgress: (received: number, total: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  const res = await fetch(url, { signal });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed (HTTP ${res.status}).`);
  }
  const total = Number(res.headers.get("Content-Length") ?? 0);
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let received = 0;
  let lastReportAt = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    const now = Date.now();
    if (now - lastReportAt >= PROGRESS_REPORT_INTERVAL_MS) {
      lastReportAt = now;
      onProgress(received, total);
    }
  }
  onProgress(received, total);
  return new Blob(chunks, { type: "application/octet-stream" });
}

/** PMTiles source backed by an IndexedDB Blob — byte-range reads via slice. */
export class BlobSource implements Source {
  constructor(
    private blob: Blob,
    private key: string,
  ) {}

  getKey(): string {
    return this.key;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const data = await this.blob.slice(offset, offset + length).arrayBuffer();
    return { data };
  }
}

/** Wraps another PMTiles source to give it a stable protocol key. */
export class KeyedSource implements Source {
  constructor(
    private inner: Source,
    private key: string,
  ) {}

  getKey(): string {
    return this.key;
  }

  getBytes(offset: number, length: number, signal?: AbortSignal, etag?: string): Promise<RangeResponse> {
    return this.inner.getBytes(offset, length, signal, etag);
  }
}
