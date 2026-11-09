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

  const status =
    daysRemaining < 0
      ? { label: "سررسید گذشته", color: "var(--muted-foreground)" }
      : daysRemaining === 0
        ? { label: "سررسید امروز", color: "var(--danger)" }
        : daysRemaining === 1
          ? { label: "سررسید فردا", color: "var(--danger)" }
          : daysRemaining <= 3
            ? { label: "خیلی نزدیک", color: "var(--danger)" }
            : daysRemaining <= 7
              ? { label: "نزدیک به سررسید", color: "var(--warning)" }
              : { label: "عادی", color: "var(--success)" };

  const handleDeleteClick = () => {
    if (!isDeleting) setIsConfirmingDelete(true);
  };
  const handleCancelDelete = () => {
    if (!isDeleting) setIsConfirmingDelete(false);
  };
  const handleConfirmDelete = () => {
    if (!isDeleting) onDelete(check.id);
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm shadow-slate-950/[0.025] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary opacity-70" />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />
            <h3 className="truncate text-base font-extrabold text-foreground sm:text-lg">{check.ownerName}</h3>
          </div>
          <p className="mt-2 pr-5 text-sm text-muted-foreground">{check.bank}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-left">
          <p className="text-lg font-extrabold tracking-tight text-primary sm:text-xl">{formatAmount(check.amount)}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">تومان</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border p-4" style={{
        borderColor: "color-mix(in srgb, " + status.color + " 22%, var(--border))",
        backgroundColor: "color-mix(in srgb, " + status.color + " 7%, var(--card))",
      }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">تاریخ سررسید</p>
            <p className="mt-1.5 text-base font-extrabold tracking-wide text-foreground sm:text-lg" dir="ltr">{check.dueDate}</p>
          </div>
          <span className="rounded-lg border px-3 py-2 text-xs font-bold sm:text-sm" style={{
            color: status.color,
            borderColor: "color-mix(in srgb, " + status.color + " 24%, transparent)",
            backgroundColor: "var(--card)",
          }}>{status.label}</span>
        </div>
        <div className="mt-3 border-t border-border/70 pt-3"><p className="text-sm font-bold" style={{ color: status.color }}>{daysRemainingText}</p></div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/60 px-3.5 py-3">
          <p className="text-xs font-medium text-muted-foreground">شماره صیادی</p>
          <p className="mt-1.5 break-all text-sm font-semibold text-foreground" dir="ltr">{check.sayadiNumber}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/60 px-3.5 py-3">
          <p className="text-xs font-medium text-muted-foreground">شماره موبایل</p>
          <p className="mt-1.5 text-sm font-semibold text-foreground" dir="ltr">{formatMobile(check.mobile)}</p>
        </div>
      </div>

      {isConfirmingDelete ? (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5">
          <p className="text-sm font-bold text-destructive">حذف این چک انجام شود؟</p>
          <p className="mt-1 text-xs leading-5 text-destructive/80">اطلاعات این چک قابل بازیابی نیست.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={handleCancelDelete} disabled={isDeleting} className="min-h-11 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">انصراف</button>
            <button type="button" onClick={handleConfirmDelete} disabled={isDeleting} className="min-h-11 rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70">
              {isDeleting ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />در حال حذف...</span> : "حذف چک"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2 border-t border-border pt-4">
          <button type="button" onClick={() => onEdit(check)} disabled={isDeleting} className="min-h-11 flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-24 sm:flex-none">ویرایش</button>
          <button type="button" onClick={handleDeleteClick} disabled={isDeleting} className="min-h-11 flex-1 rounded-xl border border-destructive/25 bg-card px-4 py-2.5 text-sm font-bold text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-24 sm:flex-none">حذف</button>
        </div>
      )}
    </article>
  );
}

export default CheckCard;
