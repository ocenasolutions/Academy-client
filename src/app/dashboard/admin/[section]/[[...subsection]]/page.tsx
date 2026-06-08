'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, FolderKanban, Plus, Save } from 'lucide-react';
import { AiCourseStudio } from '@/components/AiCourseStudio';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import { formatINRFromPaise } from '@/lib/currency';
import { getAdminSection, getAdminSectionLandingHref, getAdminSubpage } from '@/lib/admin';
import {
  approveAdminPayout,
  approveCourse,
  approveInstructor,
  completeAdminEnrollment,
  createAdminEnrollment,
  createAdminCategory,
  createAdminCoupon,
  createAdminNotification,
  deleteAdminEnrollment,
  deleteAdminCategory,
  enforceAdminReportAction,
  getAdminAiGenerations,
  getAdminAuditLogs,
  getAdminCategories,
  getAdminCertificates,
  getAdminCourseDetail,
  getAdminCoupons,
  getAdminCourses,
  getAdminEnrollments,
  getAdminInstructors,
  getAdminNotifications,
  getAdminPayments,
  getAdminPayouts,
  getAdminReports,
  getAdminReviews,
  getAdminSettings,
  getAdminTickets,
  getAdminUserDetail,
  getAdminUsers,
  getPlatformAnalytics,
  markAdminPayoutPaid,
  refundAdminPayment,
  revokeAdminCertificate,
  rejectCourse,
  rejectInstructor,
  resetAdminUserPassword,
  retryAdminAiGeneration,
  suspendInstructor,
  updateAdminCategory,
  updateAdminCoupon,
  updateAdminCourse,
  updateAdminReport,
  updateAdminReview,
  updateAdminSetting,
  updateAdminTicket,
  updateAdminUser,
  verifyInstructorDocuments,
  verifyAdminCertificate,
} from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { PlatformAnalytics } from '@/types';

type Row = {
  id: string;
  raw: any;
  title: string;
  description: string;
  meta: string[];
  actions?: Array<{ id: string; label: string; tone: 'neutral' | 'success' | 'danger' }>;
};

