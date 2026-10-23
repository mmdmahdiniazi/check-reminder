/**
 * ابزارهای قالب‌بندی اعداد، متن و زمان برای نمایش در رابط کاربری.
 */

const PERSIAN_DIGITS = /[۰-۹]/g;
const ARABIC_DIGITS = /[٠-٩]/g;

/**
 * ارقام فارسی (۰-۹) و عربی (٠-٩) را به ارقام انگلیسی تبدیل می‌کند.
 * کاربرانی که با کیبورد فارسی تایپ می‌کنند، بدون این تبدیل هنگام پاک‌سازی
 * ورودی (`\D`) تمام ارقامشان حذف می‌شد.
 */
export function toEnglishDigits(value: string): string {
  return value
    .replace(PERSIAN_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(ARABIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

/**
 * متن را برای جستجو نرمال می‌کند تا نتیجه به نوع تایپ حساس نباشد:
 * ارقام انگلیسی، «ی» و «ک» فارسی (به‌جای معادل‌های عربی) و حروف کوچک.
 */
export function normalizeSearchText(value: string): string {
  return toEnglishDigits(value)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .trim()
    .toLowerCase();
}

/** عدد را با ارقام فارسی و جداکننده‌ی هزارگان نمایش می‌دهد (مثلاً ۵۰٬۰۰۰٬۰۰۰). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

/** مبلغ چک را (بدون واحد) قالب‌بندی می‌کند. */
export function formatAmount(amount: number): string {
  return formatNumber(amount);
}

/** شماره موبایل ۱۱ رقمی را به شکل «0912 345 6789» نمایش می‌دهد. */
export function formatMobile(mobile: string): string {
  return mobile.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

/** شماره صیادی را چهار رقم چهار رقم جدا می‌کند تا خواناتر باشد. */
export function formatSayadi(sayadiNumber: string): string {
  return sayadiNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** واحدهای زمانی از بزرگ به کوچک (بر حسب ثانیه) برای محاسبه‌ی زمان نسبی. */
const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/**
 * زمان نسبی به فارسی برمی‌گرداند؛ مثلاً «۳ ساعت پیش» یا «دیروز».
 * اگر تاریخ نامعتبر باشد، رشته‌ی خالی برمی‌گردد.
 */
export function formatRelativeTime(
  isoDate: string,
  now: Date = new Date(),
): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) return "";

  const diffInSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("fa-IR", { numeric: "auto" });

  for (const [unit, secondsInUnit] of RELATIVE_TIME_UNITS) {
    if (Math.abs(diffInSeconds) >= secondsInUnit) {
      return formatter.format(Math.round(diffInSeconds / secondsInUnit), unit);
    }
  }

  return "هم‌اکنون";
}
