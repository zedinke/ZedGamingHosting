'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './two-fa.module.css';

interface TwoFASetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  backupCodes: string[];
}

interface TwoFAStatus {
  enabled: boolean;
  method: 'totp' | 'sms' | null;
  backupCodesCount: number;
}

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Setup state
  const [setupData, setSetupData] = useState<TwoFASetup | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);

  // Disable state
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  // Backup codes state
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/2fa/status');
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupStart = async () => {
    try {
      setError('');
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      if (!res.ok) throw new Error('Setup failed');
      const data = await res.json();
      setSetupData(data);
      setShowSetup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    }
  };

  const handleEnableVerify = async () => {
    if (!setupData || !verifyCode) return;

    setVerifying(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupData.secret,
          code: parseInt(verifyCode),
        }),
      });

      if (!res.ok) throw new Error('Verification failed');

      setSetupSuccess(true);
      setShowSetup(false);
      setShowBackupCodes(true);
      setVerifyCode('');

      // Refresh status
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode) return;

    setDisabling(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: parseInt(disableCode) }),
      });

      if (!res.ok) throw new Error('Disable failed');

      setShowDisable(false);
      setDisableCode('');
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disable failed');
    } finally {
      setDisabling(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Betöltés...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Kétfaktoros Autentikáció</h1>
        <p>Erősítsd meg a fiókod egy további biztonsági szinttel</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statusCard}>
        <div className={styles.statusContent}>
          <h2>Jelenlegi állapot</h2>
          {status?.enabled ? (
            <div className={styles.enabled}>
              <div className={styles.badge}>✓ ENGEDÉLYEZVE</div>
              <p className={styles.method}>Metódus: {status.method === 'totp' ? 'TOTP (Authenticator)' : 'SMS'}</p>
              <p className={styles.backupInfo}>
                {status.backupCodesCount} backup kód marad
              </p>
              <div className={styles.actions}>
                <button
                  onClick={() => setShowDisable(true)}
                  className={styles.dangerButton}
                >
                  Letiltás
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.disabled}>
              <div className={styles.badge}>✗ LETILTVA</div>
              <p>A kétfaktoros autentikáció nem aktív. Erős jelszó mellett ajánlott a bekapcsolás.</p>
              <button
                onClick={handleSetupStart}
                className={styles.primaryButton}
              >
                Bekapcsolás
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      {showSetup && setupData && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Kétfaktoros Autentikáció Beállítása</h2>

            <div className={styles.setupStep}>
              <h3>1. Authenticator App Letöltése</h3>
              <p>
                Töltsd le az alábbi alkalmazások egyikét:
              </p>
              <ul>
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
              </ul>
            </div>

            <div className={styles.setupStep}>
              <h3>2. QR Kód Beolvasása</h3>
              <div className={styles.qrContainer}>
                <img src={setupData.qrCode} alt="2FA QR Code" />
              </div>
              <p>Vagy manuálisan add meg:</p>
              <code className={styles.manualKey}>{setupData.manualEntryKey}</code>
            </div>

            <div className={styles.setupStep}>
              <h3>3. Kód Megerősítése</h3>
              <p>Add meg az alkalmazás által generált 6 jegyű kódot:</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className={styles.codeInput}
              />
              <button
                onClick={handleEnableVerify}
                disabled={verifying || verifyCode.length !== 6}
                className={styles.primaryButton}
              >
                {verifying ? 'Ellenőrzés...' : 'Megerősítés'}
              </button>
              <button
                onClick={() => {
                  setShowSetup(false);
                  setSetupData(null);
                  setVerifyCode('');
                }}
                className={styles.secondaryButton}
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && setupData && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Backup Kódok</h2>
            <p className={styles.warning}>
              ⚠️ Mentsd le ezeket a kódokat biztonságos helyre! Ha elveszted a telefonod, ezek a kódok fognak menteni.
            </p>

            <div className={styles.backupCodesBox}>
              {setupData.backupCodes.map((code, i) => (
                <div key={i} className={styles.backupCode}>
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={handleCopyBackupCodes}
              className={styles.copyButton}
            >
              {copied ? '✓ Másolva!' : 'Másolás vágólapra'}
            </button>

            <button
              onClick={() => {
                setShowBackupCodes(false);
                fetchStatus();
              }}
              className={styles.primaryButton}
            >
              Kész
            </button>
          </div>
        </div>
      )}

      {/* Disable Confirmation Modal */}
      {showDisable && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Kétfaktoros Autentikáció Letiltása</h2>
            <p className={styles.warning}>
              Ez egy biztonsági kritikus lépés. Add meg az aktuális 2FA kódodat a megerősítéshez:
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className={styles.codeInput}
            />

            <div className={styles.modalActions}>
              <button
                onClick={handleDisable}
                disabled={disabling || disableCode.length !== 6}
                className={styles.dangerButton}
              >
                {disabling ? 'Letiltás...' : 'Letiltás Megerősítése'}
              </button>
              <button
                onClick={() => {
                  setShowDisable(false);
                  setDisableCode('');
                }}
                className={styles.secondaryButton}
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
