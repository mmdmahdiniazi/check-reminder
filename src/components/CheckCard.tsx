import { useState } from "react";

import type { Check } from "../types/check";

import { formatAmount, formatMobile } from "../utils/format";

import { getDaysRemaining, getDaysRemainingText } from "../utils/date";

type CheckCardProps = {
  check: Check;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
};

function CheckCard({
  check,
  onEdit,
  onDelete,
  isDeleting = false,
}: CheckCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const daysRemaining = getDaysRemaining(check.dueDate);
  const daysRemainingText = getDaysRemainingText(check.dueDate);

  const getStatus = () => {
    if (daysRemaining < 0) {
      return {
        label: "سررسید گذشته",
        dot: "bg-gray-400",
        text: "text-gray-500",
        bg: "bg-gray-100",
        border: "border-gray-200",
      };
    }

    if (daysRemaining === 0) {
      return {
        label: "سررسید امروز",
        dot: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-100",
      };
    }

    if (daysRemaining === 1) {
      return {
        label: "سررسید فردا",
        dot: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-100",
      };
    }

    if (daysRemaining <= 3) {
      return {
        label: "خیلی نزدیک",
        dot: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-100",
      };
    }

    if (daysRemaining <= 7) {
      return {
        label: "نزدیک به سررسید",
        dot: "bg-orange-500",
        text: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-100",
      };
    }

    return {
      label: "عادی",
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    };
  };

  const status = getStatus();

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
    <article className="group rounded-2xl border border-gray-200/80 bg-white p-4 transition duration-200 hover:border-gray-300 hover:shadow-sm sm:p-5">
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

      <div
        className={`mt-5 rounded-xl border p-4 ${status.bg} ${status.border}`}
      >
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
            className={`rounded-lg bg-white/80 px-2.5 py-2 text-xs font-semibold ${status.text} sm:text-sm`}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-3 border-t border-black/5 pt-3">
          <p className={`text-sm font-semibold ${status.text}`}>
            {daysRemainingText}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 px-3.5 py-3">
          <p className="text-xs text-gray-400">شماره صیادی</p>

          <p
            className="mt-1.5 truncate text-sm font-medium text-gray-700"
            dir="ltr"
          >
            {check.sayadiNumber}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 px-3.5 py-3">
          <p className="text-xs text-gray-400">شماره موبایل</p>

          <p className="mt-1.5 text-sm font-medium text-gray-700" dir="ltr">
            {formatMobile(check.mobile)}
          </p>
        </div>
      </div>

      {isConfirmingDelete ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5">
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
