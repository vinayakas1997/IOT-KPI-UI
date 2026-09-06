import { Fragment, useEffect, useMemo, useState } from 'react';
import type { AppSettings, Language } from '../../types';
import { ConfigValidationError, fetchConfig, postReset, resetConfig, saveConfig } from '../../api/client';
import { t } from '../../i18n/strings';
import './SettingsPanel.css';

interface Props {
  language: Language;
  onClose: () => void;
  /** Called after a successful save/reset so the dashboard can re-fetch. */
  onSaved: () => void;
}

export function SettingsPanel({ language, onClose, onSaved }: Props) {
  const [form, setForm] = useState<AppSettings | null>(null);
  const [machines, setMachines] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmShiftReset, setConfirmShiftReset] = useState(false);
  const [shiftResetFlash, setShiftResetFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchConfig()
      .then((r) => {
        if (cancelled) return;
        setForm(r.config);
        setMachines(r.machines);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const intervalSum = useMemo(
    () => (form ? form.intervals.reduce((s, iv) => s + (Number(iv.target) || 0), 0) : 0),
    [form],
  );

  const patch = (p: Partial<AppSettings>) => setForm((f) => (f ? { ...f, ...p } : f));

  const setIntervalText = (idx: number, key: 'start' | 'end' | 'label', value: string) =>
    setForm((f) =>
      f ? { ...f, intervals: f.intervals.map((iv, i) => (i === idx ? { ...iv, [key]: value } : iv)) } : f,
    );

  const setIntervalTarget = (idx: number, value: number) =>
    setForm((f) =>
      f ? { ...f, intervals: f.intervals.map((iv, i) => (i === idx ? { ...iv, target: value } : iv)) } : f,
    );

  const setBreak = (idx: number, key: 'start' | 'end', value: string) =>
    setForm((f) =>
      f ? { ...f, buffers: f.buffers.map((b, i) => (i === idx ? { ...b, [key]: value } : b)) } : f,
    );

  const addBreak = () =>
    setForm((f) =>
      f && f.buffers.length < 2 ? { ...f, buffers: [...f.buffers, { start: '12:00', end: '12:10' }] } : f,
    );

  const removeBreak = (idx: number) =>
    setForm((f) => (f ? { ...f, buffers: f.buffers.filter((_, i) => i !== idx) } : f));

  const setIdeal = (machine: string, value: number) =>
    setForm((f) => (f ? { ...f, idealCycleTime: { ...f.idealCycleTime, [machine]: value } } : f));

  const numeric = (raw: string) => (raw === '' ? 0 : Number(raw));

  const handleSave = async () => {
    if (!form) return;
    setBusy(true);
    setIssues([]);
    try {
      await saveConfig(form);
      setSavedFlash(true);
      onSaved();
      window.setTimeout(onClose, 500);
    } catch (err) {
      if (err instanceof ConfigValidationError) setIssues(err.issues);
      else setIssues([String((err as Error).message || 'save failed')]);
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setIssues([]);
    try {
      const restored = await resetConfig();
      setForm(restored);
      onSaved();
    } catch (err) {
      setIssues([String((err as Error).message || 'reset failed')]);
    } finally {
      setBusy(false);
    }
  };

  const handleShiftReset = async () => {
    if (!confirmShiftReset) {
      setConfirmShiftReset(true);
      return;
    }
    setBusy(true);
    setIssues([]);
    try {
      await postReset();
      setConfirmShiftReset(false);
      setShiftResetFlash(true);
      onSaved();
      window.setTimeout(() => setShiftResetFlash(false), 1800);
    } catch (err) {
      setIssues([String((err as Error).message || 'shift reset failed')]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-overlay" onMouseDown={onClose}>
      <div
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('settingsTitle', language)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="settings-panel__header">
          <span>{t('settingsTitle', language)}</span>
          <button
            type="button"
            className="settings-panel__close"
            onClick={onClose}
            aria-label={t('closeModal', language)}
          >
            &times;
          </button>
        </div>

        {loadError && (
          <div className="settings-panel__errors">
            <strong>{t('settingsLoadError', language)}</strong>
          </div>
        )}

        {issues.length > 0 && (
          <div className="settings-panel__errors">
            <strong>{t('settingsSaveError', language)}</strong>
            <ul>
              {issues.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {!form && !loadError && <div className="settings-panel__body">{t('settingsLoading', language)}</div>}

        {form && (
          <div className="settings-panel__body">
            <section className="settings-section">
              <h3>{t('settingsShift', language)}</h3>
              <div className="settings-row-2">
                <div className="settings-field">
                  <label>{t('settingsShiftStart', language)}</label>
                  <input
                    type="time"
                    value={form.shiftStart}
                    onChange={(e) => patch({ shiftStart: e.target.value })}
                  />
                </div>
                <div className="settings-field">
                  <label>{t('settingsShiftEnd', language)}</label>
                  <input
                    type="time"
                    value={form.shiftEnd}
                    onChange={(e) => patch({ shiftEnd: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h3>{t('settingsBreaks', language)}</h3>
              {form.buffers.map((b, i) => (
                <div className="settings-break-row" key={i}>
                  <input type="time" value={b.start} onChange={(e) => setBreak(i, 'start', e.target.value)} />
                  <input type="time" value={b.end} onChange={(e) => setBreak(i, 'end', e.target.value)} />
                  <button type="button" className="settings-linkbtn" onClick={() => removeBreak(i)}>
                    {t('settingsRemove', language)}
                  </button>
                </div>
              ))}
              {form.buffers.length < 2 && (
                <button type="button" className="settings-linkbtn" onClick={addBreak}>
                  {t('settingsAddBreak', language)}
                </button>
              )}
            </section>

            <section className="settings-section">
              <h3>{t('settingsIntervals', language)}</h3>
              <div className="settings-interval-grid">
                <span className="col-head">{t('settingsColStart', language)}</span>
                <span className="col-head">{t('settingsColEnd', language)}</span>
                <span className="col-head">{t('settingsColLabel', language)}</span>
                <span className="col-head">{t('settingsColTarget', language)}</span>
                {form.intervals.map((iv, i) => (
                  <Fragment key={i}>
                    <input type="time" value={iv.start} onChange={(e) => setIntervalText(i, 'start', e.target.value)} />
                    <input type="time" value={iv.end} onChange={(e) => setIntervalText(i, 'end', e.target.value)} />
                    <input type="text" value={iv.label} onChange={(e) => setIntervalText(i, 'label', e.target.value)} />
                    <input
                      type="number"
                      min={0}
                      value={iv.target}
                      onChange={(e) => setIntervalTarget(i, numeric(e.target.value))}
                    />
                  </Fragment>
                ))}
              </div>
            </section>

            <section className="settings-section">
              <h3>{t('settingsDailyTarget', language)}</h3>
              <input
                type="number"
                min={0}
                value={form.dailyTarget}
                onChange={(e) => patch({ dailyTarget: numeric(e.target.value) })}
              />
              <div className="settings-hint">
                {t('settingsIntervalSum', language)}: {intervalSum} / {form.dailyTarget}
              </div>
            </section>

            <section className="settings-section">
              <h3>{t('settingsIdealCt', language)}</h3>
              <div className="settings-ideal-grid">
                {machines.map((m) => (
                  <Fragment key={m}>
                    <span>{m}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={form.idealCycleTime[m] ?? 0}
                      onChange={(e) => setIdeal(m, numeric(e.target.value))}
                    />
                  </Fragment>
                ))}
              </div>
            </section>

            <section className="settings-section settings-danger">
              <h3>{t('settingsShiftReset', language)}</h3>
              <div className="settings-hint">{t('settingsShiftResetHint', language)}</div>
              <div className="settings-danger-row">
                <button
                  type="button"
                  className={`settings-btn ${confirmShiftReset ? 'settings-btn--danger' : ''}`}
                  onClick={handleShiftReset}
                  disabled={busy}
                >
                  {shiftResetFlash
                    ? t('settingsShiftResetDone', language)
                    : confirmShiftReset
                      ? t('settingsShiftResetConfirm', language)
                      : t('settingsShiftResetBtn', language)}
                </button>
                {confirmShiftReset && !shiftResetFlash && (
                  <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setConfirmShiftReset(false)}>
                    {t('settingsCancel', language)}
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        <div className="settings-panel__footer">
          <button
            type="button"
            className="settings-btn settings-btn--ghost"
            onClick={handleReset}
            disabled={busy || !form}
          >
            {t('settingsResetDefaults', language)}
          </button>
          <span className="spacer" />
          <button type="button" className="settings-btn" onClick={onClose}>
            {t('settingsCancel', language)}
          </button>
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            onClick={handleSave}
            disabled={busy || !form}
          >
            {savedFlash ? t('settingsSaved', language) : t('settingsSave', language)}
          </button>
        </div>
      </div>
    </div>
  );
}
