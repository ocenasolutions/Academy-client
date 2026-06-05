import { DashboardLayout } from '../components/DashboardLayout';
import { Construction } from 'lucide-react';

export function DashboardPlaceholder({ role, pageName }: { role: 'student' | 'instructor' | 'admin', pageName: string }) {
  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-brand-500/10 rounded-full flex items-center justify-center mb-6 clay shadow-inner">
          <Construction className="w-12 h-12 text-brand-500" />
        </div>
        <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)] mb-4">Under Construction</h1>
        <p className="text-[var(--color-text-main)]/70 font-medium max-w-md mx-auto mb-8">
          The <span className="font-bold text-brand-600">{pageName}</span> page is currently being built. Check back soon!
        </p>
      </div>
    </DashboardLayout>
  );
}
