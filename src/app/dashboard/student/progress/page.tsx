'use client';

import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ArrowUpRight, Award, Target } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getMyEnrollments } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Enrollment } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function StudentProgress() {
  const { addToast } = useToast();
  const { user } = useProtectedPage(['STUDENT']);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

  useEffect(() => {
    if (!user) return;
    getMyEnrollments().then(setEnrollments);
  }, [user]);

  const categoryData = useMemo(() => {
    const byCategory = new Map<string, { subject: string; total: number; count: number }>();
    enrollments.forEach((enrollment) => {
      const existing = byCategory.get(enrollment.course.category) || { subject: enrollment.course.category, total: 0, count: 0 };
      existing.total += enrollment.progressPercent;
      existing.count += 1;
      byCategory.set(enrollment.course.category, existing);
    });
    return Array.from(byCategory.values()).map((item) => ({
      subject: item.subject,
      A: Math.round(item.total / item.count),
      fullMark: 100,
    }));
  }, [enrollments]);

  const courseProgressData = enrollments.map((enrollment, index) => ({
    name: enrollment.course.title.length > 16 ? `${enrollment.course.title.slice(0, 16)}…` : enrollment.course.title,
    progress: Math.round(enrollment.progressPercent),
    fill: ['var(--brand-500)', '#10b981', '#8b5cf6', '#f59e0b'][index % 4],
  }));

  return (
    <DashboardLayout role="student">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)] mb-2">Course Progress</h1>
          <p className="text-[var(--color-text-main)]/70 font-medium">Track your live learning journey across enrolled categories and courses.</p>
        </div>
        <button onClick={() => addToast('Progress sharing can be connected to certificates and public profiles next.', 'info')} className="clay-btn !py-2.5 !px-6 flex items-center gap-2">
          Share Progress <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="clay p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] flex items-center gap-2">
              <Target className="w-6 h-6 text-brand-500" /> Category Progress
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setChartType('radar')} className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${chartType === 'radar' ? 'bg-brand-500 text-white' : 'bg-[var(--glass-bg)] text-[var(--color-text-main)]/60 hover:bg-white'}`}>Radar</button>
              <button onClick={() => setChartType('bar')} className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${chartType === 'bar' ? 'bg-brand-500 text-white' : 'bg-[var(--glass-bg)] text-[var(--color-text-main)]/60 hover:bg-white'}`}>Bar</button>
            </div>
          </div>

          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'radar' ? (
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                  <PolarGrid stroke="rgba(0,0,0,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-main)', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--color-text-main)', opacity: 0.5 }} />
                  <Radar name="Proficiency" dataKey="A" stroke="var(--brand-500)" fill="var(--brand-500)" fillOpacity={0.6} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)' }} itemStyle={{ color: 'var(--color-text-heading)', fontWeight: 'bold' }} />
                </RadarChart>
              ) : (
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-main)', opacity: 0.7 }} />
                  <YAxis type="category" dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-main)', fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)' }} itemStyle={{ color: 'var(--color-text-heading)', fontWeight: 'bold' }} />
                  <Bar dataKey="A" name="Proficiency" fill="var(--brand-500)" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clay p-8 flex flex-col">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-8 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-500" /> Top Courses Progress
          </h2>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseProgressData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-main)', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fill: 'var(--color-text-main)', opacity: 0.7 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)' }} itemStyle={{ color: 'var(--color-text-heading)', fontWeight: 'bold' }} formatter={(value) => [`${value}%`, 'Completed']} />
                <Bar dataKey="progress" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
