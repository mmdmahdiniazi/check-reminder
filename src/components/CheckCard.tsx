import { useEffect, useState } from "react";

import type { Check } from "../types/check";

import { formatAmount, formatMobile, formatSayadi } from "../utils/format";

import { getDaysRemaining, getDaysRemainingText } from "../utils/date";

type CheckCardProps = {
  check: Check;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  /** وقتی true باشد، این کارت در حال حذف است و دکمه‌هایش غیرفعال می‌شوند */
  isDeleting?: boolean;
};

/** کلاس‌های رنگی مربوط به هر سطح فوریت سررسید */
type DueStatus = {
  label: string;
  /** نوار رنگی باریک کنار کارت */
  accent: string;
  /** نقطه‌ی رنگی کنار نام صاحب چک */
  dot: string;
  /** رنگ متن وضعیت */
  text: string;
  /** پس‌زمینه و حاشیه‌ی بخش تاریخ سررسید */
  panel: string;
};

/**
 * بر اساس تعداد روزهای مانده، برچسب و رنگ وضعیت را تعیین می‌کند:
 * گذشته (خاکستری) ← امروز/فردا/تا ۳ روز (قرمز) ← تا ۷ روز (نارنجی) ← عادی (سبز)
 */
function getDueStatus(daysRemaining: number): DueStatus {
  if (daysRemaining < 0) {
    return {
      label: "سررسید گذشته",
      accent: "bg-gray-300",
      dot: "bg-gray-400",
      text: "text-gray-600",
      panel: "border-gray-200 bg-gray-50",
    };
  }

  if (daysRemaining === 0) {
    return {
      label: "سررسید امروز",
      accent: "bg-red-500",
      dot: "bg-red-500",
      text: "text-red-600",
      panel: "border-red-100 bg-red-50",
    };
  }

  if (daysRemaining === 1) {
    return {
      label: "سررسید فردا",
      accent: "bg-red-500",
      dot: "bg-red-500",
      text: "text-red-600",
      panel: "border-red-100 bg-red-50",
    };
  }

  if (daysRemaining <= 3) {
    return {
      label: "خیلی نزدیک",
      accent: "bg-red-500",
      dot: "bg-red-500",
      text: "text-red-600",
      panel: "border-red-100 bg-red-50",
    };
  }

  if (daysRemaining <= 7) {
    return {
      label: "نزدیک به سررسید",
      accent: "bg-orange-500",
      dot: "bg-orange-500",
      text: "text-orange-600",
      panel: "border-orange-100 bg-orange-50",
    };
  }

  return {
    label: "عادی",
    accent: "bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    panel: "border-emerald-100 bg-emerald-50",
  };
}

/**
 * کارت نمایش یک چک: مبلغ، وضعیت سررسید، شماره صیادی و موبایل،
 * همراه با دکمه‌های ویرایش و حذف (حذف با تأیید دو مرحله‌ای).
 */
