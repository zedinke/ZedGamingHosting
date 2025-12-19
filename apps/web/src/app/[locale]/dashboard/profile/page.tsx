'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { Card, Button, Input } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useNotificationContext } from '../../../../context/notification-context';
import { Navigation } from '../../../../components/navigation';
import { Mail, User, Lock, Calendar } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
  lastLogin?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
  }, [isAuthenticated, isHydrated, router, locale]);

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      return await apiClient.get<UserProfile>('/users/profile');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [userProfile]);

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

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Jelenlegi jelszó szükséges';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Új jelszó szükséges';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Jelszó legalább 6 karakter hosszú';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'A jelszavak nem egyeznek';
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = 'Az új jelszó nem lehet ugyanaz, mint a jelenlegi';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setPasswordLoading(true);
    try {
      await apiClient.post('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      notifications.addNotification?.({
        type: 'success',
        title: 'Jelszó megváltoztatva',
        message: 'Jelszavát sikeresen megváltozatta.',
      });
    } catch (error: any) {
      notifications.addNotification?.({
        type: 'error',
        title: 'Hiba',
        message: error.message || 'Hiba a jelszó megváltoztatásakor',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-background-surface pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-text-primary">
              Profil Beállítások
            </h1>
            <p className="text-text-muted">
              Kezeld a profil adataidat és biztonsági beállításaidat
            </p>
          </header>

          {isLoadingProfile ? (
            <Card className="p-12 text-center">
              <p className="text-text-muted">Betöltés...</p>
            </Card>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Information Card */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-text-primary">
                  Profil Adatok
                </h2>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      E-mail cím
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-background-surface rounded-lg border border-border">
                      <Mail className="h-5 w-5 text-text-muted" />
                      <span className="text-text-primary">{profile.email}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      E-mail cím megváltoztatásához keress fel minket
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Szerepkör
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-background-surface rounded-lg border border-border">
                      <User className="h-5 w-5 text-text-muted" />
                      <span className="text-text-primary font-medium">{profile.role}</span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Egyenleg
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-background-surface rounded-lg border border-border">
                      <span className="text-2xl font-bold text-success">
                        {profile.balance.toFixed(2)} €
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Az egyenleged automatikusan frissül a bevétel alapján
                    </p>
                  </div>

                  {/* Created At */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Fiók létrehozva
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-background-surface rounded-lg border border-border">
                      <Calendar className="h-5 w-5 text-text-muted" />
                      <span className="text-text-primary">
                        {new Date(profile.createdAt).toLocaleString('hu-HU')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Change Password Card */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-text-primary flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Jelszó Megváltoztatása
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Jelenlegi jelszó <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                        if (passwordErrors.currentPassword) {
                          setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                        }
                      }}
                      placeholder="••••••••"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Új jelszó <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                        if (passwordErrors.newPassword) {
                          setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                        }
                      }}
                      placeholder="••••••••"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Jelszó megerősítése <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                        if (passwordErrors.confirmPassword) {
                          setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }
                      }}
                      placeholder="••••••••"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={passwordLoading}
                    className="w-full"
                  >
                    {passwordLoading ? 'Megváltoztatás...' : 'Jelszó Megváltoztatása'}
                  </Button>
                </form>
              </Card>

              {/* Security Tips */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                <h3 className="text-lg font-semibold mb-3 text-text-primary">
                  Biztonsági Tippek
                </h3>
                <ul className="space-y-2 text-sm text-text-primary">
                  <li>• Használj erős jelszót: legalább 12 karakter, kis és nagybetűk, számok, szimbólumok</li>
                  <li>• Sosem oszd meg jelszavadat másokkal</li>
                  <li>• Rendszeresen változtatd meg jelszavadat (legalább 3 hónaponként)</li>
                  <li>• Használj egyedi jelszót a különböző weboldalakon</li>
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-text-muted">Profil nem elérhető</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
