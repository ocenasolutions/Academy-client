'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
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

  const role = user?.role.toLowerCase() as 'student' | 'instructor' | 'admin' | undefined;

  return (
    <DashboardLayout role={role || 'student'}>
      <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)] mb-10">Account Settings</h1>

      <div className="clay max-w-3xl overflow-hidden">
        <div className="p-8 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-2">Profile Information</h2>
          <p className="font-bold text-[var(--color-text-main)]/60">Update your account profile, headline, and bio.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center gap-8 bg-[var(--glass-bg)] p-6 rounded-3xl border border-[var(--glass-border)]">
            <div className="w-24 h-24 bg-gradient-to-tr from-brand-400 to-indigo-500 text-white rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-inner relative overflow-hidden">
              <span className="relative z-10">{user?.initials || 'JD'}</span>
              <div className="absolute inset-0 bg-[var(--glass-bg)] backdrop-blur-sm"></div>
            </div>
            <div>
              <div className="font-black text-[var(--color-text-heading)]">{user?.name}</div>
              <div className="text-sm text-[var(--color-text-main)]/60">{user?.role}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-3 pl-2">First Name</label>
              <input type="text" className="w-full clay-input" value={form.firstName} onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-3 pl-2">Last Name</label>
              <input type="text" className="w-full clay-input" value={form.lastName} onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-3 pl-2">Email</label>
            <input type="email" className="w-full clay-input" value={form.email} disabled />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-3 pl-2">Headline</label>
            <input type="text" className="w-full clay-input" value={form.headline} onChange={(e) => setForm((current) => ({ ...current, headline: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-3 pl-2">Bio</label>
            <textarea className="w-full clay-input min-h-32" value={form.bio} onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))} />
          </div>

          <div className="pt-6 flex justify-end">
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
              className="clay-btn px-8 py-4 rounded-2xl font-black text-lg disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
