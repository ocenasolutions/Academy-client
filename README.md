# Academy Client

Frontend for the Academy LMS and course marketplace.

## What it does

- Student marketplace and course player
- Instructor dashboard
- Admin dashboard
- Course enrollment, progress, certificates, payments, and support
- Admin login with OTP

## Local Development

Prerequisites:
- Node.js 22+

Install dependencies:
```bash
npm install
```

Run locally:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Start production build:
```bash
npm run start
```

## Environment

Create a `.env.local` file with:

For local backend testing, you can point it to:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## Test Accounts

Seeded accounts use:

```text
Password123!
```

## Notes

- This repo is the frontend only.
- The app is a Next.js project and is deployed separately from the backend.
