'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';

type Props = {
  bottles: number;
  sessions: number;
  photos: number;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onExport: () => void;
  onClear: () => Promise<void>;
};

export function ClearDataDialog({ bottles, sessions, photos, busy, error, onCancel, onExport, onClear }: Props) {
  const { t, tr } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => element?.close();
  }, [step]);

  return <dialog key={step} ref={dialog} className="confirm-dialog clear-data-dialog"
    aria-labelledby="clear-data-title" aria-describedby="clear-data-description"
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <p className="clear-step">{tr(`确认 ${step} / 2`, `Confirmation ${step} of 2`)}</p>
    <h2 id="clear-data-title">{step === 1 ? tr('清空本机数据？', 'Clear local data?') : tr('最后确认：确定清空吗？', 'Final check: clear everything?')}</h2>
    <p id="clear-data-description">{step === 1
      ? tr('此操作会删除当前浏览器里的全部饮酒记录、酒柜（含收藏）和照片，并丢弃未保存的记录。你确定要继续吗？', 'This will delete all drinking records, cabinet bottles, favorites and photos in this browser, including unsaved records. Do you want to continue?')
      : tr('清空后，无法在应用内撤销。只有事先导出的备份可以用来恢复。点击“确认清空”后才会删除数据。', 'This cannot be undone in the app. You can only restore from a backup exported beforehand. Data will be deleted only after you select “Confirm clear”.')}</p>
    <p className="clear-data-count">{tr(`${bottles} 瓶酒 · ${sessions} 次记录 · ${photos} 张照片`, `${bottles} ${bottles === 1 ? 'bottle' : 'bottles'} · ${sessions} ${sessions === 1 ? 'occasion' : 'occasions'} · ${photos} ${photos === 1 ? 'photo' : 'photos'}`)}</p>
    <p className="clear-data-note">{tr('已导出的备份文件不受影响。语言和币种设置保留。', 'Exported backup files are kept. Language and currency preferences stay the same.')}</p>
    {error && <p className="error" role="alert">{t(error)}</p>}
    {step === 1 && <button type="button" className="button outline full clear-export" disabled={busy} onClick={onExport}>{tr('先导出一份备份', 'Export a backup first')}</button>}
    <div className="clear-data-actions">
      <button type="button" ref={cancel} className="button outline" disabled={busy} onClick={onCancel}>{tr('取消，保留数据', 'Cancel, keep data')}</button>
      {step === 1
        ? <button type="button" className="button primary" disabled={busy} onClick={() => setStep(2)}>{tr('继续确认', 'Continue')}</button>
        : <button type="button" className="button danger" disabled={busy} onClick={() => void onClear()}>{busy ? tr('正在清空…', 'Clearing…') : tr('确认清空', 'Confirm clear')}</button>}
    </div>
  </dialog>;
}
