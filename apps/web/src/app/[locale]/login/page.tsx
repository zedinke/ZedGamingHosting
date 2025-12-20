'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, ArrowRight, Sparkles, Key } from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { Input } from '@zed-hosting/ui-kit';

type LoginStep = 'credentials' | 'two-fa' | 'backup-code';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { login } = useAuthStore();
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA state
  const [twoFACode, setTwoFACode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  
  // UI state
  const [step, setStep] = useState<LoginStep>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [show2FAOptions, setShow2FAOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('password', password);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
      const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Invalid credentials';
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message[0] || 'Invalid credentials';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          errorMessage = response.statusText || 'Invalid credentials';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setStep('two-fa');
        setShow2FAOptions(false);
      } else {
        // Normal login without 2FA
        login(data.accessToken, data.refreshToken, data.user);
        
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/').filter(Boolean);
        const locale = pathParts[0] && ['hu', 'en'].includes(pathParts[0]) ? pathParts[0] : 'hu';
        
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!twoFACode.trim()) {
        throw new Error('Please enter your 2FA code');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
      const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      
      const response = await fetch(`${apiBase}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempToken,
          code: parseInt(twoFACode.replace(/\D/g, ''), 10),
          rememberDevice,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Invalid 2FA code';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      login(data.accessToken, data.refreshToken, data.user);
      
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(Boolean);
      const locale = pathParts[0] && ['hu', 'en'].includes(pathParts[0]) ? pathParts[0] : 'hu';
      
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!backupCode.trim()) {
        throw new Error('Please enter your backup code');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
      const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      
      const response = await fetch(`${apiBase}/api/auth/verify-backup-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempToken,
          backupCode,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Invalid backup code';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      login(data.accessToken, data.refreshToken, data.user);
      
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(Boolean);
      const locale = pathParts[0] && ['hu', 'en'].includes(pathParts[0]) ? pathParts[0] : 'hu';
      
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Backup code verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-16"
          style={{ marginBottom: '4rem' }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500 mb-8 shadow-[0_0_40px_rgba(59,130,246,0.5)] relative overflow-hidden group"
            style={{ marginBottom: '2rem' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="w-10 h-10 text-white relative z-10" fill="currentColor" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-3 text-white tracking-tight" style={{ marginBottom: '0.75rem' }}>
            ZedGamingHosting
          </h1>
          <p className="text-base text-slate-300">
            {t('subtitle') || 'Sign in to your account'}
          </p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glass Card */}
          <div className="relative backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative p-12" style={{ padding: '3rem' }}>
              {/* Form Header */}
              <div className="mb-10" style={{ marginBottom: '2.5rem' }}>
                <h2 className="text-3xl font-bold text-white mb-3" style={{ marginBottom: '0.75rem' }}>
                  {t('title') || 'Bejelentkezés'}
                </h2>
                <p className="text-base text-slate-300">
                  {t('subtitle') || 'Jelentkezz be a fiókodba'}
                </p>
              </div>

              <form 
                onSubmit={step === 'credentials' ? handleSubmit : (step === 'two-fa' && !show2FAOptions ? handleVerify2FA : handleVerifyBackupCode)}
                className="flex flex-col gap-8" 
                style={{ gap: '2rem' }}
              >
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-400 backdrop-blur-sm"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1 text-sm font-medium">{error}</span>
                  </motion.div>
                )}

                {/* Credentials Form */}
                {step === 'credentials' && (
                  <>
                    {/* Email Field */}
                    <div className="flex flex-col gap-3" style={{ gap: '0.75rem' }}>
                      <label
                        htmlFor="email"
                        className="block text-base font-medium text-white"
                      >
                        {t('email')}
                      </label>
                      <div className="relative group">
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('emailPlaceholder') || 'you@example.com'}
                          required
                          disabled={loading}
                          autoComplete="email"
                          className="pl-4 pr-4 h-14 w-full rounded-xl bg-white/95 border-0 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="flex flex-col gap-3" style={{ gap: '0.75rem' }}>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="block text-base font-medium text-white"
                        >
                          {t('password')}
                        </label>
                        <a
                          href={`/${locale}/forgot-password`}
                          className="text-sm text-white hover:text-blue-400 transition-colors font-medium"
                        >
                          {t('forgotPassword') || 'Forgot Password?'}
                        </a>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none transition-colors duration-200 z-10" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('passwordPlaceholder') || '••••••••'}
                          required
                          disabled={loading}
                          autoComplete="current-password"
                          className="pl-4 pr-12 h-14 w-full rounded-xl bg-white/95 border-0 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base"
                        />
                      </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center pt-2">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-2 border-white/30 bg-transparent text-blue-500 focus:ring-blue-500/20 focus:ring-2 transition-all cursor-pointer"
                        />
                        <span className="ml-3 text-base text-white transition-colors group-hover:text-blue-300">
                          {t('rememberMe') || 'Remember me'}
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 group font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{t('loggingIn') || 'Logging in...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('submit') || 'Bejelentkezés'}</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* 2FA Form */}
                {step === 'two-fa' && !show2FAOptions && (
                  <>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mx-auto mb-4">
                      <Key className="w-8 h-8 text-blue-400" />
                    </div>
                    
                    <h3 className="text-center text-xl font-semibold text-white">
                      Kétfaktoros Hitelesítés
                    </h3>
                    
                    <p className="text-center text-sm text-slate-300">
                      Adja meg a hitelesítő alkalmazásából kapott 6 jegyű kódot
                    </p>

                    {/* 2FA Code Input */}
                    <div className="flex flex-col gap-3">
                      <label className="text-base font-medium text-white">
                        Hitelesítési kód
                      </label>
                      <input
                        type="text"
                        value={twoFACode}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          if (digits.length <= 6) {
                            setTwoFACode(digits);
                          }
                        }}
                        placeholder="000000"
                        maxLength={6}
                        disabled={loading}
                        className="w-full h-14 text-center text-2xl tracking-widest rounded-xl bg-white/95 border-0 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 font-mono"
                      />
                    </div>

                    {/* Remember Device */}
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={rememberDevice}
                          onChange={(e) => setRememberDevice(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-white/30 bg-transparent text-blue-500 focus:ring-blue-500/20 focus:ring-2 transition-all cursor-pointer"
                        />
                        <span className="ml-3 text-sm text-white transition-colors group-hover:text-blue-300">
                          Ezt az eszközt megbízom
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || twoFACode.length !== 6}
                      className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 group font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Ellenőrzés...</span>
                        </>
                      ) : (
                        <>
                          <span>Ellenőrzés</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    {/* Backup Code Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setShow2FAOptions(true);
                        setError(null);
                      }}
                      className="text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Backup kód használata
                    </button>
                  </>
                )}

                {/* Backup Code Form */}
                {step === 'two-fa' && show2FAOptions && (
                  <>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mx-auto mb-4">
                      <Key className="w-8 h-8 text-amber-400" />
                    </div>
                    
                    <h3 className="text-center text-xl font-semibold text-white">
                      Backup Kód
                    </h3>
                    
                    <p className="text-center text-sm text-slate-300">
                      Adja meg a mentett backup kódok egyikét
                    </p>

                    {/* Backup Code Input */}
                    <div className="flex flex-col gap-3">
                      <label className="text-base font-medium text-white">
                        Backup kód
                      </label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX"
                        disabled={loading}
                        className="w-full h-14 rounded-xl bg-white/95 border-0 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 px-4 font-mono"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !backupCode.trim()}
                      className="w-full h-14 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 hover:shadow-amber-600/50 transition-all duration-200 group font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Ellenőrzés...</span>
                        </>
                      ) : (
                        <>
                          <span>Ellenőrzés</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    {/* Back to 2FA Code */}
                    <button
                      type="button"
                      onClick={() => {
                        setShow2FAOptions(false);
                        setError(null);
                      }}
                      className="text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Vissza az autentifikációs kódhoz
                    </button>
                  </>
                )}
              </form>

              {/* Registration Section */}
              <div className="mt-12 pt-10 border-t border-slate-700/50" style={{ marginTop: '3rem', paddingTop: '2.5rem' }}>
                <p className="text-center text-xs uppercase tracking-wider text-slate-400 mb-5" style={{ marginBottom: '1.25rem' }}>
                  {t('noAccount') || "NINCS MÉG FIÓKOD?"}
                </p>
                <div className="text-center">
                  <a
                    href="/register"
                    className="inline-flex items-center text-base text-white hover:text-blue-400 transition-colors font-medium group"
                  >
                    {t('signUp') || 'Regisztráció'}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center text-xs text-slate-400"
          style={{ marginTop: '4rem' }}
        >
          © {new Date().getFullYear()} ZedGamingHosting. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
