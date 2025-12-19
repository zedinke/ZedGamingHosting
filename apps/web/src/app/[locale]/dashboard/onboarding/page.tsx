'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { Button, Card } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../components/navigation';
import {
  Zap,
  Globe,
  Users,
  Gamepad2,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isHydrated, router, locale]);

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Profil Beállítása',
      description: 'Teljesítsd a profil adataidat és állítsd be a biztonsági beállításaidat',
      icon: <Users className="h-6 w-6" />,
      completed: completedSteps.has('profile'),
      action: () => router.push(`/${locale}/dashboard/profile`),
      actionLabel: 'Profil Szerkesztése',
    },
    {
      id: 'first-server',
      title: 'Első Szerver Létrehozása',
      description: 'Hozd létre az első játékszerveredet és kezdj el játszani',
      icon: <Gamepad2 className="h-6 w-6" />,
      completed: completedSteps.has('first-server'),
      action: () => router.push(`/${locale}/plans`),
      actionLabel: 'Csomag Kiválasztása',
    },
    {
      id: 'payment',
      title: 'Fizetési Adatok',
      description: 'Add meg a fizetési módodat a szervezettebb rendelésekhez',
      icon: <Zap className="h-6 w-6" />,
      completed: completedSteps.has('payment'),
      action: () => router.push(`/${locale}/dashboard/billing`),
      actionLabel: 'Fizetés Beállítása',
    },
    {
      id: 'api-keys',
      title: 'API Kulcsok Létrehozása',
      description: 'Hozz létre API kulcsokat a fejlesztői integrációhoz (opcionális)',
      icon: <Globe className="h-6 w-6" />,
      completed: completedSteps.has('api-keys'),
      action: () => router.push(`/${locale}/dashboard/api-keys`),
      actionLabel: 'API Kulcsok',
    },
  ];

  const completionPercentage = (completedSteps.size / steps.length) * 100;

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-background-surface pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2 text-text-primary">
              Üdvözlünk, {user?.email}! 👋
            </h1>
            <p className="text-lg text-text-muted mb-6">
              Kezdd el az utazásod a Zed Gaming Hosting-gal néhány egyszerű lépésben
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-background-overlay rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-text-muted">
              {completedSteps.size} / {steps.length} lépés befejezve
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-4 md:grid-cols-2 mb-12">
            {steps.map((step) => (
              <Card
                key={step.id}
                className={`p-6 relative overflow-hidden transition-all ${
                  step.completed
                    ? 'border-success bg-gradient-to-br from-success/10 to-success/5'
                    : 'border-border hover:border-primary-400'
                }`}
              >
                {/* Completed Badge */}
                {step.completed && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                )}

                {/* Icon */}
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100 text-primary-600 mb-4">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  {step.description}
                </p>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    step.action();
                    handleStepComplete(step.id);
                  }}
                  variant={step.completed ? 'secondary' : 'primary'}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {step.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <Card className="p-8 bg-gradient-to-br from-primary-50 to-primary-100 mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Mit érhetsz el a Zed Gaming Hosting-gal?
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: 'Gyors Telepítés',
                  description: 'Szerveredet percek alatt telepítheted és futtathatod',
                },
                {
                  title: 'Megbízható Infrastruktúra',
                  description: '99.9% uptime SLA-val támogatott adatközpontok',
                },
                {
                  title: 'Könnyű Kezelés',
                  description: 'Intuitív vezérlőpult és teljes API hozzáférés',
                },
                {
                  title: 'Kitűnő Támogatás',
                  description: '24/7 technikai támogatás magyar nyelvű csapattal',
                },
                {
                  title: 'Rugalmas Díjszabás',
                  description: 'Béreld vagy vásárold meg a szervezeted igényei szerint',
                },
                {
                  title: 'Globális Jelenlét',
                  description: 'Szerverei az egész világon található adatközpontokból',
                },
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-text-muted">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Links */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Hasznos Linkek
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              <a
                href={`/${locale}/docs`}
                className="p-3 rounded-lg border border-border hover:border-primary-400 transition text-text-primary"
              >
                📚 Dokumentáció
              </a>
              <a
                href={`/${locale}/docs/api`}
                className="p-3 rounded-lg border border-border hover:border-primary-400 transition text-text-primary"
              >
                🔌 API Dokumentáció
              </a>
              <a
                href={`/${locale}/support`}
                className="p-3 rounded-lg border border-border hover:border-primary-400 transition text-text-primary"
              >
                💬 Támogatás
              </a>
              <a
                href={`/${locale}/community`}
                className="p-3 rounded-lg border border-border hover:border-primary-400 transition text-text-primary"
              >
                👥 Közösség
              </a>
            </div>
          </Card>

          {/* Skip Button */}
          <div className="text-center mt-8">
            <Button
              variant="secondary"
              onClick={() => router.push(`/${locale}/dashboard`)}
            >
              Lépj az Irányítópulthoz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
