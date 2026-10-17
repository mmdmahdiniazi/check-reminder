# Check Reminder

A lightweight Persian-language web app for managing received checks and tracking their due dates.

**Live Demo:** https://check-reminder-y17h.vercel.app/  
**Repository:** https://github.com/mmdmahdiniazi/check-reminder

Check Reminder helps users keep check details in one place, see approaching due dates, and review reminder notifications through a clean, responsive interface.

## Features

- **Check management:** create, view, edit, and delete check records.
- **Due-date tracking:** see each check's due-date status, including approaching, due today, and overdue states.
- **Dashboard summary:** view the total number of checks, the nearest due date, and checks due this week.
- **Reminder notifications:** view notifications stored in Supabase and mark them as read.
- **Search:** find registered checks from the list.
- **Form validation:** validate required fields, mobile number, 16-digit Sayadi number, Jalali due date, and positive amount.
- **Responsive UI:** layouts designed for desktop and mobile screens.
- **User feedback:** loading and error states, success/error toasts, and delete confirmation.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| React | User interface |
| TypeScript | Type safety |
| Vite | Development server and production build |
| Tailwind CSS | Styling and responsive layout |
| Supabase | Backend services and data storage |
| PostgreSQL | Database used through Supabase |
| Moment Jalaali | Jalali date handling and validation |
| ESLint | Code quality checks |

## Screenshots

Screenshots will be added here.

## Getting Started

### Requirements

- Node.js
- npm
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/mmdmahdiniazi/check-reminder.git
cd check-reminder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_key
```

Use your own Supabase project URL and public client key. Do not commit `.env.local` or expose a service-role or secret key in client-side environment variables.

### 4. Run locally

```bash
npm run dev
```

Vite will print the local development URL in the terminal.

### 5. Build for production

```bash
npm run build
```

The production build is generated in the `dist` directory.

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public client key |

Both variables must be configured in your deployment environment as well as locally.

## Project Structure

```text
src/
├── components/
│   ├── CheckCard.tsx
│   ├── CheckModal.tsx
│   ├── NotificationBell.tsx
│   └── Toast.tsx
├── lib/
│   └── supabase.ts
├── types/
│   └── check.ts
├── utils/
│   ├── date.ts
│   └── format.ts
├── App.tsx
├── index.css
└── main.tsx
```

## V1 Scope

V1 focuses on the core check-management workflow: maintaining check records, tracking due dates, viewing reminder notifications, validating form data, and using the app on desktop or mobile.

Authentication, user-specific access control, and additional financial-management features are outside the current V1 scope.

## Deployment

The frontend is deployed on Vercel and uses Supabase for backend services.

- **Production app:** https://check-reminder-y17h.vercel.app/
- **GitHub repository:** https://github.com/mmdmahdiniazi/check-reminder

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings before deploying. Redeploy after changing environment variables.

## Author

**Mohammad Niazi**  
Frontend Developer / Computer Engineering Student

- GitHub: https://github.com/mmdmahdiniazi

## License

No formal open-source license has been added yet. Unless a license is added to the repository, reuse and redistribution are not granted by an explicit open-source license.
