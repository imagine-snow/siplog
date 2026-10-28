import { emptyLedger, validateLedger, type Ledger } from './model';
const DB = 'jiuji-ledger';
const STORE = 'ledger';
let opened: Promise<IDBDatabase> | undefined;
function db() {
  return opened ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); opened = undefined; }; resolve(request.result); };
    request.onerror = () => { opened = undefined; reject(request.error); };
    request.onblocked = () => reject(new Error('请关闭其他酒迹页面后重试。'));
  });
}
export async function readLedger(): Promise<Ledger> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readonly'); const req = tx.objectStore(STORE).get('current');
    req.onsuccess = () => { try { resolve(req.result ? validateLedger(req.result) : emptyLedger()); } catch (e) { reject(e); } };
    req.onerror = () => reject(req.error);
  });
}
export async function writeLedger(data: Ledger, expectedRevision: number): Promise<Ledger> {
  validateLedger(data); const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readwrite'); const store = tx.objectStore(STORE); const req = store.get('current');
    let failure: Error | undefined;
    const next = { ...data, revision: expectedRevision + 1 };
    req.onsuccess = () => {
      if ((req.result?.revision ?? 0) !== expectedRevision) { failure = new Error('另一个页面更新了记录。请刷新后再试，你的记录没有被覆盖。'); tx.abort(); return; }
      store.put(next, 'current');
    };
    tx.oncomplete = () => resolve(next);
    tx.onabort = () => reject(failure ?? new Error('保存未完成，请重试或检查浏览器存储空间。'));
    tx.onerror = () => reject(tx.error ?? new Error('保存失败，请重试。'));
  });
}
