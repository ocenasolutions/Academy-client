export type AdminSection = {
  slug: string;
  title: string;
  description: string;
  subpages: Array<{
    slug: string;
    title: string;
    description: string;
  }>;
};

export type AdminSectionGroup = {
  group: string;
  sections: AdminSection[];
};

export const adminSectionGroups: AdminSectionGroup[] = [
  {
    group: 'Overview',
    sections: [
      {
        slug: 'dashboard',
        title: 'Dashboard',
        description: 'Platform-wide metrics, approvals, financial visibility, and recent activity.',
        subpages: [],
      },
    ],
  },
  {
    group: 'People',
    sections: [
      {
        slug: 'users',
        title: 'User Management',
        description: 'Manage students, instructors, admins, blocked accounts, and profile-level actions.',
        subpages: [
          { slug: 'all-users', title: 'All Users', description: 'View and manage the complete user directory.' },
          { slug: 'students', title: 'Students', description: 'Review student accounts, access, and enrollments.' },
          { slug: 'instructors', title: 'Instructors', description: 'Manage instructor accounts and permissions.' },
          { slug: 'admins', title: 'Admins', description: 'Inspect seeded and authorized admin accounts.' },
          { slug: 'blocked-users', title: 'Blocked Users', description: 'Review suspended and blocked users.' },
        ],
      },
      {
        slug: 'instructors',
        title: 'Instructor Management',
        description: 'Approval workflows, performance, verification, and instructor status control.',
        subpages: [
          { slug: 'pending-requests', title: 'Pending Instructor Requests', description: 'Approve or reject new instructor access.' },
          { slug: 'approved', title: 'Approved Instructors', description: 'Review active instructor profiles.' },
          { slug: 'rejected', title: 'Rejected Instructors', description: 'Track rejected instructor requests.' },
          { slug: 'performance', title: 'Instructor Performance', description: 'See ratings, earnings, and teaching outcomes.' },
        ],
      },
    ],
  },
  {
    group: 'Content',
    sections: [
      {
        slug: 'courses',
        title: 'Course Management',
        description: 'Approval, publishing, pricing, category assignment, and course quality review.',
        subpages: [
          { slug: 'all-courses', title: 'All Courses', description: 'Browse all courses across statuses.' },
          { slug: 'pending-approval', title: 'Pending Approval', description: 'Review courses waiting for admin approval.' },
          { slug: 'published', title: 'Published Courses', description: 'Audit live courses available to students.' },
          { slug: 'drafts', title: 'Draft Courses', description: 'Inspect instructor draft content.' },
          { slug: 'rejected', title: 'Rejected Courses', description: 'Track rejected course submissions.' },
          { slug: 'featured', title: 'Featured Courses', description: 'Manage featured catalog placements.' },
        ],
      },
      {
        slug: 'ai-course-builder',
        title: 'AI Course Builder Monitoring',
        description: 'Monitor generated content, failed jobs, prompt usage, and content quality risks.',
        subpages: [
          { slug: 'generations', title: 'AI Generations', description: 'Review instructor AI generation activity.' },
          { slug: 'prompt-logs', title: 'Prompt Logs', description: 'Inspect prompts and generated results.' },
          { slug: 'failed-generations', title: 'Failed Generations', description: 'Track and retry failed AI jobs.' },
          { slug: 'usage-analytics', title: 'AI Usage Analytics', description: 'Measure token use and operational cost.' },
          { slug: 'review-queue', title: 'Content Review Queue', description: 'Flag low-quality or abusive AI outputs.' },
        ],
      },
      {
        slug: 'categories',
        title: 'Category Management',
        description: 'Manage categories, subcategories, tags, icons, and featured order.',
        subpages: [
          { slug: 'all-categories', title: 'All Categories', description: 'Review and manage every category.' },
          { slug: 'add-category', title: 'Add Category', description: 'Create new categories and metadata.' },
          { slug: 'subcategories', title: 'Subcategories', description: 'Organize secondary taxonomy layers.' },
          { slug: 'tags', title: 'Tags', description: 'Manage reusable course tags.' },
        ],
      },
      {
        slug: 'reviews',
        title: 'Reviews & Ratings',
        description: 'Moderate reviews, ratings, abuse reports, and average quality signals.',
        subpages: [
          { slug: 'course-reviews', title: 'Course Reviews', description: 'Browse and moderate course reviews.' },
          { slug: 'reported-reviews', title: 'Reported Reviews', description: 'Handle flagged review content.' },
          { slug: 'instructor-ratings', title: 'Instructor Ratings', description: 'Assess instructor quality signals.' },
        ],
      },
      {
        slug: 'certificates',
        title: 'Certificates',
        description: 'Manage templates, issued certificates, verification, and revocation rules.',
        subpages: [
          { slug: 'templates', title: 'Certificate Templates', description: 'Configure certificate visual templates.' },
          { slug: 'issued', title: 'Issued Certificates', description: 'View and manage granted certificates.' },
          { slug: 'verification', title: 'Certificate Verification', description: 'Check certificate authenticity and revocations.' },
        ],
      },
      {
        slug: 'moderation',
        title: 'Content Moderation',
        description: 'Review reported courses, lessons, users, and reviews across the platform.',
        subpages: [
          { slug: 'reported-courses', title: 'Reported Courses', description: 'Inspect and resolve course-level reports.' },
          { slug: 'reported-lessons', title: 'Reported Lessons', description: 'Review lesson-level moderation issues.' },
          { slug: 'reported-users', title: 'Reported Users', description: 'Resolve user abuse and policy violations.' },
          { slug: 'reported-reviews', title: 'Reported Reviews', description: 'Handle abusive or spam review reports.' },
        ],
      },
    ],
  },
  {
    group: 'Commerce',
    sections: [
      {
        slug: 'enrollments',
        title: 'Enrollment Management',
        description: 'Track active, completed, refunded, and manually managed enrollments.',
        subpages: [
          { slug: 'all-enrollments', title: 'All Enrollments', description: 'Inspect the full enrollment ledger.' },
          { slug: 'active', title: 'Active Enrollments', description: 'See in-progress enrollments.' },
          { slug: 'completed', title: 'Completed Courses', description: 'Audit finished enrollments and completion dates.' },
          { slug: 'refunded', title: 'Refunded Enrollments', description: 'Track refund-linked enrollment changes.' },
        ],
      },
      {
        slug: 'payments',
        title: 'Payment & Revenue',
        description: 'Transactions, refunds, payouts, splits, and gateway-level payment visibility.',
        subpages: [
          { slug: 'transactions', title: 'Transactions', description: 'Browse all payment transactions.' },
          { slug: 'razorpay', title: 'Razorpay Payments', description: 'Review Razorpay-specific payment flows.' },
          { slug: 'stripe', title: 'Stripe Payments', description: 'Review Stripe-specific payment flows.' },
          { slug: 'refunds', title: 'Refunds', description: 'Inspect and approve refund requests.' },
          { slug: 'payouts', title: 'Instructor Payouts', description: 'Track payout approvals and status.' },
          { slug: 'revenue-split', title: 'Revenue Split', description: 'Monitor platform and instructor revenue split.' },
        ],
      },
      {
        slug: 'coupons',
        title: 'Coupon & Offers',
        description: 'Discount codes, expiry, usage limits, and course/category-level pricing offers.',
        subpages: [
          { slug: 'all-coupons', title: 'All Coupons', description: 'Review active and inactive coupons.' },
          { slug: 'create', title: 'Create Coupon', description: 'Create new fixed or percentage discounts.' },
          { slug: 'course-discounts', title: 'Course Discounts', description: 'Manage course-level offer campaigns.' },
          { slug: 'instructor-coupons', title: 'Instructor Coupons', description: 'Control instructor-issued discount rules.' },
        ],
      },
    ],
  },
  {
    group: 'Operations',
    sections: [
      {
        slug: 'analytics',
        title: 'Analytics & Reports',
        description: 'Student, instructor, course, AI usage, revenue, and growth reporting views.',
        subpages: [
          { slug: 'students', title: 'Student Analytics', description: 'Inspect student activity and retention.' },
          { slug: 'instructors', title: 'Instructor Analytics', description: 'Track instructor growth and quality.' },
          { slug: 'courses', title: 'Course Analytics', description: 'Compare completion and performance by course.' },
          { slug: 'revenue', title: 'Revenue Analytics', description: 'Monitor revenue trends and payment health.' },
          { slug: 'ai-usage', title: 'AI Usage Reports', description: 'Track operational AI usage and cost.' },
          { slug: 'growth', title: 'Growth Reports', description: 'Follow platform growth trends.' },
        ],
      },
      {
        slug: 'support',
        title: 'Support / Tickets',
        description: 'Student, instructor, payment, and technical support queue handling.',
        subpages: [
          { slug: 'all-tickets', title: 'All Tickets', description: 'Work the complete support queue.' },
          { slug: 'students', title: 'Student Tickets', description: 'Manage student support requests.' },
          { slug: 'instructors', title: 'Instructor Tickets', description: 'Resolve instructor-side support issues.' },
          { slug: 'payment-issues', title: 'Payment Issues', description: 'Handle transaction and refund support.' },
          { slug: 'technical-issues', title: 'Technical Issues', description: 'Track platform bug-related tickets.' },
        ],
      },
      {
        slug: 'notifications',
        title: 'Notifications',
        description: 'Announcements, in-app notifications, email sends, and notification history.',
        subpages: [
          { slug: 'send', title: 'Send Notification', description: 'Broadcast messages by role or audience.' },
          { slug: 'email-announcements', title: 'Email Announcements', description: 'Send email campaigns and notices.' },
          { slug: 'in-app', title: 'Push/In-App Notifications', description: 'Manage platform notification delivery.' },
          { slug: 'history', title: 'Notification History', description: 'Audit past notification sends.' },
        ],
      },
      {
        slug: 'settings',
        title: 'Settings',
        description: 'Operational configuration for the platform, billing, AI, email, SEO, and security.',
        subpages: [
          { slug: 'general', title: 'General Settings', description: 'Manage platform identity and maintenance mode.' },
          { slug: 'payments', title: 'Payment Settings', description: 'Configure payment gateways and commission.' },
          { slug: 'ai', title: 'AI Settings', description: 'Control AI provider and API settings.' },
          { slug: 'email', title: 'Email Settings', description: 'Manage SMTP and notification sender setup.' },
          { slug: 'seo', title: 'SEO Settings', description: 'Configure metadata, indexing, and links.' },
          { slug: 'security', title: 'Security Settings', description: 'Review access and platform security configuration.' },
        ],
      },
      {
        slug: 'audit-logs',
        title: 'Audit Logs',
        description: 'Review admin actions, role changes, approval history, and status mutations.',
        subpages: [],
      },
    ],
  },
];

export const adminSections = adminSectionGroups.flatMap((group) => group.sections);

export function getAdminSection(sectionSlug?: string) {
  return adminSections.find((section) => section.slug === sectionSlug);
}

export function getAdminSubpage(sectionSlug?: string, subpageSlug?: string) {
  return getAdminSection(sectionSlug)?.subpages.find((subpage) => subpage.slug === subpageSlug);
}
