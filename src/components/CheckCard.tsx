import type { Check } from "../types/check";

import { useState } from "react";

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
      };
    }

    if (daysRemaining === 0) {
      return {
        label: "سررسید امروز",
        dot: "bg-red-600",
        text: "text-red-600",
        bg: "bg-red-50",
      };
    }

    if (daysRemaining === 1) {
      return {
        label: "سررسید فردا",
        dot: "bg-red-500",
        text: "text-red-500",
        bg: "bg-red-50",
      };
    }

    if (daysRemaining <= 3) {
      return {
        label: "خیلی نزدیک",
        dot: "bg-red-500",
        text: "text-red-500",
        bg: "bg-red-50",
      };
    }

    if (daysRemaining <= 7) {
      return {
        label: "نزدیک به سررسید",
        dot: "bg-orange-500",
        text: "text-orange-600",
        bg: "bg-orange-50",
      };
    }

    return {
      label: "عادی",
      dot: "bg-green-500",
      text: "text-green-600",
      bg: "bg-green-50",
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
    <article className="rounded-xl border bg-white p-4 transition hover:shadow-sm sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-gray-900 sm:text-lg">
            {check.ownerName}
          </h3>

          <p className="mt-1 text-sm text-gray-500">{check.bank}</p>
        </div>

        <div className="shrink-0 text-left">
          <p className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            {formatAmount(check.amount)}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">تومان</p>
        </div>
      </div>

      {/* Due date / status */}
      <div className="mt-4 rounded-xl bg-gray-50 p-3.5 sm:mt-5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">تاریخ سررسید</p>

            <p
              className="mt-1 text-base font-bold text-gray-900 sm:text-lg"
              dir="ltr"
            >
              {check.dueDate}
            </p>
          </div>

          <div
            className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 ${status.bg}`}
          >
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />

            <span className={`text-xs font-semibold sm:text-sm ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className={`text-sm font-semibold ${status.text}`}>
            {daysRemainingText}
          </p>
        </div>
      </div>

      {/* Secondary information */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-white px-3 py-2.5">
          <p className="text-xs text-gray-400">شماره صیادی</p>

          <p
            className="mt-1 truncate text-sm font-medium text-gray-800"
            dir="ltr"
          >
            {check.sayadiNumber}
          </p>
        </div>

        <div className="rounded-lg border bg-white px-3 py-2.5">
          <p className="text-xs text-gray-400">شماره موبایل</p>

          <p className="mt-1 text-sm font-medium text-gray-800" dir="ltr">
            {formatMobile(check.mobile)}
          </p>
        </div>
      </div>

      {/* Delete confirmation */}
      {isConfirmingDelete ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5">
          <p className="text-sm font-medium text-red-700">
            آیا از حذف این چک مطمئن هستید؟
          </p>

          <p className="mt-1 text-xs leading-5 text-red-500">
            این عملیات قابل بازگشت نیست.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="min-h-11 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="min-h-11 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
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
        /* Actions */
        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() => onEdit(check)}
            disabled={isDeleting}
            className="min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ویرایش
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="min-h-11 rounded-lg border border-red-100 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            حذف
          </button>
        </div>
      )}
    </article>
  );
}

export default CheckCard;
