'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { Input } from '@zed-hosting/ui-kit';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();
      
      login(data.accessToken, data.refreshToken, data.user);
      
      const locale = window.location.pathname.split('/')[1] || 'hu';
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 mb-6 shadow-[0_0_40px_rgba(14,165,233,0.4)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="w-8 h-8 text-white relative z-10" fill="currentColor" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">
            ZedGamingHosting
          </h1>
          <p className="text-sm text-slate-400">
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
          <div className="relative backdrop-blur-xl bg-slate-900/80 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
            
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative p-8">
              {/* Form Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-1.5">
                  {t('title') || 'Welcome back'}
                </h2>
                <p className="text-sm text-slate-400">
                  {t('subtitle') || 'Enter your credentials to continue'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-300"
                  >
                    {t('email')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none transition-colors duration-200 group-focus-within:text-primary-500 z-10" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder') || 'you@example.com'}
                      required
                      disabled={loading}
                      autoComplete="email"
                      className="pl-12 pr-4 h-12 w-full rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-300"
                    >
                      {t('password')}
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
                    >
                      {t('forgotPassword')}
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none transition-colors duration-200 group-focus-within:text-primary-500 z-10" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder') || '••••••••'}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                      className="pl-12 pr-4 h-12 w-full rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-primary-500 focus:ring-primary-500/20 focus:ring-2 transition-all cursor-pointer"
                    />
                    <span className="ml-2.5 text-sm text-slate-400 transition-colors group-hover:text-slate-300">
                      {t('rememberMe') || 'Remember me'}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-200 group font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <span>{t('submit') || 'Sign in'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900/80 px-2 text-slate-500">
                    {t('noAccount') || "Don't have an account?"}
                  </span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <a
                  href="/register"
                  className="inline-flex items-center text-sm text-slate-400 hover:text-primary-400 transition-colors font-medium group"
                >
                  {t('signUp') || 'Create an account'}
                  <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center text-xs text-slate-500"
        >
          © {new Date().getFullYear()} ZedGamingHosting. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