export default function AdminSectionPage() {
  useProtectedPage(['ADMIN']);
  const params = useParams<{ section: string; subsection?: string[] }>();
  const router = useRouter();
  const { addToast } = useToast();
  const section = getAdminSection(params.section);
  const subsectionSlug = params.subsection?.[0];
  const subsection = subsectionSlug ? getAdminSubpage(section?.slug, subsectionSlug) : null;
  const landingHref = getAdminSectionLandingHref(section?.slug);
  const shouldRedirectToLanding = Boolean(section && section.slug !== 'ai-course-builder' && section.subpages.length > 0 && !subsectionSlug);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [adminAssignees, setAdminAssignees] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [settingsDrafts, setSettingsDrafts] = useState<Record<string, string>>({});
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [ticketAssignments, setTicketAssignments] = useState<Record<string, string>>({});
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [auditSearch, setAuditSearch] = useState('');
  const [userEdits, setUserEdits] = useState<Record<string, { role: string; status: string }>>({});
  const [categoryEdits, setCategoryEdits] = useState<Record<string, { name: string; slug: string; description: string }>>({});
  const [couponEdits, setCouponEdits] = useState<Record<string, { code: string; name: string; type: string; amount: string; usageLimit: string; isActive: boolean }>>({});
  const [enrollmentForm, setEnrollmentForm] = useState({ userId: '', courseId: '' });
  const [certificateTemplateDraft, setCertificateTemplateDraft] = useState('{\n  "title": "Certificate of Completion",\n  "signatureName": "Academy Admin"\n}');
  const [certificateLookup, setCertificateLookup] = useState('');
  const [verifiedCertificate, setVerifiedCertificate] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '' });
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE',
    amount: '10',
    usageLimit: '',
    courseId: '',
    categoryId: '',
    expiresAt: '',
  });
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    channel: 'IN_APP',
    audienceRole: '',
  });

  if (!section || section.slug === 'dashboard') {
    return (
      <DashboardLayout role="admin">
        <div className="clay p-8 text-lg font-medium text-[var(--color-text-main)]/75">
          That admin section does not exist.
        </div>
      </DashboardLayout>
    );
  }

  const activeTitle = subsection ? subsection.title : section.title;
  const activeDescription = subsection ? subsection.description : section.description;
  const operationalView = subsection || section.subpages.length === 0 || section.slug === 'ai-course-builder';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (shouldRedirectToLanding) {
        return;
      }
      setLoading(true);
      try {
        const nextRows = await loadSectionRows(section.slug, subsectionSlug);
        if (!cancelled) {
          setRows(nextRows);
          hydrateDrafts(nextRows, section.slug);
        }
      } catch (error) {
        if (!cancelled) {
          addToast(error instanceof Error ? error.message : 'Unable to load admin section', 'error');
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [addToast, section.slug, subsectionSlug, shouldRedirectToLanding]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupportingState() {
      if (shouldRedirectToLanding) {
        return;
      }
      if (section.slug === 'analytics') {
        setAnalyticsLoading(true);
        try {
          const nextAnalytics = await getPlatformAnalytics();
          if (!cancelled) {
            setAnalytics(nextAnalytics);
          }
        } catch (error) {
          if (!cancelled) {
            addToast(error instanceof Error ? error.message : 'Unable to load analytics', 'error');
            setAnalytics(null);
          }
        } finally {
          if (!cancelled) {
            setAnalyticsLoading(false);
          }
        }
      } else {
        setAnalytics(null);
      }

      if (section.slug === 'support') {
        try {
          const admins = await getAdminUsers({ role: 'ADMIN' });
          if (!cancelled) {
            setAdminAssignees(
              admins.map((admin) => ({
                id: admin.id,
                name: `${admin.firstName} ${admin.lastName}`.trim() || admin.email,
                email: admin.email,
              })),
            );
          }
        } catch (error) {
          if (!cancelled) {
            addToast(error instanceof Error ? error.message : 'Unable to load admin assignees', 'error');
            setAdminAssignees([]);
          }
        }
      } else {
        setAdminAssignees([]);
      }

      if (section.slug === 'certificates' && subsectionSlug === 'templates') {
        try {
          const settings = await getAdminSettings();
          if (!cancelled) {
            setSettingsDrafts((current) => ({
              ...current,
              ...Object.fromEntries(settings.map((setting) => [setting.key, JSON.stringify(setting.value, null, 2)])),
              general: current.general ?? JSON.stringify(defaultStructuredSettings.general, null, 2),
              payments: current.payments ?? JSON.stringify(defaultStructuredSettings.payments, null, 2),
              ai: current.ai ?? JSON.stringify(defaultStructuredSettings.ai, null, 2),
              email: current.email ?? JSON.stringify(defaultStructuredSettings.email, null, 2),
              seo: current.seo ?? JSON.stringify(defaultStructuredSettings.seo, null, 2),
              security: current.security ?? JSON.stringify(defaultStructuredSettings.security, null, 2),
              certificateTemplate: current.certificateTemplate ?? JSON.stringify(defaultStructuredSettings.certificateTemplate, null, 2),
              certificateRules: current.certificateRules ?? JSON.stringify(defaultStructuredSettings.certificateRules, null, 2),
              categorySubcategories: current.categorySubcategories ?? JSON.stringify(defaultStructuredSettings.categorySubcategories, null, 2),
              categoryTags: current.categoryTags ?? JSON.stringify(defaultStructuredSettings.categoryTags, null, 2),
              categoryPresentation: current.categoryPresentation ?? JSON.stringify(defaultStructuredSettings.categoryPresentation, null, 2),
            }));
          }
          const template = settings.find((setting) => setting.key === 'certificateTemplate');
          if (!cancelled && template) {
            setCertificateTemplateDraft(JSON.stringify(template.value, null, 2));
          }
        } catch (error) {
          if (!cancelled) {
            addToast(error instanceof Error ? error.message : 'Unable to load certificate template', 'error');
          }
        }
      } else {
        setVerifiedCertificate(null);
        setCertificateLookup('');
      }

      if (section.slug === 'settings' || section.slug === 'categories' || section.slug === 'certificates') {
        try {
          const settings = await getAdminSettings();
          if (!cancelled) {
            setSettingsDrafts((current) => ({
              ...current,
              ...Object.fromEntries(settings.map((setting) => [setting.key, JSON.stringify(setting.value, null, 2)])),
              general: current.general ?? JSON.stringify(defaultStructuredSettings.general, null, 2),
              payments: current.payments ?? JSON.stringify(defaultStructuredSettings.payments, null, 2),
              ai: current.ai ?? JSON.stringify(defaultStructuredSettings.ai, null, 2),
              email: current.email ?? JSON.stringify(defaultStructuredSettings.email, null, 2),
              seo: current.seo ?? JSON.stringify(defaultStructuredSettings.seo, null, 2),
              security: current.security ?? JSON.stringify(defaultStructuredSettings.security, null, 2),
              certificateTemplate: current.certificateTemplate ?? JSON.stringify(defaultStructuredSettings.certificateTemplate, null, 2),
              certificateRules: current.certificateRules ?? JSON.stringify(defaultStructuredSettings.certificateRules, null, 2),
              categorySubcategories: current.categorySubcategories ?? JSON.stringify(defaultStructuredSettings.categorySubcategories, null, 2),
              categoryTags: current.categoryTags ?? JSON.stringify(defaultStructuredSettings.categoryTags, null, 2),
              categoryPresentation: current.categoryPresentation ?? JSON.stringify(defaultStructuredSettings.categoryPresentation, null, 2),
            }));
          }
        } catch (error) {
          if (!cancelled) {
            addToast(error instanceof Error ? error.message : 'Unable to load settings metadata', 'error');
          }
        }
      }
    }

    loadSupportingState();
    return () => {
      cancelled = true;
    };
  }, [addToast, section.slug, subsectionSlug, shouldRedirectToLanding]);

  useEffect(() => {
    if (shouldRedirectToLanding) {
      router.replace(landingHref);
    }
  }, [landingHref, router, shouldRedirectToLanding]);

  function hydrateDrafts(nextRows: Row[], sectionSlug: string) {
    if (sectionSlug === 'settings') {
      setSettingsDrafts(Object.fromEntries(nextRows.map((row) => [row.raw.key, JSON.stringify(row.raw.value, null, 2)])));
    }
    if (sectionSlug === 'support') {
      setTicketAssignments(Object.fromEntries(nextRows.map((row) => [row.id, row.raw.assignedToId || ''])));
    }
    if (sectionSlug === 'users') {
      setUserEdits(Object.fromEntries(nextRows.map((row) => [row.id, { role: row.raw.role, status: row.raw.status }])));
    }
    if (sectionSlug === 'categories') {
      setCategoryEdits(Object.fromEntries(nextRows.map((row) => [row.id, {
        name: row.raw.name,
        slug: row.raw.slug,
        description: row.raw.description || '',
      }])));
    }
    if (sectionSlug === 'coupons') {
      setCouponEdits(Object.fromEntries(nextRows.map((row) => [row.id, {
        code: row.raw.code,
        name: row.raw.name,
        type: row.raw.type,
        amount: String(row.raw.amount ?? ''),
        usageLimit: row.raw.usageLimit ? String(row.raw.usageLimit) : '',
        isActive: Boolean(row.raw.isActive),
      }])));
    }
  }

  async function refresh() {
    const nextRows = await loadSectionRows(section.slug, subsectionSlug);
    setRows(nextRows);
    hydrateDrafts(nextRows, section.slug);
  }

  function shouldKeepRowInCurrentFilter(sectionSlug: string, subsection?: string, raw?: any) {
    if (!raw) return true;

    if (sectionSlug === 'courses') {
      const statusMap: Record<string, string | undefined> = {
        'pending-approval': 'IN_REVIEW',
        published: 'PUBLISHED',
        drafts: 'DRAFT',
        rejected: 'ARCHIVED',
      };
      const expectedStatus = statusMap[subsection ?? ''];
      if (expectedStatus) {
        return raw.status === expectedStatus;
      }
      if (subsection === 'featured') {
        return Boolean(raw.isFeatured);
      }
      return true;
    }

    if (sectionSlug === 'instructors') {
      const statusMap: Record<string, string | undefined> = {
        'pending-requests': 'PENDING',
        approved: 'ACTIVE',
        rejected: 'SUSPENDED',
      };
      const expectedStatus = statusMap[subsection ?? ''];
      return expectedStatus ? raw.status === expectedStatus : true;
    }

    return true;
  }

  function applyRowUpdateToCurrentView(rowId: string, updater: (raw: any) => any) {
    setRows((current) =>
      current
        .map((row) => {
          if (row.id !== rowId) {
            return row;
          }

          const nextRaw = updater(row.raw);
          const nextRow = {
            ...row,
            raw: nextRaw,
            meta: updateRowMeta(section.slug, nextRaw, row.meta),
          };

          return nextRow;
        })
        .filter((row) => shouldKeepRowInCurrentFilter(section.slug, subsectionSlug, row.raw)),
    );
  }

  function getCourseEditorHref(courseId: string) {
    return `/dashboard/admin/courses/edit/${courseId}`;
  }

  function updateRowMeta(sectionSlug: string, raw: any, fallback: string[]) {
    if (sectionSlug === 'courses') {
      return [
        raw.status,
        raw.category?.name || 'No category',
        formatINRFromPaise(raw.priceCents ?? 0),
        `${raw._count?.enrollments ?? 0} students`,
      ];
    }

    if (sectionSlug === 'instructors') {
      return [raw.status, `${raw.instructorCourses?.length ?? 0} courses`];
    }

    return fallback;
  }

  async function handleInspect(row: Row) {
    setDetailLoading(true);
    try {
      if (section.slug === 'users' || section.slug === 'instructors') {
        setDetail(await getAdminUserDetail(row.id));
      } else if (section.slug === 'courses') {
        setDetail(await getAdminCourseDetail(row.id));
      } else {
        setDetail(row.raw);
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load detail', 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAction(row: Row, action: string) {
    setBusyId(`${action}:${row.id}`);
    try {
      if (action === 'save_user') {
        await updateAdminUser(row.id, userEdits[row.id]);
      } else if (action === 'activate_user') {
        await updateAdminUser(row.id, { status: 'ACTIVE' });
      } else if (action === 'suspend_user') {
        await updateAdminUser(row.id, { status: 'SUSPENDED' });
      } else if (action === 'reset_password') {
        const result = await resetAdminUserPassword(row.id);
        addToast(`Temporary password: ${result.temporaryPassword}`, 'info');
      } else if (action === 'approve_instructor') {
        await approveInstructor(row.id);
        applyRowUpdateToCurrentView(row.id, (raw) => ({ ...raw, status: 'ACTIVE' }));
      } else if (action === 'reject_instructor') {
        await rejectInstructor(row.id);
        applyRowUpdateToCurrentView(row.id, (raw) => ({ ...raw, status: 'SUSPENDED' }));
      } else if (action === 'suspend_instructor') {
        await suspendInstructor(row.id);
        applyRowUpdateToCurrentView(row.id, (raw) => ({ ...raw, status: 'SUSPENDED' }));
      } else if (action === 'verify_instructor_docs') {
        await verifyInstructorDocuments(row.id, 'Verified from admin panel');
      } else if (action === 'approve_course') {
        await approveCourse(row.id);
        applyRowUpdateToCurrentView(row.id, (raw) => ({ ...raw, status: 'PUBLISHED' }));
      } else if (action === 'edit_course') {
        router.push(getCourseEditorHref(row.id));
      } else if (action === 'reject_course') {
        await rejectCourse(row.id, 'Rejected from admin panel');
        applyRowUpdateToCurrentView(row.id, (raw) => ({ ...raw, status: 'ARCHIVED' }));
      } else if (action === 'feature_course') {
        await updateAdminCourse(row.id, { isFeatured: !row.raw.isFeatured });
        applyRowUpdateToCurrentView(row.id, (raw) => ({ ...raw, isFeatured: !raw.isFeatured }));
      } else if (action === 'refund_payment') {
        await refundAdminPayment(row.id);
      } else if (action === 'approve_payout') {
        await approveAdminPayout(row.id);
      } else if (action === 'mark_payout_paid') {
        await markAdminPayoutPaid(row.id);
      } else if (action === 'review_report') {
        await updateAdminReport(row.id, {
          status: 'REVIEWED',
          resolutionNote: reportNotes[row.id] || 'Reviewed from admin panel',
        });
      } else if (action === 'dismiss_report') {
        await updateAdminReport(row.id, {
          status: 'DISMISSED',
          resolutionNote: reportNotes[row.id] || 'Dismissed from admin panel',
        });
      } else if (action === 'progress_ticket') {
        await updateAdminTicket(row.id, {
          status: 'IN_PROGRESS',
          assignedToId: ticketAssignments[row.id] || undefined,
          reply: ticketReplies[row.id] || undefined,
        });
        setTicketReplies((current) => ({ ...current, [row.id]: '' }));
      } else if (action === 'resolve_ticket') {
        await updateAdminTicket(row.id, {
          status: 'RESOLVED',
          assignedToId: ticketAssignments[row.id] || undefined,
          reply: ticketReplies[row.id] || undefined,
        });
        setTicketReplies((current) => ({ ...current, [row.id]: '' }));
      } else if (action === 'assign_ticket') {
        await updateAdminTicket(row.id, {
          assignedToId: ticketAssignments[row.id],
        });
      } else if (action === 'save_setting') {
        await updateAdminSetting(row.raw.key, JSON.parse(settingsDrafts[row.raw.key] || 'null'));
      } else if (action === 'save_category') {
        const next = categoryEdits[row.id];
        await updateAdminCategory(row.id, next);
      } else if (action === 'delete_category') {
        await deleteAdminCategory(row.id);
      } else if (action === 'save_coupon') {
        const next = couponEdits[row.id];
        await updateAdminCoupon(row.id, {
          code: next.code,
          name: next.name,
          type: next.type,
          amount: Number(next.amount),
          usageLimit: next.usageLimit ? Number(next.usageLimit) : undefined,
          isActive: next.isActive,
        });
      } else if (action === 'revoke_certificate') {
        await revokeAdminCertificate(row.id);
      } else if (action === 'complete_enrollment') {
        await completeAdminEnrollment(row.id);
      } else if (action === 'delete_enrollment') {
        await deleteAdminEnrollment(row.id);
      } else if (action === 'approve_review') {
        await updateAdminReview(row.id, { status: 'APPROVED' });
      } else if (action === 'reject_review') {
        await updateAdminReview(row.id, { status: 'REJECTED' });
      } else if (action === 'retry_ai_generation') {
        await retryAdminAiGeneration(row.id);
      } else if (action === 'warn_user' || action === 'suspend_reported_user' || action === 'restore_reported_user' || action === 'archive_reported_course' || action === 'restore_reported_course' || action === 'hide_reported_review' || action === 'restore_reported_review') {
        const actionMap: Record<string, string> = {
          warn_user: 'WARN_USER',
          suspend_reported_user: 'SUSPEND_USER',
          restore_reported_user: 'RESTORE_USER',
          archive_reported_course: 'ARCHIVE_COURSE',
          restore_reported_course: 'RESTORE_COURSE',
          hide_reported_lesson: 'HIDE_LESSON',
          restore_reported_lesson: 'RESTORE_LESSON',
          hide_reported_review: 'HIDE_REVIEW',
          restore_reported_review: 'RESTORE_REVIEW',
        };
        await enforceAdminReportAction(row.id, {
          action: actionMap[action],
          resolutionNote: reportNotes[row.id] || undefined,
        });
      }

      addToast('Admin action completed.', 'success');
      await refresh();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Admin action failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateEnrollment(event: FormEvent) {
    event.preventDefault();
    setBusyId('create_enrollment');
    try {
      await createAdminEnrollment(enrollmentForm);
      setEnrollmentForm({ userId: '', courseId: '' });
      addToast('Enrollment created.', 'success');
      await refresh();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create enrollment', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateCategory(event: FormEvent) {
    event.preventDefault();
    setBusyId('create_category');
    try {
      await createAdminCategory(categoryForm);
      setCategoryForm({ name: '', slug: '', description: '' });
      addToast('Category created.', 'success');
      await refresh();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create category', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateCoupon(event: FormEvent) {
    event.preventDefault();
    setBusyId('create_coupon');
    try {
      await createAdminCoupon({
        ...couponForm,
        amount: Number(couponForm.amount),
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
        courseId: couponForm.courseId || undefined,
        categoryId: couponForm.categoryId || undefined,
        expiresAt: couponForm.expiresAt || undefined,
      });
      setCouponForm({
        code: '',
        name: '',
        type: 'PERCENTAGE',
        amount: '10',
        usageLimit: '',
        courseId: '',
        categoryId: '',
        expiresAt: '',
      });
      addToast('Coupon created.', 'success');
      await refresh();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create coupon', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateNotification(event: FormEvent) {
    event.preventDefault();
    setBusyId('create_notification');
    try {
      await createAdminNotification({
        ...notificationForm,
        audienceRole: notificationForm.audienceRole || undefined,
      });
      setNotificationForm({ title: '', message: '', channel: 'IN_APP', audienceRole: '' });
      addToast('Notification created.', 'success');
      await refresh();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create notification', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveCertificateTemplate(event: FormEvent) {
    event.preventDefault();
    setBusyId('save_certificate_template');
    try {
      await updateAdminSetting('certificateTemplate', JSON.parse(certificateTemplateDraft));
      addToast('Certificate template saved.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to save certificate template', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleVerifyCertificate(event: FormEvent) {
    event.preventDefault();
    setBusyId('verify_certificate');
    try {
      const result = await verifyAdminCertificate(certificateLookup);
      setVerifiedCertificate(result);
      addToast('Certificate verified.', 'success');
    } catch (error) {
      setVerifiedCertificate(null);
      addToast(error instanceof Error ? error.message : 'Unable to verify certificate', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveStructuredSetting(key: string) {
    setBusyId(`structured_setting:${key}`);
    try {
      await updateAdminSetting(key, JSON.parse(settingsDrafts[key] || 'null'));
      addToast(`${key} saved.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : `Unable to save ${key}`, 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (shouldRedirectToLanding) {
    return (
      <DashboardLayout role="admin">
        <div className="clay p-8 text-lg font-medium text-[var(--color-text-main)]/75">
          Opening {section?.title}...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-[var(--glass-bg)] px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-brand-600">
          <FolderKanban className="h-4 w-4" />
          Admin Panel
        </div>
        <h1 className="mt-6 text-4xl font-display font-black text-[var(--color-text-heading)]">{activeTitle}</h1>
        <p className="mt-3 max-w-3xl text-base font-medium leading-relaxed text-[var(--color-text-main)]/70">{activeDescription}</p>
      </div>

      {section.slug === 'ai-course-builder' ? (
        <div className="mb-8">
          <AiCourseStudio role="admin" />
        </div>
      ) : null}

      {operationalView ? (
        <div className="space-y-8">
          {subsection && (
            <Link
              href={`/dashboard/admin/${section.slug}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--glass-bg)] px-5 py-3 text-sm font-bold text-[var(--color-text-heading)]"
            >
              Back to {section.title}
            </Link>
          )}

          {section.slug === 'categories' && (
            <form onSubmit={handleCreateCategory} className="clay grid gap-4 p-6 md:grid-cols-3">
              <input value={categoryForm.name} onChange={(e) => setCategoryForm((current) => ({ ...current, name: e.target.value }))} placeholder="Category name" className="clay-input !py-3" />
              <input value={categoryForm.slug} onChange={(e) => setCategoryForm((current) => ({ ...current, slug: e.target.value }))} placeholder="category-slug" className="clay-input !py-3" />
              <input value={categoryForm.description} onChange={(e) => setCategoryForm((current) => ({ ...current, description: e.target.value }))} placeholder="Description" className="clay-input !py-3" />
              <button type="submit" disabled={busyId === 'create_category'} className="clay-btn inline-flex items-center justify-center gap-2 px-5 py-3 md:col-span-3 md:w-fit">
                <Plus className="w-4 h-4" /> {busyId === 'create_category' ? 'Creating...' : 'Create Category'}
              </button>
            </form>
          )}

          {section.slug === 'coupons' && (
            <form onSubmit={handleCreateCoupon} className="clay grid gap-4 p-6 md:grid-cols-4">
              <input value={couponForm.code} onChange={(e) => setCouponForm((current) => ({ ...current, code: e.target.value }))} placeholder="Code" className="clay-input !py-3" />
              <input value={couponForm.name} onChange={(e) => setCouponForm((current) => ({ ...current, name: e.target.value }))} placeholder="Coupon name" className="clay-input !py-3" />
              <select value={couponForm.type} onChange={(e) => setCouponForm((current) => ({ ...current, type: e.target.value }))} className="clay-input !py-3">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
              <input value={couponForm.amount} onChange={(e) => setCouponForm((current) => ({ ...current, amount: e.target.value }))} placeholder="Amount" className="clay-input !py-3" />
              <input value={couponForm.usageLimit} onChange={(e) => setCouponForm((current) => ({ ...current, usageLimit: e.target.value }))} placeholder="Usage limit" className="clay-input !py-3" />
              <input type="datetime-local" value={couponForm.expiresAt} onChange={(e) => setCouponForm((current) => ({ ...current, expiresAt: e.target.value }))} className="clay-input !py-3" />
              <input value={couponForm.courseId} onChange={(e) => setCouponForm((current) => ({ ...current, courseId: e.target.value }))} placeholder="Course ID" className="clay-input !py-3" />
              <input value={couponForm.categoryId} onChange={(e) => setCouponForm((current) => ({ ...current, categoryId: e.target.value }))} placeholder="Category ID" className="clay-input !py-3" />
              <button type="submit" disabled={busyId === 'create_coupon'} className="clay-btn inline-flex items-center justify-center gap-2 px-5 py-3 md:col-span-4 md:w-fit">
                <Plus className="w-4 h-4" /> {busyId === 'create_coupon' ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          )}

          {section.slug === 'notifications' && (
            <form onSubmit={handleCreateNotification} className="clay grid gap-4 p-6 md:grid-cols-4">
              <input value={notificationForm.title} onChange={(e) => setNotificationForm((current) => ({ ...current, title: e.target.value }))} placeholder="Title" className="clay-input !py-3 md:col-span-2" />
              <select value={notificationForm.channel} onChange={(e) => setNotificationForm((current) => ({ ...current, channel: e.target.value }))} className="clay-input !py-3">
                <option value="IN_APP">In-App</option>
                <option value="EMAIL">Email</option>
                <option value="PUSH">Push</option>
              </select>
              <select value={notificationForm.audienceRole} onChange={(e) => setNotificationForm((current) => ({ ...current, audienceRole: e.target.value }))} className="clay-input !py-3">
                <option value="">All Users</option>
                <option value="STUDENT">Students</option>
                <option value="INSTRUCTOR">Instructors</option>
                <option value="ADMIN">Admins</option>
              </select>
              <textarea value={notificationForm.message} onChange={(e) => setNotificationForm((current) => ({ ...current, message: e.target.value }))} placeholder="Message" className="clay-input min-h-28 !py-3 md:col-span-4" />
              <button type="submit" disabled={busyId === 'create_notification'} className="clay-btn inline-flex items-center justify-center gap-2 px-5 py-3 md:col-span-4 md:w-fit">
                <Plus className="w-4 h-4" /> {busyId === 'create_notification' ? 'Sending...' : 'Create Notification'}
              </button>
            </form>
          )}

          {section.slug === 'enrollments' && (
            <form onSubmit={handleCreateEnrollment} className="clay grid gap-4 p-6 md:grid-cols-3">
              <input value={enrollmentForm.userId} onChange={(e) => setEnrollmentForm((current) => ({ ...current, userId: e.target.value }))} placeholder="Student user ID" className="clay-input !py-3" />
              <input value={enrollmentForm.courseId} onChange={(e) => setEnrollmentForm((current) => ({ ...current, courseId: e.target.value }))} placeholder="Course ID" className="clay-input !py-3" />
              <button type="submit" disabled={busyId === 'create_enrollment'} className="clay-btn inline-flex items-center justify-center gap-2 px-5 py-3">
                <Plus className="w-4 h-4" /> {busyId === 'create_enrollment' ? 'Enrolling...' : 'Manual Enroll'}
              </button>
            </form>
          )}

          {section.slug === 'certificates' && subsectionSlug === 'templates' && (
            <form onSubmit={handleSaveCertificateTemplate} className="clay p-6">
              <textarea value={certificateTemplateDraft} onChange={(e) => setCertificateTemplateDraft(e.target.value)} className="clay-input min-h-48 !py-3 font-mono text-xs" />
              <button type="submit" disabled={busyId === 'save_certificate_template'} className="mt-4 clay-btn inline-flex items-center gap-2 px-5 py-3">
                <Save className="w-4 h-4" /> {busyId === 'save_certificate_template' ? 'Saving...' : 'Save Certificate Template'}
              </button>
            </form>
          )}

          {section.slug === 'certificates' && subsectionSlug === 'verification' && (
            <div className="space-y-4">
              <form onSubmit={handleVerifyCertificate} className="clay grid gap-4 p-6 md:grid-cols-[minmax(0,1fr)_auto]">
                <input value={certificateLookup} onChange={(e) => setCertificateLookup(e.target.value)} placeholder="Certificate number" className="clay-input !py-3" />
                <button type="submit" disabled={busyId === 'verify_certificate'} className="clay-btn px-5 py-3">
                  {busyId === 'verify_certificate' ? 'Verifying...' : 'Verify'}
                </button>
              </form>
              {verifiedCertificate && (
                <div className="clay p-6">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">Verified Certificate</div>
                  <div className="mt-3 text-lg font-black text-[var(--color-text-heading)]">{verifiedCertificate.certificateNo}</div>
                  <div className="mt-2 text-sm font-medium text-[var(--color-text-main)]/70">
                    {verifiedCertificate.user.firstName} {verifiedCertificate.user.lastName} • {verifiedCertificate.course.title}
                  </div>
                </div>
              )}
            </div>
          )}

          {section.slug === 'certificates' && subsectionSlug === 'templates' && (
            <StructuredSettingEditor
              title="Certificate Rules"
              description="Manage certificate issuing rules and verification defaults."
              value={settingsDrafts.certificateRules || JSON.stringify(defaultStructuredSettings.certificateRules, null, 2)}
              busy={busyId === 'structured_setting:certificateRules'}
              onChange={(value) => setSettingsDrafts((current) => ({ ...current, certificateRules: value }))}
              onSave={() => handleSaveStructuredSetting('certificateRules')}
            />
          )}

          {section.slug === 'categories' && subsectionSlug === 'subcategories' && (
            <StructuredSettingEditor
              title="Subcategories"
              description="Configure the secondary taxonomy under your main categories."
              value={settingsDrafts.categorySubcategories || JSON.stringify(defaultStructuredSettings.categorySubcategories, null, 2)}
              busy={busyId === 'structured_setting:categorySubcategories'}
              onChange={(value) => setSettingsDrafts((current) => ({ ...current, categorySubcategories: value }))}
              onSave={() => handleSaveStructuredSetting('categorySubcategories')}
            />
          )}

          {section.slug === 'categories' && subsectionSlug === 'tags' && (
            <StructuredSettingEditor
              title="Course Tags"
              description="Manage reusable course tags for admin classification and discovery."
              value={settingsDrafts.categoryTags || JSON.stringify(defaultStructuredSettings.categoryTags, null, 2)}
              busy={busyId === 'structured_setting:categoryTags'}
              onChange={(value) => setSettingsDrafts((current) => ({ ...current, categoryTags: value }))}
              onSave={() => handleSaveStructuredSetting('categoryTags')}
            />
          )}

          {section.slug === 'categories' && (subsectionSlug === 'all-categories' || subsectionSlug === 'add-category') && (
            <StructuredSettingEditor
              title="Category Icons and Featured Order"
              description="Store icon names and featured category ordering for the catalog UI."
              value={settingsDrafts.categoryPresentation || JSON.stringify(defaultStructuredSettings.categoryPresentation, null, 2)}
              busy={busyId === 'structured_setting:categoryPresentation'}
              onChange={(value) => setSettingsDrafts((current) => ({ ...current, categoryPresentation: value }))}
              onSave={() => handleSaveStructuredSetting('categoryPresentation')}
            />
          )}

          {section.slug === 'settings' && (
            <StructuredSettingsPanel
              subsectionSlug={subsectionSlug}
              settingsDrafts={settingsDrafts}
              busyId={busyId}
              onChange={(key, value) => setSettingsDrafts((current) => ({ ...current, [key]: value }))}
              onSave={handleSaveStructuredSetting}
            />
          )}

          {section.slug === 'audit-logs' && (
            <div className="clay p-6">
              <input
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter by action, actor, entity, or date"
                className="clay-input !py-3"
              />
            </div>
          )}

          {section.slug === 'analytics' ? (
            <AdminAnalyticsPanel analytics={analytics} loading={analyticsLoading} subsectionSlug={subsectionSlug} />
          ) : (
            <AdminDataPanel
              sectionSlug={section.slug}
              title={activeTitle}
              rows={section.slug === 'audit-logs' && auditSearch
                ? rows.filter((row) => `${row.title} ${row.description} ${row.meta.join(' ')}`.toLowerCase().includes(auditSearch.toLowerCase()))
                : rows}
              loading={loading}
              busyId={busyId}
              adminAssignees={adminAssignees}
              userEdits={userEdits}
              categoryEdits={categoryEdits}
              couponEdits={couponEdits}
              settingsDrafts={settingsDrafts}
              ticketReplies={ticketReplies}
              ticketAssignments={ticketAssignments}
              reportNotes={reportNotes}
              onUserChange={(id, key, value) =>
                setUserEdits((current) => ({ ...current, [id]: { ...(current[id] || { role: '', status: '' }), [key]: value } }))
              }
              onCategoryChange={(id, key, value) =>
                setCategoryEdits((current) => ({ ...current, [id]: { ...(current[id] || { name: '', slug: '', description: '' }), [key]: value } }))
              }
              onCouponChange={(id, key, value) =>
                setCouponEdits((current) => ({ ...current, [id]: { ...(current[id] || { code: '', name: '', type: 'PERCENTAGE', amount: '', usageLimit: '', isActive: true }), [key]: value } }))
              }
              onSettingChange={(key, value) => setSettingsDrafts((current) => ({ ...current, [key]: value }))}
              onTicketReplyChange={(id, value) => setTicketReplies((current) => ({ ...current, [id]: value }))}
              onTicketAssignmentChange={(id, value) => setTicketAssignments((current) => ({ ...current, [id]: value }))}
              onReportNoteChange={(id, value) => setReportNotes((current) => ({ ...current, [id]: value }))}
              onAction={handleAction}
              onInspect={handleInspect}
            />
          )}

          <AdminDetailPanel
            sectionSlug={section.slug}
            detail={detail}
            loading={detailLoading}
            onClose={() => setDetail(null)}
            onEditCourse={(courseId) => router.push(getCourseEditorHref(courseId))}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {section.subpages.map((subpage) => (
            <Link
              key={subpage.slug}
              href={`/dashboard/admin/${section.slug}/${subpage.slug}`}
              className="clay group flex min-h-[220px] flex-col justify-between p-6 transition-transform hover:scale-[1.015]"
            >
              <div>
                <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">{section.title}</div>
                <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)]">{subpage.title}</h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-[var(--color-text-main)]/70">{subpage.description}</p>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--color-text-heading)]">
                Open section <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function AdminDataPanel({
  sectionSlug,
  title,
  rows,
  loading,
  busyId,
  adminAssignees,
  userEdits,
  categoryEdits,
  couponEdits,
  settingsDrafts,
  ticketReplies,
  ticketAssignments,
  reportNotes,
  onUserChange,
  onCategoryChange,
  onCouponChange,
  onSettingChange,
  onTicketReplyChange,
  onTicketAssignmentChange,
  onReportNoteChange,
  onAction,
  onInspect,
}: {
  sectionSlug: string;
  title: string;
  rows: Row[];
  loading: boolean;
  busyId: string | null;
  adminAssignees: Array<{ id: string; name: string; email: string }>;
  userEdits: Record<string, { role: string; status: string }>;
  categoryEdits: Record<string, { name: string; slug: string; description: string }>;
  couponEdits: Record<string, { code: string; name: string; type: string; amount: string; usageLimit: string; isActive: boolean }>;
  settingsDrafts: Record<string, string>;
  ticketReplies: Record<string, string>;
  ticketAssignments: Record<string, string>;
  reportNotes: Record<string, string>;
  onUserChange: (id: string, key: 'role' | 'status', value: string) => void;
  onCategoryChange: (id: string, key: 'name' | 'slug' | 'description', value: string) => void;
  onCouponChange: (id: string, key: 'code' | 'name' | 'type' | 'amount' | 'usageLimit' | 'isActive', value: any) => void;
  onSettingChange: (key: string, value: string) => void;
  onTicketReplyChange: (id: string, value: string) => void;
  onTicketAssignmentChange: (id: string, value: string) => void;
  onReportNoteChange: (id: string, value: string) => void;
  onAction: (row: Row, action: string) => Promise<void>;
  onInspect: (row: Row) => Promise<void>;
}) {
  return (
    <div className="clay overflow-hidden">
      <div className="border-b border-[var(--glass-border)] px-6 py-5">
        <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)]">{title}</h2>
      </div>
      <div className="divide-y divide-[var(--glass-border)]">
        {loading ? (
          <div className="p-6 text-sm font-bold text-[var(--color-text-main)]/60">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm font-bold text-[var(--color-text-main)]/60">No data available yet.</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="space-y-4 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-black text-[var(--color-text-heading)]">{row.title}</div>
                  <div className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-text-main)]/70">{row.description}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.meta.map((item) => (
                      <span key={item} className="rounded-xl bg-[var(--glass-bg)] px-3 py-1 text-xs font-bold text-[var(--color-text-main)]/70">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button onClick={() => onInspect(row)} className="rounded-xl bg-[var(--glass-bg)] px-4 py-2 text-sm font-black text-[var(--color-text-heading)]">
                    Inspect
                  </button>
                  {(row.actions || []).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => onAction(row, action.id)}
                      disabled={busyId === `${action.id}:${row.id}`}
                      className={`rounded-xl px-4 py-2 text-sm font-black transition ${action.tone === 'danger' ? 'bg-red-500/10 text-red-600' : action.tone === 'success' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-[var(--glass-bg)] text-[var(--color-text-heading)]'}`}
                    >
                      {busyId === `${action.id}:${row.id}` ? 'Working...' : action.label}
                    </button>
                  ))}
                </div>
              </div>

              {sectionSlug === 'users' && (
                <div className="grid gap-3 rounded-2xl bg-[var(--glass-bg)] p-4 md:grid-cols-3">
                  <select value={userEdits[row.id]?.role || row.raw.role} onChange={(e) => onUserChange(row.id, 'role', e.target.value)} className="clay-input !py-3">
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <select value={userEdits[row.id]?.status || row.raw.status} onChange={(e) => onUserChange(row.id, 'status', e.target.value)} className="clay-input !py-3">
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                  <button onClick={() => onAction(row, 'save_user')} disabled={busyId === `save_user:${row.id}`} className="clay-btn inline-flex items-center justify-center gap-2 px-4 py-3">
                    <Save className="w-4 h-4" /> {busyId === `save_user:${row.id}` ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              )}

              {sectionSlug === 'settings' && (
                <div className="rounded-2xl bg-[var(--glass-bg)] p-4">
                  <textarea
                    value={settingsDrafts[row.raw.key] || ''}
                    onChange={(e) => onSettingChange(row.raw.key, e.target.value)}
                    className="clay-input min-h-40 !py-3 font-mono text-xs"
                  />
                  <button onClick={() => onAction(row, 'save_setting')} disabled={busyId === `save_setting:${row.id}`} className="mt-3 clay-btn inline-flex items-center gap-2 px-4 py-3">
                    <Save className="w-4 h-4" /> {busyId === `save_setting:${row.id}` ? 'Saving...' : 'Save Setting'}
                  </button>
                </div>
              )}

              {sectionSlug === 'categories' && (
                <div className="grid gap-3 rounded-2xl bg-[var(--glass-bg)] p-4 md:grid-cols-3">
                  <input value={categoryEdits[row.id]?.name || ''} onChange={(e) => onCategoryChange(row.id, 'name', e.target.value)} className="clay-input !py-3" placeholder="Name" />
                  <input value={categoryEdits[row.id]?.slug || ''} onChange={(e) => onCategoryChange(row.id, 'slug', e.target.value)} className="clay-input !py-3" placeholder="Slug" />
                  <input value={categoryEdits[row.id]?.description || ''} onChange={(e) => onCategoryChange(row.id, 'description', e.target.value)} className="clay-input !py-3" placeholder="Description" />
                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    <button onClick={() => onAction(row, 'save_category')} disabled={busyId === `save_category:${row.id}`} className="clay-btn inline-flex items-center gap-2 px-4 py-3">
                      <Save className="w-4 h-4" /> {busyId === `save_category:${row.id}` ? 'Saving...' : 'Save Category'}
                    </button>
                    <button onClick={() => onAction(row, 'delete_category')} disabled={busyId === `delete_category:${row.id}`} className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-black text-red-600">
                      {busyId === `delete_category:${row.id}` ? 'Deleting...' : 'Delete Category'}
                    </button>
                  </div>
                </div>
              )}

              {sectionSlug === 'coupons' && (
                <div className="grid gap-3 rounded-2xl bg-[var(--glass-bg)] p-4 md:grid-cols-3">
                  <input value={couponEdits[row.id]?.code || ''} onChange={(e) => onCouponChange(row.id, 'code', e.target.value)} className="clay-input !py-3" placeholder="Code" />
                  <input value={couponEdits[row.id]?.name || ''} onChange={(e) => onCouponChange(row.id, 'name', e.target.value)} className="clay-input !py-3" placeholder="Name" />
                  <select value={couponEdits[row.id]?.type || 'PERCENTAGE'} onChange={(e) => onCouponChange(row.id, 'type', e.target.value)} className="clay-input !py-3">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed</option>
                  </select>
                  <input value={couponEdits[row.id]?.amount || ''} onChange={(e) => onCouponChange(row.id, 'amount', e.target.value)} className="clay-input !py-3" placeholder="Amount" />
                  <input value={couponEdits[row.id]?.usageLimit || ''} onChange={(e) => onCouponChange(row.id, 'usageLimit', e.target.value)} className="clay-input !py-3" placeholder="Usage limit" />
                  <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg-main)] px-4 py-3 text-sm font-bold text-[var(--color-text-heading)]">
                    <input type="checkbox" checked={couponEdits[row.id]?.isActive || false} onChange={(e) => onCouponChange(row.id, 'isActive', e.target.checked)} />
                    Active
                  </label>
                  <div className="md:col-span-3">
                    <button onClick={() => onAction(row, 'save_coupon')} disabled={busyId === `save_coupon:${row.id}`} className="clay-btn inline-flex items-center gap-2 px-4 py-3">
                      <Save className="w-4 h-4" /> {busyId === `save_coupon:${row.id}` ? 'Saving...' : 'Save Coupon'}
                    </button>
                  </div>
                </div>
              )}

              {sectionSlug === 'support' && (
                <div className="rounded-2xl bg-[var(--glass-bg)] p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <select
                      value={ticketAssignments[row.id] || ''}
                      onChange={(e) => onTicketAssignmentChange(row.id, e.target.value)}
                      className="clay-input !py-3"
                    >
                      <option value="">Unassigned</option>
                      {adminAssignees.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name} ({admin.email})
                        </option>
                      ))}
                    </select>
                    <button onClick={() => onAction(row, 'assign_ticket')} disabled={busyId === `assign_ticket:${row.id}`} className="clay-btn px-4 py-3">
                      {busyId === `assign_ticket:${row.id}` ? 'Saving...' : 'Save Assignment'}
                    </button>
                  </div>
                  <textarea
                    value={ticketReplies[row.id] || ''}
                    onChange={(e) => onTicketReplyChange(row.id, e.target.value)}
                    placeholder="Reply or internal status note"
                    className="clay-input min-h-28 !py-3"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => onAction(row, 'progress_ticket')} disabled={busyId === `progress_ticket:${row.id}`} className="rounded-xl bg-[var(--color-bg-main)] px-4 py-2 text-sm font-black text-[var(--color-text-heading)]">
                      {busyId === `progress_ticket:${row.id}` ? 'Working...' : 'Mark In Progress'}
                    </button>
                    <button onClick={() => onAction(row, 'resolve_ticket')} disabled={busyId === `resolve_ticket:${row.id}`} className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-700">
                      {busyId === `resolve_ticket:${row.id}` ? 'Working...' : 'Resolve Ticket'}
                    </button>
                  </div>
                </div>
              )}

              {sectionSlug === 'moderation' && (
                <div className="rounded-2xl bg-[var(--glass-bg)] p-4">
                  <textarea
                    value={reportNotes[row.id] || ''}
                    onChange={(e) => onReportNoteChange(row.id, e.target.value)}
                    placeholder="Resolution note"
                    className="clay-input min-h-24 !py-3"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => onAction(row, 'review_report')} disabled={busyId === `review_report:${row.id}`} className="rounded-xl bg-brand-500/10 px-4 py-2 text-sm font-black text-brand-600">
                      {busyId === `review_report:${row.id}` ? 'Working...' : 'Mark Reviewed'}
                    </button>
                    <button onClick={() => onAction(row, 'dismiss_report')} disabled={busyId === `dismiss_report:${row.id}`} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-black text-red-600">
                      {busyId === `dismiss_report:${row.id}` ? 'Working...' : 'Dismiss'}
                    </button>
                    {row.raw.entityType === 'USER' && (
                      <>
                        <button onClick={() => onAction(row, 'warn_user')} disabled={busyId === `warn_user:${row.id}`} className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-700">
                          {busyId === `warn_user:${row.id}` ? 'Working...' : 'Warn User'}
                        </button>
                        <button onClick={() => onAction(row, 'suspend_reported_user')} disabled={busyId === `suspend_reported_user:${row.id}`} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-black text-red-600">
                          {busyId === `suspend_reported_user:${row.id}` ? 'Working...' : 'Suspend User'}
                        </button>
                        <button onClick={() => onAction(row, 'restore_reported_user')} disabled={busyId === `restore_reported_user:${row.id}`} className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-700">
                          {busyId === `restore_reported_user:${row.id}` ? 'Working...' : 'Restore User'}
                        </button>
                      </>
                    )}
                    {row.raw.entityType === 'COURSE' && (
                      <>
                        <button onClick={() => onAction(row, 'archive_reported_course')} disabled={busyId === `archive_reported_course:${row.id}`} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-black text-red-600">
                          {busyId === `archive_reported_course:${row.id}` ? 'Working...' : 'Archive Course'}
                        </button>
                        <button onClick={() => onAction(row, 'restore_reported_course')} disabled={busyId === `restore_reported_course:${row.id}`} className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-700">
                          {busyId === `restore_reported_course:${row.id}` ? 'Working...' : 'Restore Course'}
                        </button>
                      </>
                    )}
                    {row.raw.entityType === 'LESSON' && (
                      <>
                        <button onClick={() => onAction(row, 'hide_reported_lesson')} disabled={busyId === `hide_reported_lesson:${row.id}`} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-black text-red-600">
                          {busyId === `hide_reported_lesson:${row.id}` ? 'Working...' : 'Hide Lesson'}
                        </button>
                        <button onClick={() => onAction(row, 'restore_reported_lesson')} disabled={busyId === `restore_reported_lesson:${row.id}`} className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-700">
                          {busyId === `restore_reported_lesson:${row.id}` ? 'Working...' : 'Restore Lesson'}
                        </button>
                      </>
                    )}
                    {row.raw.entityType === 'REVIEW' && (
                      <>
                        <button onClick={() => onAction(row, 'hide_reported_review')} disabled={busyId === `hide_reported_review:${row.id}`} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-black text-red-600">
                          {busyId === `hide_reported_review:${row.id}` ? 'Working...' : 'Hide Review'}
                        </button>
                        <button onClick={() => onAction(row, 'restore_reported_review')} disabled={busyId === `restore_reported_review:${row.id}`} className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-700">
                          {busyId === `restore_reported_review:${row.id}` ? 'Working...' : 'Restore Review'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminDetailPanel({
  sectionSlug,
  detail,
  loading,
  onClose,
  onEditCourse,
}: {
  sectionSlug: string;
  detail: any | null;
  loading: boolean;
  onClose: () => void;
  onEditCourse?: (courseId: string) => void;
}) {
  if (!detail && !loading) {
    return null;
  }

  return (
    <div className="clay p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-display font-black text-[var(--color-text-heading)]">Detail View</h3>
        <button onClick={onClose} className="rounded-xl bg-[var(--glass-bg)] px-4 py-2 text-sm font-bold text-[var(--color-text-heading)]">Close</button>
      </div>
      {loading ? (
        <div className="text-sm font-bold text-[var(--color-text-main)]/60">Loading detail...</div>
      ) : sectionSlug === 'users' || sectionSlug === 'instructors' ? (
        <div className="space-y-6">
          <KeyValue title="Profile" items={[
            ['Name', `${detail.firstName} ${detail.lastName}`],
            ['Email', detail.email],
            ['Role', detail.role],
            ['Status', detail.status],
            ['Headline', detail.headline || 'N/A'],
          ]} />
          <KeyValue title="Enrollments" items={(detail.enrollments || []).map((entry: any) => [entry.course.title, `${entry.status} • ${Math.round(entry.progressPercent)}%`])} />
          <KeyValue title="Instructor Courses" items={(detail.instructorCourses || []).map((entry: any) => [entry.title, `${entry.status} • ${entry._count?.enrollments ?? 0} students`])} />
          <KeyValue title="Verification Documents" items={(detail.verificationDocs || []).map((entry: any) => [entry.documentType, `${entry.status} • ${entry.documentUrl}`])} />
          <KeyValue title="Payments" items={(detail.payments || []).map((entry: any) => [formatINRFromPaise(entry.amountCents ?? 0), `${entry.status} • ${entry.provider}`])} />
          <KeyValue title="Login Activity" items={(detail.loginActivities || []).map((entry: any) => [new Date(entry.createdAt).toLocaleString(), entry.method])} />
        </div>
      ) : sectionSlug === 'courses' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">Course detail</div>
            {detail?.id && onEditCourse && (
              <button
                onClick={() => onEditCourse(detail.id)}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-black text-white"
              >
                Edit Course
              </button>
            )}
          </div>
          <KeyValue title="Course" items={[
            ['Title', detail.title],
            ['Instructor', `${detail.instructor?.firstName || ''} ${detail.instructor?.lastName || ''}`.trim()],
            ['Status', detail.status],
            ['Category', detail.category?.name || 'Unassigned'],
            ['Price', formatINRFromPaise(detail.priceCents ?? 0)],
          ]} />
          <KeyValue title="Modules" items={(detail.modules || []).map((module: any) => [module.title, `${module.lessons?.length ?? 0} lessons`])} />
          <KeyValue title="Students" items={(detail.enrollments || []).map((entry: any) => [`${entry.user.firstName} ${entry.user.lastName}`, `${entry.status} • ${Math.round(entry.progressPercent)}%`])} />
          <KeyValue title="Reviews" items={(detail.reviews || []).map((entry: any) => [`${entry.user.firstName} ${entry.user.lastName}`, `${entry.rating}/5`])} />
        </div>
      ) : (
        <pre className="overflow-auto rounded-2xl bg-[var(--glass-bg)] p-4 text-xs text-[var(--color-text-main)]/80">{JSON.stringify(detail, null, 2)}</pre>
      )}
    </div>
  );
}

function AdminAnalyticsPanel({
  analytics,
  loading,
  subsectionSlug,
}: {
  analytics: PlatformAnalytics | null;
  loading: boolean;
  subsectionSlug?: string;
}) {
  if (loading) {
    return <div className="clay p-6 text-sm font-bold text-[var(--color-text-main)]/60">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="clay p-6 text-sm font-bold text-[var(--color-text-main)]/60">No analytics available.</div>;
  }

  const cards = (() => {
    switch (subsectionSlug) {
      case 'students':
        return [
          ['Total Students', String(analytics.totalStudents)],
          ['Enrollments', String(analytics.enrollments)],
          ['Recent Student Signups', String(analytics.recentUsers.filter((user) => user.role === 'STUDENT').length)],
        ];
      case 'instructors':
        return [
          ['Total Instructors', String(analytics.totalInstructors)],
          ['Pending Approvals', String(analytics.pendingInstructorApprovals)],
          ['AI Generations Today', String(analytics.aiCourseGenerationsToday)],
        ];
      case 'courses':
        return [
          ['Total Courses', String(analytics.totalCourses)],
          ['Pending Course Approvals', String(analytics.pendingCourseApprovals)],
          ['Recent Enrollments', String(analytics.recentEnrollments.length)],
        ];
      case 'revenue':
        return [
          ['Total Revenue', formatINRFromPaise(analytics.totalRevenueCents)],
          ['Recent Payments', String(analytics.recentPayments.length)],
          ['Latest Growth Month', analytics.growthSeries.at(-1)?.label || 'N/A'],
        ];
      case 'ai-usage':
        return [
          ['AI Generations Today', String(analytics.aiCourseGenerationsToday)],
          ['Pending Course Reviews', String(analytics.pendingCourseApprovals)],
          ['Instructor Count', String(analytics.totalInstructors)],
        ];
      default:
        return [
          ['Users', String(analytics.users)],
          ['Courses', String(analytics.courses)],
          ['Revenue', formatINRFromPaise(analytics.revenueCents)],
        ];
    }
  })();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="clay p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">{label}</div>
            <div className="mt-3 text-3xl font-display font-black text-[var(--color-text-heading)]">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <KeyValue
          title="Growth"
          items={analytics.growthSeries.map((entry) => [
            entry.label,
            `${entry.users} users • ${entry.enrollments} enrollments • ${formatINRFromPaise(entry.revenueCents)}`,
          ])}
        />
        <KeyValue
          title="Recent Payments"
          items={analytics.recentPayments.map((payment) => [
            `${formatINRFromPaise(payment.amountCents)} • ${payment.provider}`,
            `${payment.status} • ${payment.order?.items.map((item) => item.course.title).join(', ') || 'No courses'}`,
          ])}
        />
      </div>
    </div>
  );
}

function StructuredSettingsPanel({
  subsectionSlug,
  settingsDrafts,
  busyId,
  onChange,
  onSave,
}: {
  subsectionSlug?: string;
  settingsDrafts: Record<string, string>;
  busyId: string | null;
  onChange: (key: string, value: string) => void;
  onSave: (key: string) => void;
}) {
  const sectionKeyMap: Record<string, { key: string; title: string; description: string }> = {
    general: { key: 'general', title: 'General Settings', description: 'Platform branding, maintenance mode, and policy links.' },
    payments: { key: 'payments', title: 'Payment Settings', description: 'Commission and gateway availability settings.' },
    ai: { key: 'ai', title: 'AI Settings', description: 'AI provider, moderation, and daily operational limits.' },
    email: { key: 'email', title: 'Email Settings', description: 'SMTP and sender configuration.' },
    seo: { key: 'seo', title: 'SEO Settings', description: 'Metadata and indexing defaults.' },
    security: { key: 'security', title: 'Security Settings', description: 'Admin OTP, session, and signup restrictions.' },
  };

  const sections = subsectionSlug && sectionKeyMap[subsectionSlug]
    ? [sectionKeyMap[subsectionSlug]]
    : Object.values(sectionKeyMap);

  return (
    <div className="grid gap-6">
      {sections.map((item) => (
        <StructuredSettingEditor
          key={item.key}
          title={item.title}
          description={item.description}
          value={settingsDrafts[item.key] || JSON.stringify(defaultStructuredSettings[item.key as keyof typeof defaultStructuredSettings], null, 2)}
          busy={busyId === `structured_setting:${item.key}`}
          onChange={(value) => onChange(item.key, value)}
          onSave={() => onSave(item.key)}
        />
      ))}
    </div>
  );
}

function StructuredSettingEditor({
  title,
  description,
  value,
  busy,
  onChange,
  onSave,
}: {
  title: string;
  description: string;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="clay p-6">
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">{title}</div>
        <div className="mt-2 text-sm font-medium text-[var(--color-text-main)]/70">{description}</div>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="clay-input min-h-40 !py-3 font-mono text-xs" />
      <button onClick={onSave} disabled={busy} className="mt-4 clay-btn inline-flex items-center gap-2 px-4 py-3">
        <Save className="w-4 h-4" /> {busy ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

function KeyValue({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <div>
      <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">{title}</div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl bg-[var(--glass-bg)] px-4 py-3 text-sm font-medium text-[var(--color-text-main)]/60">No records.</div>
        ) : (
          items.map(([label, value]) => (
            <div key={`${title}-${label}-${value}`} className="flex flex-col gap-1 rounded-xl bg-[var(--glass-bg)] px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-black text-[var(--color-text-heading)]">{label}</div>
              <div className="text-sm font-medium text-[var(--color-text-main)]/70">{value}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatAdminStatus(status?: string) {
  return (status ?? 'UNKNOWN')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const defaultStructuredSettings = {
  general: {
    platformName: 'Academy LMS',
    maintenanceMode: false,
    termsUrl: '/terms',
    privacyUrl: '/privacy',
  },
  payments: {
    commissionPercentage: 15,
    stripeEnabled: true,
    razorpayEnabled: true,
    payoutWindowDays: 7,
  },
  ai: {
    provider: 'groq',
    moderationEnabled: true,
    dailyBudgetUsd: 50,
  },
  email: {
    fromName: 'Academy LMS',
    fromEmail: 'support@academy.test',
    smtpHost: 'smtp.example.com',
  },
  seo: {
    metaTitle: 'Academy LMS',
    metaDescription: 'AI-powered LMS platform.',
    indexCourses: true,
  },
  security: {
    adminOtpRequired: true,
    sessionHours: 24,
    allowInstructorSignup: true,
  },
  certificateTemplate: {
    title: 'Certificate of Completion',
    signatureName: 'Academy Admin',
  },
  certificateRules: {
    minimumProgressPercent: 100,
    requireApprovedCourse: true,
    autoIssueOnCompletion: true,
  },
  categorySubcategories: [
    { parent: 'Artificial Intelligence', items: ['Machine Learning', 'LLM Apps', 'Model Ops'] },
  ],
  categoryTags: ['featured', 'beginner', 'advanced', 'ai', 'cloud'],
  categoryPresentation: {
    featuredOrder: ['artificial-intelligence', 'cloud-engineering', 'product-strategy'],
    iconMap: {
      'artificial-intelligence': 'brain',
      'cloud-engineering': 'cloud',
      'product-strategy': 'bar-chart',
    },
  },
};

async function loadSectionRows(sectionSlug: string, subsectionSlug?: string): Promise<Row[]> {
  if (sectionSlug === 'users') {
    const roleMap: Record<string, string | undefined> = {
      students: 'STUDENT',
      instructors: 'INSTRUCTOR',
      admins: 'ADMIN',
    };
    const status = subsectionSlug === 'blocked-users' ? 'SUSPENDED' : undefined;
    const users = await getAdminUsers({ role: roleMap[subsectionSlug ?? ''], status });
    return users.map((user) => ({
      id: user.id,
      raw: user,
      title: `${user.firstName} ${user.lastName}`.trim() || user.email,
      description: user.email,
      meta: [user.role, user.status, `${user._count?.enrollments ?? 0} enrollments`, `${user._count?.instructorCourses ?? 0} courses`, `${user._count?.loginActivities ?? 0} logins`],
      actions: [
        { id: 'activate_user', label: 'Activate', tone: 'success' },
        { id: 'suspend_user', label: 'Suspend', tone: 'danger' },
        { id: 'reset_password', label: 'Reset Password', tone: 'neutral' },
      ],
    }));
  }

  if (sectionSlug === 'instructors') {
    const statusMap: Record<string, string | undefined> = {
      'pending-requests': 'PENDING',
      approved: 'APPROVED',
      rejected: 'REJECTED',
      performance: undefined,
    };
    const instructors = await getAdminInstructors(statusMap[subsectionSlug ?? '']);
    return instructors.map((instructor) => ({
      id: instructor.id,
      raw: instructor,
      title: `${instructor.firstName} ${instructor.lastName}`,
      description: instructor.headline || instructor.email,
      meta: [instructor.status, `${instructor.instructorCourses?.length ?? 0} courses`],
      actions: [
        ...(instructor.verificationDocs?.some((doc: any) => doc.status !== 'VERIFIED') ? [{ id: 'verify_instructor_docs', label: 'Verify Docs', tone: 'neutral' as const }] : []),
        { id: 'approve_instructor', label: 'Approve', tone: 'success' },
        { id: 'reject_instructor', label: 'Reject', tone: 'danger' },
        { id: 'suspend_instructor', label: 'Suspend', tone: 'danger' },
      ],
    }));
  }

  if (sectionSlug === 'courses') {
    const statusMap: Record<string, string | undefined> = {
      'pending-approval': 'IN_REVIEW',
      published: 'PUBLISHED',
      drafts: 'DRAFT',
      rejected: 'ARCHIVED',
    };
    const featured = subsectionSlug === 'featured' ? true : undefined;
    const courses = await getAdminCourses({ status: statusMap[subsectionSlug ?? ''], featured });
    return courses.map((course) => ({
      id: course.id,
      raw: course,
      title: course.title,
      description: course.summary,
      meta: [
        formatAdminStatus(course.status),
        course.category?.name || 'No category',
        formatINRFromPaise(course.priceCents ?? 0),
        `${course._count?.enrollments ?? 0} students`,
      ],
      actions: [
        ...(course.status !== 'PUBLISHED' ? [{ id: 'approve_course', label: course.status === 'IN_REVIEW' ? 'Approve' : 'Publish', tone: 'success' as const }] : []),
        { id: 'edit_course', label: 'Edit', tone: 'neutral' as const },
        ...(course.status !== 'ARCHIVED' ? [{ id: 'reject_course', label: course.status === 'PUBLISHED' ? 'Archive' : 'Reject', tone: 'danger' as const }] : []),
        { id: 'feature_course', label: course.isFeatured ? 'Unfeature' : 'Feature', tone: 'neutral' },
      ],
    }));
  }

  if (sectionSlug === 'categories') {
    const categories = await getAdminCategories();
    return categories.map((category) => ({
      id: category.id,
      raw: category,
      title: category.name,
      description: category.description || category.slug,
      meta: [category.slug, `${category._count?.courses ?? 0} courses`],
    }));
  }

  if (sectionSlug === 'enrollments') {
    const statusMap: Record<string, string | undefined> = {
      active: 'ACTIVE',
      completed: 'COMPLETED',
      refunded: 'REFUNDED',
    };
    const enrollments = await getAdminEnrollments(statusMap[subsectionSlug ?? '']);
    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      raw: enrollment,
      title: `${enrollment.user.firstName} ${enrollment.user.lastName} -> ${enrollment.course.title}`,
      description: `${Math.round(enrollment.progressPercent)}% progress`,
      meta: [enrollment.status, new Date(enrollment.enrolledAt).toLocaleDateString(), enrollment.certificate ? 'Certificate eligible' : 'No certificate'],
      actions: [
        ...(enrollment.status !== 'COMPLETED' ? [{ id: 'complete_enrollment', label: 'Complete + Certificate', tone: 'success' as const }] : []),
        { id: 'delete_enrollment', label: 'Remove', tone: 'danger' as const },
      ],
    }));
  }

  if (sectionSlug === 'payments' && subsectionSlug === 'payouts') {
    const payouts = await getAdminPayouts();
    return payouts.map((payout) => ({
      id: payout.id,
      raw: payout,
      title: `${payout.instructor.firstName} ${payout.instructor.lastName}`,
      description: formatINRFromPaise(payout.amountCents ?? 0),
      meta: [payout.status, new Date(payout.requestedAt).toLocaleDateString()],
      actions: [
        ...(payout.status === 'PENDING' ? [{ id: 'approve_payout', label: 'Approve', tone: 'success' as const }] : []),
        ...(payout.status !== 'PAID' ? [{ id: 'mark_payout_paid', label: 'Mark Paid', tone: 'neutral' as const }] : []),
      ],
    }));
  }

  if (sectionSlug === 'payments') {
    const statusMap: Record<string, string | undefined> = {
      refunds: 'REFUNDED',
    };
    const payments = await getAdminPayments(statusMap[subsectionSlug ?? ''], subsectionSlug === 'stripe' ? 'STRIPE' : undefined);
    return payments
      .filter((payment) => subsectionSlug !== 'razorpay' || payment.provider === 'RAZORPAY')
      .map((payment) => ({
      id: payment.id,
      raw: payment,
      title: `${formatINRFromPaise(payment.amountCents ?? 0)} • ${payment.provider}`,
      description: payment.order?.items?.map((item: any) => item.course.title).join(', ') || 'Payment record',
      meta: [payment.status, payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'],
      actions: payment.status !== 'REFUNDED' ? [{ id: 'refund_payment', label: 'Refund', tone: 'danger' }] : [],
      }));
  }

  if (sectionSlug === 'coupons') {
    const coupons = await getAdminCoupons();
    return coupons.map((coupon) => ({
      id: coupon.id,
      raw: coupon,
      title: coupon.code,
      description: coupon.name,
      meta: [coupon.type, `${coupon.amount}`, coupon.isActive ? 'Active' : 'Inactive', coupon.course?.title || coupon.category?.name || 'Global'],
    }));
  }

  if (sectionSlug === 'reviews') {
    const reviews = await getAdminReviews();
    return reviews.map((review) => ({
      id: review.id,
      raw: review,
      title: `${review.course.title} • ${review.rating}/5`,
      description: review.comment || 'No written comment',
      meta: [review.status, `${review.user.firstName} ${review.user.lastName}`],
      actions: [
        { id: 'approve_review', label: 'Approve', tone: 'success' },
        { id: 'reject_review', label: 'Reject', tone: 'danger' },
      ],
    }));
  }

  if (sectionSlug === 'certificates') {
    const certificates = await getAdminCertificates();
    return certificates.map((certificate) => ({
      id: certificate.id,
      raw: certificate,
      title: certificate.certificateNo,
      description: `${certificate.user.firstName} ${certificate.user.lastName} • ${certificate.course.title}`,
      meta: [new Date(certificate.issuedAt).toLocaleDateString()],
      actions: [{ id: 'revoke_certificate', label: 'Revoke', tone: 'danger' }],
    }));
  }

  if (sectionSlug === 'ai-course-builder') {
    const jobs = await getAdminAiGenerations();
    return jobs.map((job) => ({
      id: job.id,
      raw: job,
      title: job.title,
      description: `${job.instructor.firstName} ${job.instructor.lastName}`,
      meta: [job.status, `${job.totalTokens ?? 0} tokens`, `₹${Number(job.estimatedCostUsd ?? 0).toFixed(2)}`, job.abuseFlagged ? 'Flagged' : 'Clean'],
      actions: job.status === 'FAILED' ? [{ id: 'retry_ai_generation', label: 'Retry', tone: 'success' }] : [],
    }));
  }

  if (sectionSlug === 'moderation') {
    const reports = await getAdminReports();
    const entityMap: Record<string, string | undefined> = {
      'reported-courses': 'COURSE',
      'reported-users': 'USER',
      'reported-reviews': 'REVIEW',
      'reported-lessons': 'LESSON',
    };
    return reports
      .filter((report) => !entityMap[subsectionSlug ?? ''] || report.entityType === entityMap[subsectionSlug ?? ''])
      .map((report) => ({
      id: report.id,
      raw: report,
      title: `${report.entityType} • ${report.entityId}`,
      description: report.reason,
      meta: [report.status, new Date(report.createdAt).toLocaleDateString()],
      actions: [
        { id: 'review_report', label: 'Mark Reviewed', tone: 'success' },
        { id: 'dismiss_report', label: 'Dismiss', tone: 'danger' },
      ],
      }));
  }

  if (sectionSlug === 'support') {
    const tickets = await getAdminTickets();
    const categoryMap: Record<string, string | undefined> = {
      students: 'STUDENT',
      instructors: 'INSTRUCTOR',
      'payment-issues': 'PAYMENT',
      'technical-issues': 'TECHNICAL',
    };
    return tickets
      .filter((ticket) => !categoryMap[subsectionSlug ?? ''] || ticket.category === categoryMap[subsectionSlug ?? ''])
      .map((ticket) => ({
      id: ticket.id,
      raw: ticket,
      title: ticket.subject,
      description: ticket.description,
      meta: [ticket.status, ticket.category, `${ticket.user.firstName} ${ticket.user.lastName}`, ticket.assignedToId ? `Assigned` : 'Unassigned'],
      actions: [
        { id: 'progress_ticket', label: 'In Progress', tone: 'neutral' },
        { id: 'resolve_ticket', label: 'Resolve', tone: 'success' },
      ],
      }));
  }

  if (sectionSlug === 'notifications') {
    const notifications = await getAdminNotifications();
    return notifications.map((notification) => ({
      id: notification.id,
      raw: notification,
      title: notification.title,
      description: notification.message,
      meta: [notification.channel, notification.audienceRole || 'All Users', `${notification.deliveredCount} delivered`],
    }));
  }

  if (sectionSlug === 'settings') {
    const settings = await getAdminSettings();
    return settings.map((setting) => ({
      id: setting.id,
      raw: setting,
      title: setting.key,
      description: `Updated ${new Date(setting.updatedAt).toLocaleDateString()}`,
      meta: [new Date(setting.updatedAt).toLocaleDateString()],
      actions: [{ id: 'save_setting', label: 'Save Setting', tone: 'success' }],
    }));
  }

  if (sectionSlug === 'audit-logs') {
    const logs = await getAdminAuditLogs();
    return logs.map((log) => ({
      id: log.id,
      raw: log,
      title: log.action,
      description: `${log.actor.firstName} ${log.actor.lastName} • ${log.entityType} ${log.entityId}`,
      meta: [new Date(log.createdAt).toLocaleString()],
    }));
  }

  return [];
}
