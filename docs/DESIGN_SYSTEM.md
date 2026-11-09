# CheckReminder Design System

## 1. Product direction

CheckReminder is a Persian, RTL-first financial SaaS product for managing checks and due-date reminders. The visual direction is **Fintech Professional**: modern, calm, minimal, trustworthy, and operationally clear.

The redesign covers all existing application surfaces: authentication, the signed-in dashboard, check management, check forms, notifications, profile/account surfaces where present, and the existing admin panel.

## 2. Approved decisions

| Area | Approved decision |
|---|---|
| Visual style | Fintech Professional |
| Brand color family | Financial blue |
| Color mode | Light and dark themes, user-selectable |
| Desktop navigation | Fixed sidebar on the right |
| Mobile navigation | Bottom navigation bar |
| Motion | Subtle, short, purposeful transitions |
| Language and direction | Persian, RTL-first |
| Typeface | Vazirmatn |
| Scope | Full redesign of existing site surfaces |
| Product priority | Clarity, trust, readability, responsive behavior |

## 3. Color foundations

### Brand and semantic colors

| Token | Light value | Purpose |
|---|---|---|
| Brand primary | #2878D0 | Primary actions, active navigation, links |
| Brand navy | #172B4D | Strong headings and brand emphasis |
| Success | #16A36A | Successful or completed states |
| Warning | #E9A23B | Upcoming due dates and caution |
| Danger | #DC5353 | Overdue/error/destructive states |

### Light theme

| Token | Value |
|---|---|
| App background | #F5F7FB |
| Surface / card | #FFFFFF |
| Primary text | #172B4D |
| Secondary text | #64748B |
| Border | #E2E8F0 |
| Brand soft surface | #E8F1FC |

### Dark theme

| Token | Value |
|---|---|
| App background | #101827 |
| Surface / card | #1B293D |
| Primary text | #F1F5F9 |
| Secondary text | #A7B5C9 |
| Border | #2B3A50 |
| Brand soft surface | #1C354E |

Semantic states must preserve their meaning in both themes. Adjust contrast and luminance for accessibility; do not rely on color alone to communicate check status.

## 4. Typography

- Primary typeface: Vazirmatn.
- Page titles: 24–28px.
- Section/card titles: 16–18px.
- Body text: 14px.
- Supporting labels: 12px.
- Important financial values: 24–30px.
- Use clear weight hierarchy and sufficient line height for Persian text.
- Keep amounts and identifiers visually consistent; use LTR direction only where it improves reading of phone numbers, serials, or identifiers.
- Preserve Jalali date formatting and existing date behavior.

## 5. Layout and navigation

### Desktop
- Fixed right-side navigation rail/sidebar.
- Consistent top header for page title, notifications, account controls, and primary action where appropriate.
- Main content uses a readable maximum width and consistent spacing.
- Sidebar remains visible while the main content scrolls.

### Mobile
- Bottom navigation bar for the primary existing destinations.
- Compact header and touch-friendly controls.
- Forms use the available width and remain easy to complete.
- Check information must reflow into cards or stacked groups; avoid horizontal page scrolling.
- Keep primary actions reachable without obscuring content.

Navigation should expose only destinations and actions that already exist. Do not invent new product modules as part of the visual redesign.

## 6. Component foundations

Build or standardize reusable visual components for existing UI needs:
- Buttons (primary, secondary, outline, destructive, icon)
- Text inputs, selects, and date inputs
- Cards and summary/statistic cards
- Badges and check-status indicators
- Dialogs/modals
- Notification items and notification panel
- Empty, loading, and error states
- Desktop sidebar and mobile bottom navigation
- Account/profile menu and theme selector

Suggested visual measurements:
- Card radius: 12–16px.
- Button radius: 8–10px.
- Spacing scale: multiples of 4px and 8px.
- Shadows: subtle and reserved for elevation.
- Borders: thin, low-contrast, consistent.
- Icons: one consistent icon family and stroke weight.

## 7. Motion and accessibility

- Use short, subtle transitions for hover, focus, opening, and closing.
- Avoid decorative motion that distracts from financial information.
- Respect `prefers-reduced-motion`.
- Preserve visible keyboard focus.
- Ensure interactive controls have accessible labels and adequate touch targets.
- Maintain readable contrast in both themes.

## 8. Scope protection

This is a visual and interaction-layer redesign only. Unless separately approved, do not change:
- Supabase schema, tables, policies, or database functions.
- Authentication behavior or providers.
- Check creation, editing, deletion, or validation rules.
- Reminder scheduling or notification generation logic.
- Roles, plans, and authorization behavior.
- Existing business rules or product capabilities.
- The React/Vite/Supabase architecture.

## 9. Implementation and review sequence

1. Inspect the existing UI and map current screens/components.
2. Define theme tokens and shared foundations.
3. Implement the app shell and responsive navigation.
4. Redesign the dashboard.
5. Redesign check cards, list, and check form.
6. Redesign authentication and notifications.
7. Align the existing admin panel.
8. Verify desktop/mobile layouts and both themes.
9. Run build and lint checks and review behavior for regressions.

Each implementation stage must be presented for review before proceeding to the next. No code changes should begin until the user approves the proposed implementation plan.
