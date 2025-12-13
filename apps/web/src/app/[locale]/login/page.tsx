'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Zap } from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { Button, Card } from '@zed-hosting/ui-kit';
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Brand Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-10"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-6 shadow-glow-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Zap className="w-10 h-10 text-white relative z-10" fill="currentColor" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-text-primary via-primary-400 to-text-primary bg-clip-text text-transparent">
            ZedGamingHosting
          </h1>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-medium elevation-3 border-border/50 overflow-hidden">
            {/* Card Header */}
            <div className="px-8 pt-8 pb-6 border-b border-border/30">
              <h2 className="text-2xl font-semibold text-text-primary">
                {t('title') || 'Welcome back'}
              </h2>
              <p className="text-sm text-text-tertiary mt-1">
                {t('subtitle') || 'Sign in to continue to your account'}
              </p>
            </div>

            {/* Form Content */}
            <div className="px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 rounded-lg p-4 text-sm border border-error-500/30 bg-error-500/10 text-error-500 backdrop-blur-sm"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                  </motion.div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-text-primary"
                  >
                    {t('email')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none transition-colors group-focus-within:text-primary-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder') || 'email@example.com'}
                      required
                      disabled={loading}
                      autoComplete="email"
                      className="pl-12 pr-4 h-12 bg-background-elevated/50 border-border-light focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-text-primary"
                    >
                      {t('password')}
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-xs text-primary-500 hover:text-primary-400 transition-colors font-medium hover:underline"
                    >
                      {t('forgotPassword')}
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none transition-colors group-focus-within:text-primary-500" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder') || 'Enter your password'}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                      className="pl-12 pr-4 h-12 bg-background-elevated/50 border-border-light focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border-light bg-background-elevated text-primary-500 focus:ring-primary-500/20 focus:ring-2 transition-all cursor-pointer"
                    />
                    <span className="ml-2.5 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
                      {t('rememberMe') || 'Remember me'}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full h-12 text-base font-semibold"
                    disabled={loading}
                    isLoading={loading}
                  >
                    {loading ? (t('loggingIn') || 'Logging in...') : t('submit')}
                  </Button>
                </div>
              </form>
            </div>

            {/* Card Footer */}
            <div className="px-8 py-6 border-t border-border/30 bg-background-surface/30">
              <p className="text-center text-sm text-text-tertiary">
                {t('noAccount') || "Don't have an account?"}{' '}
                <a
                  href="/register"
                  className="text-primary-500 hover:text-primary-400 font-semibold transition-colors hover:underline"
                >
                  {t('signUp') || 'Sign up'}
                </a>
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center text-xs text-text-tertiary"
        >
          © {new Date().getFullYear()} ZedGamingHosting. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
