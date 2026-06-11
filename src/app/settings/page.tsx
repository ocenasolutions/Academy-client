'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Bell, Globe, LifeBuoy, LockKeyhole, Palette, ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react';
import { StudentReferenceShell } from '@/components/StudentReferenceShell';
import { updateUser } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const { user, refreshProfile, signOut } = useProtectedPage();
  const { addToast } = useToast();
  const router = useRouter();

  // Profile Form State
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', headline: '', bio: '', avatar: '' });
  const [saving, setSaving] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState('English (US)');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Modals States
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      headline: user.headline || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
    });

    // Load preferences
    setEmailNotifications(localStorage.getItem('pref_email_notifications') !== 'false');
    setPushNotifications(user.pushNotificationsEnabled !== false);
    setLanguage(localStorage.getItem('pref_language') || 'English (US)');
    setTwoFactorEnabled(localStorage.getItem('pref_two_step') === 'true');
    
    // Theme sync
    const currentTheme = (document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light') as 'light' | 'dark';
    setTheme(currentTheme);
  }, [user]);

  const filledCount = [form.firstName, form.lastName, form.email, form.headline, form.bio, form.avatar].filter(
    (value) => value && value.trim()
  ).length;
  const completion = Math.round((filledCount / 6) * 100);

  const handleToggleTheme = (checked: boolean) => {
    const nextTheme = checked ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    addToast(`Theme switched to ${nextTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}.`, 'success');
  };

  const handleToggleEmail = (checked: boolean) => {
    setEmailNotifications(checked);
    localStorage.setItem('pref_email_notifications', checked ? 'true' : 'false');
    addToast(checked ? 'Email notifications enabled.' : 'Email notifications disabled.', 'success');
  };

  const handleTogglePush = async (checked: boolean) => {
    if (!user) return;
    setPushNotifications(checked);
    try {
      await updateUser(user.id, { pushNotificationsEnabled: checked });
      await refreshProfile();
      addToast(checked ? 'Push notifications enabled.' : 'Push notifications disabled.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update push notification setting', 'error');
    }
  };

  const handleToggleTwoFactor = (checked: boolean) => {
    setTwoFactorEnabled(checked);
    localStorage.setItem('pref_two_step', checked ? 'true' : 'false');
    addToast(checked ? 'Two-step verification enabled.' : 'Two-step verification disabled.', 'success');
  };

  const handleToggleLanguage = () => {
    const nextLang = language === 'English (US)' ? 'Spanish (ES)' : 'English (US)';
    setLanguage(nextLang);
    localStorage.setItem('pref_language', nextLang);
    addToast(`Preferred language set to ${nextLang}.`, 'success');
  };

  return (
    <StudentReferenceShell activeSidebar="settings">
      <div className="space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-[var(--text-heading)] md:text-[3.7rem]">Account Settings</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-text-main)]/80">
              Review your profile, update your bio, and manage your account preferences.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-brand-500/10 px-5 py-3 text-sm font-bold text-brand-500 shadow-sm border border-[var(--surface-border)]">
            <Sparkles className="h-4 w-4" />
            <span>{completion}% profile complete</span>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-8 shadow-sm">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_12px_30px_rgba(var(--brand-500-rgb,59,130,246),0.25)]">
                  <UserCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight text-[var(--text-heading)]">Profile Information</div>
                  <p className="mt-2 text-sm text-[var(--color-text-main)]/60">Update your public profile, headline, and bio.</p>
                </div>
              </div>

              <div className="flex flex-col gap-6 rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {form.avatar ? (
                      <img
                        src={form.avatar}
                        alt={user?.name || 'Avatar'}
                        className="h-20 w-20 rounded-[1.5rem] object-cover border border-[var(--surface-border)] shadow-md"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-tr from-brand-500 to-blue-400 text-3xl font-black text-white shadow-inner">
                        {user?.initials || 'JD'}
                      </div>
                    )}
                    <div>
                      <div className="text-xl font-bold text-[var(--text-heading)]">{user?.name || 'John Doe'}</div>
                      <div className="mt-1 text-sm text-[var(--color-text-main)]/60 uppercase tracking-wider font-semibold">{user?.role || 'STUDENT'}</div>
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Verified account
                  </div>
                </div>

                <div className="border-t border-[var(--surface-border)] pt-5">
                  <label className="block text-sm font-bold text-[var(--text-heading)] mb-2 pl-2">Profile Picture (Avatar URL)</label>
                  <div className="flex flex-col gap-4">
                    <input
                      type="url"
                      value={form.avatar}
                      onChange={(e) => setForm((current) => ({ ...current, avatar: e.target.value }))}
                      placeholder="Paste custom image URL..."
                      className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-5 py-4 text-base outline-none transition focus:border-brand-500 text-[var(--text-heading)]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-text-main)]/60 mb-2 pl-2">Or select from pre-made avatars:</div>
                      <div className="flex flex-wrap items-center gap-3">
                        {[
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
                        ].map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, avatar: url }))}
                            className={`relative h-11 w-11 rounded-full overflow-hidden border-2 transition ${form.avatar === url ? 'border-brand-500 scale-105 shadow-md' : 'border-transparent hover:border-brand-500/50'}`}
                          >
                            <img src={url} alt={`Preset Avatar ${i + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                        {form.avatar && (
                          <button
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, avatar: '' }))}
                            className="ml-auto px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition border border-rose-500/20"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <Field label="First Name">
                  <input value={form.firstName} onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))} className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-5 py-4 text-base outline-none transition focus:border-brand-500 text-[var(--text-heading)]" />
                </Field>
                <Field label="Last Name">
                  <input value={form.lastName} onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))} className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-5 py-4 text-base outline-none transition focus:border-brand-500 text-[var(--text-heading)]" />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Email Address">
                  <input value={form.email} disabled className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-5 py-4 text-base text-[var(--color-text-main)]/50 outline-none" />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Headline">
                  <input value={form.headline} onChange={(e) => setForm((current) => ({ ...current, headline: e.target.value }))} className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-5 py-4 text-base outline-none transition focus:border-brand-500 text-[var(--text-heading)]" />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Bio">
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))}
                    className="min-h-40 w-full rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-card)] px-5 py-4 text-base outline-none transition focus:border-brand-500 text-[var(--text-heading)]"
                  />
                </Field>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[var(--color-text-main)]/50">Changes are synced to your Academy profile.</div>
                <button
                  onClick={async () => {
                    if (!user) return;
                    setSaving(true);
                    try {
                      await updateUser(user.id, form);
                      await refreshProfile();
                      addToast('Profile updated successfully.', 'success');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Failed to update profile', 'error');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-full bg-brand-500 px-7 py-4 text-sm font-bold text-white shadow-[0_16px_35px_rgba(var(--brand-500-rgb,59,130,246),0.3)] transition hover:bg-brand-600 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <MiniCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Security"
                description="Password resets and active sessions stay protected with your account settings."
                action="Manage Security"
                onClick={() => setPasswordModalOpen(true)}
              />
              <MiniCard
                icon={<LifeBuoy className="h-5 w-5" />}
                title="Support"
                description="Create a support ticket anytime if you run into profile or account issues."
                action="Open Support"
                onClick={() => router.push('/dashboard/student/support')}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-8 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight text-[var(--text-heading)]">Preferences</h2>
              <p className="mt-2 text-sm text-[var(--color-text-main)]/60">Manage how Academy communicates with you.</p>

              <div className="mt-6 space-y-4">
                <SettingRow 
                  icon={<Bell className="h-4 w-4" />} 
                  title="Email notifications" 
                  helper={emailNotifications ? 'Receiving updates' : 'Muted'} 
                  checked={emailNotifications}
                  onChange={handleToggleEmail}
                />
                <SettingRow 
                  icon={<Bell className="h-4 w-4" />} 
                  title="Push notifications" 
                  helper={pushNotifications ? 'Receiving push notifications' : 'Muted'} 
                  checked={pushNotifications}
                  onChange={handleTogglePush}
                />
                <SettingRow 
                  icon={<Globe className="h-4 w-4" />} 
                  title="Language" 
                  helper={language} 
                  checked={true}
                  onChange={handleToggleLanguage}
                />
                <SettingRow 
                  icon={<Palette className="h-4 w-4" />} 
                  title="Interface theme" 
                  helper={theme === 'dark' ? 'Dark mode' : 'Light mode'} 
                  checked={theme === 'dark'}
                  onChange={handleToggleTheme}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-8 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight text-[var(--text-heading)]">Security</h2>
              <div className="mt-6 space-y-4">
                <ActionRow 
                  icon={<LockKeyhole className="h-4 w-4" />} 
                  title="Change password" 
                  description="Update your current password anytime." 
                  onClick={() => setPasswordModalOpen(true)}
                />
                <SettingRow 
                  icon={<ShieldCheck className="h-4 w-4" />} 
                  title="Two-step verification" 
                  helper={twoFactorEnabled ? 'Enabled (OTP Required)' : 'Disabled'} 
                  checked={twoFactorEnabled}
                  onChange={handleToggleTwoFactor}
                />
                <ActionRow 
                  icon={<ArrowRight className="h-4 w-4" />} 
                  title="Active sessions" 
                  description="Review where your account is currently signed in." 
                  onClick={() => setSessionsModalOpen(true)}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-rose-500/20 bg-rose-500/5 p-8 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">Danger Zone</div>
              <div className="mt-3 text-2xl font-black tracking-tight text-[var(--text-heading)]">Close your account</div>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-main)]/70">
                This area is reserved for irreversible operations such as account deletion, export, or deactivation.
              </p>
              <button 
                onClick={() => setDangerModalOpen(true)}
                className="mt-6 rounded-full border border-rose-500/40 px-5 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 transition hover:bg-rose-500/10"
              >
                Request Account Removal
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] border border-[var(--surface-border)] bg-[var(--surface-card)] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--text-heading)]">Change Password</h3>
                <p className="text-xs text-[var(--color-text-main)]/50">Secure your account with a new password.</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                addToast("Passwords do not match.", "error");
                return;
              }
              if (passwordForm.newPassword.length < 8) {
                addToast("Password must be at least 8 characters long.", "error");
                return;
              }
              setUpdatingPassword(true);
              try {
                await updateUser(user!.id, { password: passwordForm.newPassword });
                addToast("Password updated successfully.", "success");
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordModalOpen(false);
              } catch (error) {
                addToast(error instanceof Error ? error.message : "Failed to change password", "error");
              } finally {
                setUpdatingPassword(false);
              }
            }} className="space-y-4">
              <Field label="Current Password">
                <input 
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 text-[var(--text-heading)]" 
                />
              </Field>
              <Field label="New Password">
                <input 
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 text-[var(--text-heading)]" 
                />
              </Field>
              <Field label="Confirm New Password">
                <input 
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 text-[var(--text-heading)]" 
                />
              </Field>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="rounded-full px-5 py-3 text-xs font-bold text-[var(--color-text-main)]/50 hover:bg-[var(--surface-card-soft)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="rounded-full bg-brand-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-600 transition disabled:opacity-60"
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {sessionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] border border-[var(--surface-border)] bg-[var(--surface-card)] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-[var(--text-heading)]">Active Sessions</h3>
            <p className="text-xs text-[var(--color-text-main)]/50">Review where you are currently signed in.</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--surface-card-soft)] rounded-2xl border border-[var(--surface-border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text-heading)]">Chrome on Linux (This device)</div>
                  <div className="text-[10px] text-[var(--color-text-main)]/60 mt-0.5">India • Active now</div>
                </div>
                <span className="text-[10px] bg-emerald-550/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 rounded-full border border-emerald-500/20">Current</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--surface-card-soft)] rounded-2xl border border-[var(--surface-border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text-heading)]">Safari on iPhone 15</div>
                  <div className="text-[10px] text-[var(--color-text-main)]/60 mt-0.5">India • 2 hours ago</div>
                </div>
                <button
                  type="button"
                  onClick={() => addToast("Session revoked successfully.", "success")}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold"
                >
                  Revoke
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSessionsModalOpen(false)}
                className="rounded-full bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone Confirmation Modal */}
      {dangerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] border border-red-500/20 bg-[var(--surface-card)] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-red-500">Remove Account</h3>
            <p className="mt-3 text-sm text-[var(--color-text-main)]/80 leading-relaxed">
              Are you sure you want to request account removal? This operation is irreversible and all your learning progress, certificates, and settings will be permanently lost.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDangerModalOpen(false)}
                className="rounded-full px-5 py-3 text-xs font-bold text-[var(--color-text-main)]/50 hover:bg-[var(--surface-card-soft)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  addToast("Account removal request submitted successfully.", "success");
                  setDangerModalOpen(false);
                  await signOut();
                  router.push('/');
                }}
                className="rounded-full bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentReferenceShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-text-main)]/50">{label}</div>
      {children}
    </label>
  );
}

function MiniCard({ 
  icon, 
  title, 
  description, 
  action, 
  onClick 
}: { 
  icon: ReactNode; 
  title: string; 
  description: string; 
  action: string; 
  onClick?: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">{icon}</div>
        <button type="button" onClick={onClick} className="text-sm font-bold text-brand-500 hover:text-brand-600 transition">{action}</button>
      </div>
      <div className="mt-5 text-2xl font-black tracking-tight text-[var(--text-heading)]">{title}</div>
      <p className="mt-3 text-sm leading-7 text-[var(--color-text-main)]/70">{description}</p>
    </div>
  );
}

function SettingRow({ 
  icon, 
  title, 
  helper, 
  checked = false, 
  onChange 
}: { 
  icon: ReactNode; 
  title: string; 
  helper: string; 
  checked?: boolean; 
  onChange?: (checked: boolean) => void; 
}) {
  return (
    <div className="flex items-center justify-between rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-5 py-4 transition hover:bg-[var(--surface-card)]">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-card)] text-brand-500 shadow-sm border border-[var(--surface-border)]">{icon}</div>
        <div>
          <div className="text-sm font-bold text-[var(--text-heading)]">{title}</div>
          <div className="text-sm text-[var(--color-text-main)]/60">{helper}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange?.(!checked)}
        className={`h-6 w-11 rounded-full p-1 transition-colors ${checked ? 'bg-brand-500' : 'bg-[var(--surface-border)]'}`}
      >
        <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function ActionRow({ 
  icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: ReactNode; 
  title: string; 
  description: string; 
  onClick?: () => void; 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-5 py-4 transition hover:bg-[var(--surface-card)] hover:border-brand-500/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-card)] text-brand-500 shadow-sm border border-[var(--surface-border)]">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[var(--text-heading)]">{title}</div>
          <div className="text-xs text-[var(--color-text-main)]/60 mt-0.5 truncate">{description}</div>
        </div>
      </div>
    </button>
  );
}