function CheckCard({
  check,
  onEdit,
  onDelete,
  isDeleting = false,
}: CheckCardProps) {
  // آیا کاربر روی «حذف» زده و منتظر تأیید نهایی است؟
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // بازخورد کوتاه بعد از کپی شماره صیادی
  const [copied, setCopied] = useState(false);

  const daysRemaining = getDaysRemaining(check.dueDate);
  const daysRemainingText = getDaysRemainingText(check.dueDate);
  const status = getDueStatus(daysRemaining);

  // پیام «کپی شد» بعد از ۱٫۸ ثانیه خودکار محو می‌شود
  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1800);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopySayadi = async () => {
    try {
      await navigator.clipboard.writeText(check.sayadiNumber);
      setCopied(true);
    } catch {
      // کلیپ‌بورد ممکن است در محیط ناامن (HTTP) یا بدون مجوز در دسترس نباشد؛
      // چون عملیات حیاتی نیست، بی‌صدا نادیده گرفته می‌شود.
    }
  };

  const handleDeleteClick = () => {
    if (isDeleting) return;

    setIsConfirmingDelete(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;

    setIsConfirmingDelete(false);
  };

  const handleConfirmDelete = () => {
    if (isDeleting) return;

    onDelete(check.id);
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-card-hover sm:p-5">
      {/* نوار رنگی کنار کارت که فوریت سررسید را در یک نگاه نشان می‌دهد */}
      <span
        className={`absolute inset-y-0 start-0 w-1 ${status.accent}`}
        aria-hidden="true"
      />

      {/* بالای کارت: نام صاحب چک، بانک و مبلغ */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`}
              aria-hidden="true"
            />

            <h3 className="truncate text-base font-bold text-gray-950 sm:text-lg">
              {check.ownerName}
            </h3>
          </div>

          <p className="mt-2 text-sm text-gray-500">{check.bank}</p>
        </div>

        <div className="shrink-0 text-left">
          <p className="text-lg font-bold tracking-tight text-gray-950 sm:text-xl">
            {formatAmount(check.amount)}
          </p>

          <p className="mt-1 text-xs text-gray-400">تومان</p>
        </div>
      </div>

      {/* بخش تاریخ سررسید و وضعیت (رنگ آن با فوریت تغییر می‌کند) */}
      <div className={`mt-5 rounded-xl border p-4 ${status.panel}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">تاریخ سررسید</p>

            <p
              className="mt-1.5 text-base font-bold text-gray-950 sm:text-lg"
              dir="ltr"
            >
              {check.dueDate}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-2 text-xs font-semibold ${status.text} sm:text-sm`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
              aria-hidden="true"
            />
            {status.label}
          </span>
        </div>

        <div className="mt-3 border-t border-black/5 pt-3">
          <p className={`text-sm font-semibold ${status.text}`}>
            {daysRemainingText}
          </p>
        </div>
      </div>

      {/* اطلاعات تکمیلی: شماره صیادی (قابل کپی) و موبایل (قابل تماس) */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">شماره صیادی</p>

            <button
              type="button"
              onClick={() => void handleCopySayadi()}
              aria-label="کپی شماره صیادی"
              className="-my-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
            >
              {copied ? "کپی شد ✓" : "کپی"}
            </button>
          </div>

          <p
            className="mt-1.5 break-all text-sm font-medium tabular-nums text-gray-700"
            dir="ltr"
          >
            {formatSayadi(check.sayadiNumber)}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 px-3.5 py-3">
          <p className="text-xs text-gray-400">شماره موبایل</p>

          {/* با کلیک روی شماره، در موبایل مستقیم تماس گرفته می‌شود */}
          <a
            href={`tel:${check.mobile}`}
            className="mt-1.5 block text-sm font-medium tabular-nums text-gray-700 transition hover:text-brand-600"
            dir="ltr"
          >
            {formatMobile(check.mobile)}
          </a>
        </div>
      </div>

      {/* پایین کارت: یا تأیید حذف، یا دکمه‌های ویرایش/حذف */}
      {isConfirmingDelete ? (
        <div
          role="group"
          aria-label="تأیید حذف چک"
          className="animate-fade-in mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5"
        >
          <p className="text-sm font-semibold text-red-700">
            حذف این چک انجام شود؟
          </p>

          <p className="mt-1 text-xs leading-5 text-red-500">
            اطلاعات این چک قابل بازیابی نیست.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              // گزینه‌ی ایمن‌تر (انصراف) به‌صورت پیش‌فرض فوکوس می‌گیرد
              autoFocus
              className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="min-h-11 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  در حال حذف...
                </span>
              ) : (
                "حذف چک"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => onEdit(check)}
            disabled={isDeleting}
            className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            ویرایش
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="min-h-11 flex-1 rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            حذف
          </button>
        </div>
      )}
    </article>
  );
}

export default CheckCard;
