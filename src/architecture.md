# Enterprise SPA Architecture (Feature-Sliced Design)

This workspace follows a highly scalable, senior-level architecture patterned similarly to Next.js App Router or standard enterprise SPA conventions (often utilizing Feature-Sliced Design). This structure isolates distinct domain responsibilities, making future migrations (like transitioning to Next.js) significantly easier.

## Directory Structure Overview

```text
src/
â”œâ”€â”€ components/          # Shared components used globally
â”‚   â”œâ”€â”€ ui/              # Atomic design components (Buttons, Inputs, Modals)
â”‚   â””â”€â”€ layout/          # Structural layout wrappers (Headers, Navigation)
â”œâ”€â”€ features/            # Feature-driven modules (Domain specific)
â”‚   â”œâ”€â”€ auth/            # Auth logic, auth API, and Login/Register UI
â”‚   â”œâ”€â”€ courses/         # Course viewing, catalogs, and interactions
â”‚   â””â”€â”€ dashboard/       # Dashboard interfaces for Students/Instructors
â”œâ”€â”€ hooks/               # Globally shared React hooks (e.g., useWindowSize, useAuth)
â”œâ”€â”€ lib/                 # Shared utilities, external service configurations (Axios, APIs)
â”œâ”€â”€ pages/               # Top-level Page entries grouping feature components
â”œâ”€â”€ providers/           # React context providers (e.g., ThemeProvider, AuthProvider)
â”œâ”€â”€ services/            # Base API service handlers and Data access layers
â””â”€â”€ types/               # Globally distributed TypeScript interfaces
```

## Migration Readiness (Next.js context)

Because this structure isolates business logic and domain concerns into the \`features/\` and \`components/\` folders, migrating to a Next.js framework in the future would simply involve:
1. Translating the \`/pages\` directory into Next.js \`/app\` routing structures (e.g., \`app/(dashboard)/layout.tsx\`).
2. Adopting \`"use client"\` tags for state-driven feature components.
3. Replacing React-Router's \`<Link>\` and \`useNavigate\` with Next.js's \`next/link\` and \`useRouter\`.
