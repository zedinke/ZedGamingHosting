'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@i18n/translations';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '@zed-hosting/ui-kit';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
      const apiBase = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      
      const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pathParts = currentPath.split('/').filter(Boolean);
  const locale = pathParts[0] && ['hu', 'en'].includes(pathParts[0]) ? pathParts[0] : 'hu';

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-6 text-3xl font-bold text-white">Email Sent!</h2>
            <p className="mt-2 text-sm text-gray-300">
              Check your email for password reset instructions.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href={`/${locale}/login`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
      >
        <div>
          <div className="flex justify-center">
            <Mail className="h-12 w-12 text-purple-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-white/5 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <Link
              href={`/${locale}/login`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
