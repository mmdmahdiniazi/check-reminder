# Check Reminder

A simple, lightweight Persian check management and due-date reminder application built with React, TypeScript, Tailwind CSS and Supabase.

**Check Reminder** is designed to provide a focused solution for recording received checks, tracking their due dates, and making upcoming payments easier to remember.

---

## Overview

Managing multiple checks can quickly become difficult, especially when due dates are spread across different days.

Check Reminder keeps the process simple:

- Register received checks
- Store important check information
- Track due dates
- Display the nearest upcoming due date
- Identify checks due during the current week
- Show the current status of each check
- Edit or delete existing checks
- Generate due-date reminder notifications
- Search through registered checks

The project intentionally keeps the interface simple and focused instead of turning into a full accounting or financial management system.

---

## Features

### Check Management

Each check can contain:

- Owner name
- Mobile number
- Bank
- Sayadi number
- Serial number
- Due date
- Amount

Users can:

- Add a new check
- Edit an existing check
- Delete a check
- View all registered checks

### Due Date Tracking

Each check displays its current due-date status.

Depending on the remaining time, the application identifies checks as:

- Normal
- Approaching due date
- Very close
- Due tomorrow
- Due today
- Past due

The dashboard also provides:

- Total number of checks
- Nearest due date
- Number of checks due this week

### Notifications

The application generates reminder records for upcoming check due dates.

Notifications are stored in Supabase and can be accessed through the notification interface.

### Form Validation

The check registration form includes validation for:

- Owner name
- Mobile number
- Bank
- 16-digit Sayadi number
- Serial number
- Jalali due date
- Positive check amount

### Responsive UI

The interface is designed for both desktop and mobile screens.

The layout adapts to smaller displays while keeping the main actions easily accessible.

### User Feedback

The application provides feedback for important operations through:

- Loading states
- Success messages
- Error messages
- Toast notifications
- Confirmation before deleting a check

---

## Tech Stack

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| React          | UI development                 |
| TypeScript     | Type safety                    |
| Vite           | Development and build tooling  |
| Tailwind CSS   | Styling and responsive layout  |
| Supabase       | Database and backend services  |
| PostgreSQL     | Data storage through Supabase  |
| Moment Jalaali | Persian/Jalali date validation |
| ESLint         | Code quality and linting       |

---

## Project Structure

```text
check-reminder/
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── CheckCard.tsx
│   │   ├── CheckModal.tsx
│   │   ├── NotificationBell.tsx
│   │   └── Toast.tsx
│   │
│   ├── lib/
│   │   └── supabase.ts
│   │
│   ├── types/
│   │   └── check.ts
│   │
│   ├── utils/
│   │   ├── date.ts
│   │   └── format.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- A Supabase project

### Installation

Clone the repository:

```bash
git clone https://github.com/mmdmahdiniazi/check-reminder.git
```

Move into the project directory:

```bash
cd check-reminder
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then start the development server:

```bash
npm run dev
```

The application will be available through the local Vite development server.

---

## Environment Variables

The project uses the following environment variables:

| Variable                 | Description                       |
| ------------------------ | --------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL              |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |

Environment files are excluded from Git through `.gitignore`.

**Never commit private API keys, service-role keys, passwords, or other secrets to the repository.**

---

## Database

The application uses Supabase as its backend.

The main data entities are:

### `checks`

Stores registered check information.

Typical fields include:

```text
id
bank
sayadi_number
serial_number
due_date
amount
owner_name
mobile
created_at
```

### `notifications`

Stores generated due-date reminder records.

Typical fields include:

```text
id
check_id
title
message
reminder_type
created_at
```

---

## Design Principles

Check Reminder follows a few simple principles:

### Focus

The application focuses on one core problem:

> Remembering and managing check due dates.

### Simplicity

The interface avoids unnecessary financial/accounting features and keeps the main workflow short.

### Mobile First

Important actions and information remain accessible on smaller screens.

### Clear Feedback

Every important user action should provide an understandable result.

### Maintainability

The project separates:

- UI components
- Data access
- Types
- Date utilities
- Formatting utilities

This keeps the codebase easier to maintain and extend.

---

## Current Version

**Version:** `V1`

**Status:** Frozen / Initial Release

V1 represents the first stable version of the application's defined scope.

The current version intentionally does not attempt to become a complete accounting platform.

---

## V1 Scope

Included in V1:

- Check registration
- Check editing
- Check deletion
- Check list
- Check information display
- Due-date status
- Nearest due date
- Weekly due-date count
- Reminder notification records
- Form validation
- Search field UI
- Responsive interface
- Loading states
- Error handling
- Toast feedback
- Supabase integration

The scope of V1 is considered complete and frozen.

---

## Future Development

Future versions may introduce additional capabilities depending on product decisions and user requirements.

Potential directions could include:

- Authentication
- User-specific check management
- Advanced search and filtering
- More detailed notification management
- Better notification scheduling
- Check categorization
- Dashboard improvements
- Mobile application
- Additional financial tracking capabilities

These features are **not part of V1**.

---

## Repository

GitHub:

https://github.com/mmdmahdiniazi/check-reminder

---

## Author

**Mohammad Niazi**

Frontend Developer / Computer Engineering Student

GitHub:

https://github.com/mmdmahdiniazi

---

## License

This project is currently published for portfolio, learning, and development purposes.

A formal open-source license can be added in the future if the project is officially released under one.
