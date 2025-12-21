'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@i18n/translations';
import { Input } from '@zed-hosting/ui-kit';

export default function RegisterPage({ params }: { params: { locale?: string } }) {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const locale = params?.locale && ['hu', 'en'].includes(params.locale) ? params.locale : 'hu';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  // Billing fields
  const [billingType, setBillingType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [street, setStreet] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(locale === 'hu' ? 'A jelszavak nem egyeznek.' : 'Passwords do not match.');
      return;
    }
    if (!email || !password) {
      setError(locale === 'hu' ? 'E-mail és jelszó szükséges.' : 'Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
      const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');

      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || undefined,
          billing: {
            type: billingType,
            fullName: billingType === 'INDIVIDUAL' ? fullName || undefined : undefined,
            companyName: billingType === 'COMPANY' ? companyName || undefined : undefined,
            taxNumber: billingType === 'COMPANY' ? taxNumber || undefined : undefined,
            country,
            city,
            postalCode,
            street,
            phone: phone || undefined,
          },
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        let msg = locale === 'hu' ? 'Regisztráció sikertelen.' : 'Registration failed.';
        try {
          const errData = await res.json();
          if (Array.isArray(errData.message)) {
            msg = errData.message[0] || msg;
          } else if (errData.message) {
            msg = errData.message;
          } else if (errData.error) {
            msg = errData.error;
          }
        } catch {}
        throw new Error(msg);
      }

      // On success, redirect to login
      router.push(`/${locale}/login`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || (locale === 'hu' ? 'Ismeretlen hiba történt.' : 'Unknown error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-4">
          {t('title') || (locale === 'hu' ? 'Regisztráció' : 'Sign Up')}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {t('subtitle') || (locale === 'hu' ? 'Hozz létre új fiókot.' : 'Create a new account.')}
        </p>

        {error && (
          <div className="mb-4 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">{t('email') || (locale === 'hu' ? 'E-mail cím' : 'Email address')}</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('displayName') || (locale === 'hu' ? 'Megjelenített név (opcionális)' : 'Display name (optional)')}</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={locale === 'hu' ? 'Pl. Játékos' : 'e.g., Player'} />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('password') || (locale === 'hu' ? 'Jelszó' : 'Password')}</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="********" />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('confirmPassword') || (locale === 'hu' ? 'Jelszó megerősítése' : 'Confirm password')}</label>
            <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="********" />
          </div>

          <div className="pt-2 border-t border-slate-700">
            <h2 className="text-lg font-semibold mb-3">{t('billing.title') || (locale === 'hu' ? 'Számlázási adatok' : 'Billing Details')}</h2>
            <div className="flex gap-3 mb-3">
              <button type="button" onClick={() => setBillingType('INDIVIDUAL')} className={`px-3 py-1 rounded border ${billingType==='INDIVIDUAL' ? 'border-blue-500 bg-blue-600/30' : 'border-slate-600'}`}>
                {t('billing.individual') || (locale === 'hu' ? 'Magánszemély' : 'Individual')}
              </button>
              <button type="button" onClick={() => setBillingType('COMPANY')} className={`px-3 py-1 rounded border ${billingType==='COMPANY' ? 'border-blue-500 bg-blue-600/30' : 'border-slate-600'}`}>
                {t('billing.company') || (locale === 'hu' ? 'Cég' : 'Company')}
              </button>
            </div>

            {billingType === 'INDIVIDUAL' ? (
              <div>
                <label className="block text-sm mb-1">{t('billing.fullName') || (locale === 'hu' ? 'Teljes név' : 'Full name')}</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={locale==='hu' ? 'Vezetéknév Keresztnév' : 'First Last'} />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm mb-1">{t('billing.companyName') || (locale === 'hu' ? 'Cég neve' : 'Company name')}</label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={locale==='hu' ? 'Cégnév Kft.' : 'Company Ltd.'} />
                </div>
                <div>
                  <label className="block text-sm mb-1">{t('billing.taxNumber') || (locale === 'hu' ? 'Adószám' : 'Tax number')}</label>
                  <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder={locale==='hu' ? '12345678-1-12' : 'VAT ID'} />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">{t('billing.country') || (locale === 'hu' ? 'Ország' : 'Country')}</label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={locale==='hu' ? 'Magyarország' : 'Hungary'} />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('billing.city') || (locale === 'hu' ? 'Város' : 'City')}</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={locale==='hu' ? 'Budapest' : 'City'} />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('billing.postalCode') || (locale === 'hu' ? 'Irányítószám' : 'Postal Code')}</label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={locale==='hu' ? '1234' : '12345'} />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('billing.street') || (locale === 'hu' ? 'Utca, házszám' : 'Street, number')}</label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder={locale==='hu' ? 'Utca 1.' : 'Street 1'} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">{t('billing.phone') || (locale === 'hu' ? 'Telefonszám (opcionális)' : 'Phone (optional)')}</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={locale==='hu' ? '+36 30 123 4567' : '+1 555 555 5555'} />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">{t('note.verifyEmail') || (locale === 'hu' ? 'Regisztráció után email megerősítés szükséges a belépéshez.' : 'After sign up, please verify your email to log in.')}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg font-medium"
          >
            {loading
              ? (t('submitting') || (locale === 'hu' ? 'Feldolgozás...' : 'Submitting...'))
              : (t('submit') || (locale === 'hu' ? 'Regisztrálok' : 'Sign Up'))}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-400">
          <a href={`/${locale}/login`} className="text-blue-400 hover:text-blue-300">
            {t('backToLogin') || (locale === 'hu' ? 'Vissza a bejelentkezéshez' : 'Back to login')}
          </a>
        </div>
      </div>
    </div>
  );
}
