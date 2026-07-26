/**
 * useRecordingStore.ts
 *
 * Thin IndexedDB wrapper for persisting session audio blobs.
 * DB: "sunrise-recordings"  Store: "recordings"
 * Key: string (recording session id)  Value: { blob: Blob; createdAt: number }
 *
 * Usage:
 *   const { saveRecording, getRecordingUrl, deleteRecording } = useRecordingStore();
 */

import { useCallback } from 'react';

const DB_NAME = 'sunrise-recordings';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface RecordingEntry {
  id: string;
  blob: Blob;
  createdAt: number;
}

async function save(entry: RecordingEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function get(id: string): Promise<RecordingEntry | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => { db.close(); resolve(req.result as RecordingEntry | undefined); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function remove(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export function useRecordingStore() {
  const saveRecording = useCallback(async (id: string, blob: Blob): Promise<void> => {
    await save({ id, blob, createdAt: Date.now() });
  }, []);

  const getRecordingUrl = useCallback(async (id: string): Promise<string | null> => {
    const entry = await get(id);
    if (!entry) return null;
    return URL.createObjectURL(entry.blob);
  }, []);

  const deleteRecording = useCallback(async (id: string): Promise<void> => {
    await remove(id);
  }, []);

  return { saveRecording, getRecordingUrl, deleteRecording };
}
