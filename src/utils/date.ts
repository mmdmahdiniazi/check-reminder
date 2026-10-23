import moment from "moment-jalaali";

/**
 * ابزارهای کار با تاریخ شمسی (جلالی).
 * تاریخ سررسید چک‌ها همه‌جا به شکل رشته‌ی «jYYYY/jMM/jDD» (مثل 1405/07/20) است.
 */

/** فرمت تاریخ شمسی که در کل برنامه استفاده می‌شود. */
const JALALI_FORMAT = "jYYYY/jMM/jDD";

/** تعداد روزهای مانده تا سررسید که در آن‌ها اعلان یادآوری ساخته می‌شود. */
const REMINDER_DAYS = [30, 15, 10, 7, 3];

/**
 * تعداد روزهای مانده تا سررسید را برمی‌گرداند.
 * - مقدار مثبت: روزهای باقی‌مانده
 * - صفر: سررسید امروز
 * - مقدار منفی: چند روز از سررسید گذشته است
 */
export function getDaysRemaining(dueDate: string): number {
  const today = moment().startOf("day");
  const due = moment(dueDate, JALALI_FORMAT).startOf("day");

  return due.diff(today, "days");
}

/** متن خوانا برای نمایش وضعیت زمانی سررسید؛ مثل «۳ روز مانده» یا «فردا». */
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

/**
 * نزدیک‌ترین تاریخ سررسید در آینده (یا امروز) را برمی‌گرداند.
 * چک‌های گذشته نادیده گرفته می‌شوند؛ اگر هیچ چک آینده‌ای نباشد، `null`.
 */
export function getNearestDueDate(dueDates: string[]): string | null {
  const futureDates = dueDates
    .filter((date) => getDaysRemaining(date) >= 0)
    .sort((a, b) => getDaysRemaining(a) - getDaysRemaining(b));

  return futureDates[0] ?? null;
}

/** تعداد چک‌هایی که در ۷ روز آینده (از امروز) سررسید می‌شوند. */
export function getDueThisWeek(dueDates: string[]): number {
  return dueDates.filter((date) => {
    const days = getDaysRemaining(date);

    return days >= 0 && days <= 7;
  }).length;
}

/**
 * اگر امروز دقیقاً یکی از روزهای یادآوری (۳، ۷، ۱۰، ۱۵ یا ۳۰ روز مانده) باشد،
 * همان عدد را برمی‌گرداند؛ در غیر این صورت `null` تا اعلانی ساخته نشود.
 */
export function getReminderType(dueDate: string): number | null {
  const days = getDaysRemaining(dueDate);

  return REMINDER_DAYS.includes(days) ? days : null;
}
