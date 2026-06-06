'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Bell, Globe, LifeBuoy, LockKeyhole, Palette, ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react';
import { StudentReferenceShell } from '@/components/StudentReferenceShell';
import { updateUser } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { useToast } from '@/contexts/ToastContext';

export default function Settings() {
  const { user, refreshProfile } = useProtectedPage();
  const { addToast } = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', headline: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      headline: user.headline || '',
      bio: user.bio || '',
    });
  }, [user]);

  const completion = Math.min(
    100,
    [form.firstName, form.lastName, form.email, form.headline, form.bio].filter((value) => value.trim()).length * 20,
  );

  return (
    <StudentReferenceShell activeSidebar="settings">
      <div className="space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 md:text-[3.7rem]">Account Settings</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Review your profile, update your bio, and manage your account preferences.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-indigo-100 px-5 py-3 text-sm font-medium text-indigo-900 shadow-sm">
            <Sparkles className="h-4 w-4" />
            <span>{completion}% profile complete</span>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)]">
                  <UserCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-3xl font-bold tracking-tight text-slate-950">Profile Information</div>
                  <p className="mt-2 text-sm text-slate-500">Update your public profile, headline, and bio.</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-tr from-indigo-500 to-blue-400 text-3xl font-black text-white shadow-inner">
                    {user?.initials || 'JD'}
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-slate-950">{user?.name || 'John Doe'}</div>
                    <div className="mt-1 text-sm text-slate-500">{user?.role || 'STUDENT'}</div>
                  </div>
                </div>
                <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                  Verified account
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <Field label="First Name">
                  <input value={form.firstName} onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base outline-none transition focus:border-indigo-500" />
                </Field>
                <Field label="Last Name">
                  <input value={form.lastName} onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base outline-none transition focus:border-indigo-500" />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Email Address">
                  <input value={form.email} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4 text-base text-slate-500 outline-none" />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Headline">
                  <input value={form.headline} onChange={(e) => setForm((current) => ({ ...current, headline: e.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base outline-none transition focus:border-indigo-500" />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Bio">
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))}
                    className="min-h-40 w-full rounded-[28px] border border-slate-300 bg-white px-5 py-4 text-base outline-none transition focus:border-indigo-500"
                  />
                </Field>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">Changes are synced to your Academy profile.</div>
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
                  className="rounded-full bg-indigo-600 px-7 py-4 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(79,70,229,0.3)] transition hover:bg-indigo-700 disabled:opacity-60"
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
              />
              <MiniCard
                icon={<LifeBuoy className="h-5 w-5" />}
                title="Support"
                description="Create a support ticket anytime if you run into profile or account issues."
                action="Open Support"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Preferences</h2>
              <p className="mt-2 text-sm text-slate-500">Manage how Academy communicates with you.</p>

              <div className="mt-6 space-y-4">
                <SettingRow icon={<Bell className="h-4 w-4" />} title="Email notifications" helper="Receive learning updates and announcements." />
                <SettingRow icon={<Globe className="h-4 w-4" />} title="Language" helper="English (US)" />
                <SettingRow icon={<Palette className="h-4 w-4" />} title="Interface theme" helper="Light mode" />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Security</h2>
              <div className="mt-6 space-y-4">
                <ActionRow icon={<LockKeyhole className="h-4 w-4" />} title="Change password" description="Update your current password anytime." />
                <ActionRow icon={<ShieldCheck className="h-4 w-4" />} title="Two-step verification" description="Admin login can use OTP during testing." />
                <ActionRow icon={<ArrowRight className="h-4 w-4" />} title="Active sessions" description="Review where your account is currently signed in." />
              </div>
            </div>

            <div className="rounded-[32px] border border-rose-200 bg-rose-50/70 p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Danger Zone</div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Close your account</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This area is reserved for irreversible operations such as account deletion, export, or deactivation.
              </p>
              <button className="mt-6 rounded-full border border-rose-400 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                Request Account Removal
              </button>
            </div>
          </div>
        </section>
      </div>
    </StudentReferenceShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      {children}
    </label>
  );
}

function MiniCard({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">{icon}</div>
        <button className="text-sm font-semibold text-indigo-600">{action}</button>
      </div>
      <div className="mt-5 text-2xl font-bold tracking-tight text-slate-950">{title}</div>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function SettingRow({ icon, title, helper }: { icon: ReactNode; title: string; helper: string }) {
  return (
    <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          <div className="text-sm text-slate-500">{helper}</div>
        </div>
      </div>
      <div className="h-6 w-11 rounded-full bg-indigo-600 p-1">
        <div className="h-4 w-4 rounded-full bg-white" />
      </div>
    </div>
  );
}

function ActionRow({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          <div className="text-sm text-slate-500">{description}</div>
        </div>
      </div>
    </div>
  );
}
