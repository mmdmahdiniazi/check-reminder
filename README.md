# Check Reminder

A Persian, mobile-first cheque management web app built with React, TypeScript, Tailwind CSS, and Supabase. It helps users manage cheques, track Jalali due dates, and review reminder notifications.

**Current version:** `2.0.0`  
**Live app:** https://check-reminder-y17h.vercel.app/  
**Repository:** https://github.com/mmdmahdiniazi/check-reminder

## Features

- **Authentication:** sign up and sign in with Supabase.
- **Cheque management:** create, view, edit, and delete cheque records.
- **Jalali due dates:** validate and track cheque due dates, including upcoming, due-today, and overdue states.
- **Dashboard:** see cheque totals, the nearest due date, and cheques due this week.
- **Notifications:** review in-app reminders and mark notifications as read.
- **Search:** find cheques from the dashboard.
- **Role and plan management:** admin panel for user and plan management, backed by Supabase RPC functions.
- **Validation and feedback:** validate required fields, mobile number, 16-digit Sayadi number, Jalali date, and positive amount; show loading, error, success, and confirmation states.
- **Responsive interface:** light, modern fintech styling with Persian typography, designed for desktop and mobile.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| React 19 | User interface |
| TypeScript | Type safety |
| Vite | Development server and production build |
| Tailwind CSS 4 | Styling and responsive layout |
| Supabase | Authentication, database, and backend functions |
| PostgreSQL | Data storage through Supabase |
| Moment Jalaali | Jalali date handling |
| ESLint | Code quality checks |

## Requirements

- Node.js compatible with the installed Vite version
- npm
- A Supabase project configured for this app

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/mmdmahdiniazi/check-reminder.git
cd check-reminder
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
# Or use the legacy public anon key variable instead:
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use your own Supabase project URL and public client key. The app accepts `VITE_SUPABASE_PUBLISHABLE_KEY` (recommended) or the legacy `VITE_SUPABASE_ANON_KEY` variable. Set one of those key variables, not both. Never put a service-role key or any private secret in a `VITE_*` client-side variable. Configure the same variables in your deployment environment.

### 4. Start the development server

```bash
npm run dev
```

### 5. Validate and build

```bash
npm run lint
npm run build
```

The production build is generated in `dist/`. To preview it locally:

```bash
npm run preview
```

## Supabase setup

The app relies on Supabase for authentication and persisted data. Database tables, Row Level Security policies, RPC functions, and scheduled reminder infrastructure must be configured in the Supabase project using the project's SQL migrations and deployment setup. A successful frontend build does not apply these backend changes automatically.

Ensure the required schema and policies are deployed before using the app in production. Never disable Row Level Security as a workaround.

## Phone OTP authentication (Melli Payamak)

The sign-in screen includes phone-number OTP authentication. This flow uses Supabase Phone Auth for OTP generation and verification, with a Supabase Auth **Send SMS Hook** forwarding the OTP to Melli Payamak. Email/password authentication remains available.

### Backend setup required before enabling phone login

1. In Supabase, enable **Authentication → Sign In / Providers → Phone** and configure OTP expiry and rate limits.
2. Deploy the Edge Function from `supabase/functions/send-sms-hook/index.ts`. Deploy it with JWT verification disabled because Supabase Auth authenticates this hook with its signed webhook secret; the function validates that signature itself:
   ```bash
   supabase functions deploy send-sms-hook --no-verify-jwt
   ```
3. Set these secrets in the Supabase project (never in Vite environment variables or source control):
   ```bash
   supabase secrets set SEND_SMS_HOOK_SECRET="v1,whsec_<hook-secret>"
   supabase secrets set MELIPAYAMAK_USERNAME="<panel-username>"
   supabase secrets set MELIPAYAMAK_PASSWORD="<panel-password>"
   supabase secrets set MELIPAYAMAK_SENDER="<approved-sender-number>"
   ```
   The hook secret is generated/displayed when configuring the Auth **Send SMS Hook**. Store the matching secret in Supabase Edge Function secrets.
4. In **Authentication → Hooks**, configure **Send SMS Hook** to call the deployed `send-sms-hook` Edge Function URL and use the same hook signing secret.
5. Verify that the Melli Payamak account has API access, credit, and an approved sender number that can deliver authentication messages. The function currently uses the standard REST `SendSMS` endpoint. If the panel requires a service-pattern endpoint for delivery to blocked numbers, adapt the sender implementation to the approved pattern and template.
6. Test with a controlled number before production. Configure CAPTCHA and sensible OTP request limits to reduce abuse.

**Important account/data note:** phone OTP may create a distinct Supabase user from an existing email/password account, even when both methods belong to the same person. Existing cheque records are scoped to their current user ID. Keep email login available and do not assume existing records automatically appear in a new phone-auth account; existing-account linking or a verified data migration must be handled deliberately.

The SMS hook keeps Melli Payamak credentials server-side, validates the signed Supabase webhook, validates the recipient and OTP payload, and avoids logging the OTP or credentials. A successful provider response means the provider accepted the request; it does not guarantee handset delivery.

## Project structure

```text
src/
├── components/
│   ├── ui/                 # Reusable shadcn-style UI primitives
│   ├── AdminPanel.tsx
│   ├── CheckCard.tsx
│   ├── CheckModal.tsx
│   ├── NotificationBell.tsx
│   └── Toast.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── types/
│   └── check.ts
├── utils/
│   ├── date.ts
│   └── format.ts
├── App.tsx
├── AuthGate.tsx
├── index.css
└── main.tsx
```

The exact structure may evolve as the project develops.

## Versioning

This project uses Semantic Versioning (`MAJOR.MINOR.PATCH`):

- **MAJOR**: incompatible changes or a significant release boundary.
- **MINOR**: new backward-compatible functionality.
- **PATCH**: backward-compatible fixes and small refinements.

The V1 baseline was `1.0.0`. Version `2.0.0` marks the next major project milestone, including the redesigned responsive interface and the expanded authenticated user/admin experience. The package version in `package.json` and `package-lock.json` should always match.

See [CHANGELOG.md](./CHANGELOG.md) for release notes. Use Git tags in the format `vX.Y.Z` when publishing a release.

## Deployment

The frontend is deployed on Vercel and uses Supabase for backend services.

- **Production app:** https://check-reminder-y17h.vercel.app/
- **Repository:** https://github.com/mmdmahdiniazi/check-reminder

Set `VITE_SUPABASE_URL` and either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` in Vercel project settings, then redeploy after environment changes.

## License

No formal open-source license has been added. Until a license is included, the repository does not grant an explicit open-source reuse or redistribution license.
