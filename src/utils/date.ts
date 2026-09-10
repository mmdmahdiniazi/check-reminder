import moment from "moment-jalaali";

export function getDaysRemaining(dueDate: string): number {
  const today = moment().startOf("day");
  const due = moment(dueDate, "jYYYY/jMM/jDD").startOf("day");

  return due.diff(today, "days");
}

export function getDaysRemainingText(dueDate: string): string {
  const days = getDaysRemaining(dueDate);

  if (days < 0) {
    return `${Math.abs(days)} روز گذشته`;
  }

  if (days === 0) {
    return "امروز";
  }

  if (days === 1) {
    return "فردا";
  }

  return `${days} روز مانده`;
}

export function getNearestDueDate(dueDates: string[]): string | null {
  const futureDates = dueDates
    .filter((date) => getDaysRemaining(date) >= 0)
    .sort((a, b) => getDaysRemaining(a) - getDaysRemaining(b));

  return futureDates[0] ?? null;
}

export function getDueThisWeek(dueDates: string[]): number {
  return dueDates.filter((date) => {
    const days = getDaysRemaining(date);

    return days >= 0 && days <= 7;
  }).length;
}

export function getReminderType(dueDate: string): number | null {
  const days = getDaysRemaining(dueDate);

  const reminderDays = [30, 15, 10, 7, 3];

  return reminderDays.includes(days) ? days : null;
}
