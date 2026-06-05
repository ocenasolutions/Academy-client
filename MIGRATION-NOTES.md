# Migration to Next.js App Router

## What Was Migrated
1. **Framework Transition:** Completely migrated the project from React + Vite to Next.js 15+ App Router.
2. **Directory Structure:** Transitioned `src/pages` to `src/app` using Next.js nested routing architecture (`page.tsx`, `layout.tsx`).
3. **Routing:** Replaced `react-router-dom` completely with `next/navigation` and `next/link`.
4. **CSS & Styling:** Migrated Vite's Tailwind integration to `@tailwindcss/postcss` for native Next.js compatibility, with all styles remaining in `src/app/globals.css`.
5. **State Management:** Preserved the global toast context and ensured `use client` directives are applied to fully interactive Next.js boundary components.

## Files Removed
* `vite.config.ts`
* `index.html` (Replaced by `src/app/layout.tsx` and Next.js internal document mechanisms)
* `src/main.tsx` (Replaced by Next.js app rendering flow)
* `src/App.tsx` (Replaced by Next.js App Router filesystem routing)

## Routes Created
* `/` -> `src/app/page.tsx`
* `/courses` -> `src/app/courses/page.tsx`
* `/courses/[id]` -> `src/app/courses/[id]/page.tsx`
* `/login` -> `src/app/login/page.tsx`
* `/register` -> `src/app/register/page.tsx`
* `/dashboard/student` -> `src/app/dashboard/student/page.tsx`
* `/dashboard/instructor` -> `src/app/dashboard/instructor/page.tsx`
* `/dashboard/admin` -> `src/app/dashboard/admin/page.tsx`
* `/course/[courseId]/lesson/[lessonId]` -> `src/app/course/[courseId]/lesson/[lessonId]/page.tsx`
* `/checkout/[courseId]` -> `src/app/checkout/[courseId]/page.tsx`
* `/certificate/[certificateId]` -> `src/app/certificate/[certificateId]/page.tsx`
* `/settings` -> `src/app/settings/page.tsx`

## Manual Checks
* Hydration errors check on static data pages (e.g. dummy datasets with client rendering hooks).
* Image loading (for production use `next/image` to replace standard `<img>` tags).
