'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from '@i18n/translations';
import styles from './security.module.css';

export default function SecurityPage() {
  const locale = useLocale();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Biztonsági Beállítások</h1>
        <p>Kezelj és erősíts meg a fiókod biztonsági beállításait</p>
      </div>

      <div className={styles.settingsList}>
        {/* 2FA Section */}
        <Link href={`/${locale}/dashboard/security/two-fa`} className={styles.settingCard}>
          <div className={styles.settingIcon}>🔐</div>
          <div className={styles.settingContent}>
            <h3>Kétfaktoros Autentikáció</h3>
            <p>
              Erősítsd meg a fiókod egy további biztonsági szinttel az Authenticator alkalmazás vagy SMS segítségével.
            </p>
            <span className={styles.arrow}>→</span>
          </div>
        </Link>

        {/* Password Section */}
        <Link href={`/${locale}/dashboard/security/password`} className={styles.settingCard}>
          <div className={styles.settingIcon}>🔑</div>
          <div className={styles.settingContent}>
            <h3>Jelszó Módosítása</h3>
            <p>
              Módosítsd a jelszavadat és fenntartsd a fiók biztonságát. Ajánlott erős, egyedi jelszó használata.
            </p>
            <span className={styles.arrow}>→</span>
          </div>
        </Link>

        {/* Sessions Section */}
        <div className={styles.settingCard}>
          <div className={styles.settingIcon}>📱</div>
          <div className={styles.settingContent}>
            <h3>Aktív Munkamenetek</h3>
            <p>
              Megtekintheted és kezelheted az összes aktív bejelentkezési munkamenetet.
            </p>
            <span className={styles.arrow}>→</span>
          </div>
        </div>

        {/* API Keys Section */}
        <Link href={`/${locale}/dashboard/api-keys`} className={styles.settingCard}>
          <div className={styles.settingIcon}>🔑</div>
          <div className={styles.settingContent}>
            <h3>API Kulcsok</h3>
            <p>
              Kezelj és generálj új API kulcsokat programmatic hozzáféréshez.
            </p>
            <span className={styles.arrow}>→</span>
          </div>
        </Link>

        {/* Login History Section */}
        <div className={styles.settingCard}>
          <div className={styles.settingIcon}>📊</div>
          <div className={styles.settingContent}>
            <h3>Bejelentkezési Előzmények</h3>
            <p>
              Tekintsd meg az összes bejelentkezési kísérlet és hely információit.
            </p>
            <span className={styles.arrow}>→</span>
          </div>
        </div>
      </div>

      <div className={styles.tips}>
        <h2>Biztonsági Tippek</h2>
        <ul>
          <li>
            <strong>Erős jelszó:</strong> Legalább 12 karakter, kis- és nagybetűk, számok és speciális karakterek.
          </li>
          <li>
            <strong>Kétfaktoros autentikáció:</strong> Engedélyezd a 2FA-t a maximális védelem érdekében.
          </li>
          <li>
            <strong>Rendszeres ellenőrzés:</strong> Periodikusan ellenőrizd a bejelentkezési előzményeket.
          </li>
          <li>
            <strong>API kulcsok:</strong> Soha ne oszd meg az API kulcsaidat. Rendszeresen forgasd őket.
          </li>
          <li>
            <strong>Backup kódok:</strong> Mentsd le és tárold biztonságos helyen a 2FA backup kódokat.
          </li>
        </ul>
      </div>
    </div>
  );
}
