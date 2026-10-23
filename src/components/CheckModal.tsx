import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import moment from "moment-jalaali";

import type { Check } from "../types/check";

import { formatAmount, toEnglishDigits } from "../utils/format";

type CheckModalProps = {
  /** چکِ در حال ویرایش؛ اگر خالی باشد، مودال در حالت «ثبت چک جدید» است */
  check?: Check | null;
  onClose: () => void;
  onSave: (check: Check) => void;
  isSaving?: boolean;
};

/** مقادیر فرم؛ همه‌ی فیلدها در فرم به‌صورت رشته نگه‌داری می‌شوند */
type FormValues = {
  ownerName: string;
  mobile: string;
  bank: string;
  sayadiNumber: string;
  serialNumber: string;
  dueDate: string;
  amount: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  ownerName: "",
  mobile: "",
  bank: "",
  sayadiNumber: "",
  serialNumber: "",
  dueDate: "",
  amount: "",
};

/** فهرست بانک‌های قابل انتخاب */
const BANKS = [
  "بانک ملی",
  "بانک ملت",
  "بانک صادرات",
  "بانک تجارت",
  "بانک رفاه",
  "بانک پاسارگاد",
  "بانک سامان",
  "بانک پارسیان",
  "بانک کشاورزی",
  "بانک مسکن",
  "بانک آینده",
  "سایر",
];

const inputBaseClass =
  "w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

/** مقدار اولیه‌ی فرم را از روی چکِ در حال ویرایش (یا فرم خالی) می‌سازد */
function toFormValues(check?: Check | null): FormValues {
  if (!check) return EMPTY_FORM;

  return {
    ownerName: check.ownerName,
    mobile: check.mobile,
    bank: check.bank,
    sayadiNumber: check.sayadiNumber,
    serialNumber: check.serialNumber,
    dueDate: check.dueDate,
    amount: String(check.amount),
  };
}

type FieldProps = {
  id: string;
  label: string;
  /** راهنمای زیر فیلد؛ هنگام نمایش خطا جایگزین آن می‌شود */
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
};

/** برچسب + فیلد + راهنما/خطا؛ برای یکدست‌بودن ظاهر و دسترس‌پذیری همه‌ی فیلدها */
function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-red-500"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * مودال ثبت / ویرایش چک.
 * این کامپوننت فقط هنگام باز بودن مودال mount می‌شود و والد با `key` آن را
 * برای هر چک از نو می‌سازد؛ بنابراین state اولیه‌ی فرم مستقیماً از `check`
 * خوانده می‌شود و نیازی به همگام‌سازی با useEffect نیست.
 */
function CheckModal({
  check,
  onClose,
  onSave,
  isSaving = false,
}: CheckModalProps) {
  const isEditing = Boolean(check);

  const [formData, setFormData] = useState<FormValues>(() =>
    toFormValues(check),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * پاک‌سازی ورودی هر فیلد هنگام تایپ:
   * - فیلدهای عددی: ارقام فارسی/عربی به انگلیسی تبدیل و کاراکترهای غیرعددی حذف می‌شوند
   * - تاریخ: فقط رقم و «/» مجاز است
   * سپس خطای همان فیلد پاک می‌شود تا کاربر فوراً بازخورد بگیرد.
   */
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const name = event.target.name as keyof FormValues;
    const rawValue = event.target.value;

    let value = rawValue;

    switch (name) {
      case "mobile":
        value = toEnglishDigits(rawValue).replace(/\D/g, "").slice(0, 11);
        break;
      case "sayadiNumber":
        value = toEnglishDigits(rawValue).replace(/\D/g, "").slice(0, 16);
        break;
      case "serialNumber":
        value = toEnglishDigits(rawValue).replace(/\D/g, "");
        break;
      case "amount":
        // سقف ۱۵ رقم تا عدد از محدوده‌ی دقیق جاوااسکریپت بیرون نزند
        value = toEnglishDigits(rawValue).replace(/\D/g, "").slice(0, 15);
        break;
      case "dueDate":
        value = toEnglishDigits(rawValue)
          .replace(/[^\d/]/g, "")
          .slice(0, 10);
        break;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  /** اعتبارسنجی همه‌ی فیلدها؛ در صورت وجود خطا، آن‌ها را در state می‌گذارد */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "نام صاحب چک را وارد کنید.";
    }

    const mobile = formData.mobile.replace(/\s/g, "");

    if (!mobile) {
      newErrors.mobile = "شماره موبایل را وارد کنید.";
    } else if (!/^09\d{9}$/.test(mobile)) {
      newErrors.mobile = "شماره موبایل باید ۱۱ رقم و با 09 شروع شود.";
    }

    if (!formData.bank) {
      newErrors.bank = "بانک را انتخاب کنید.";
    }

    const sayadiNumber = formData.sayadiNumber.replace(/\D/g, "");

    if (!sayadiNumber) {
      newErrors.sayadiNumber = "شماره صیادی را وارد کنید.";
    } else if (sayadiNumber.length !== 16) {
      newErrors.sayadiNumber = "شماره صیادی باید دقیقاً ۱۶ رقم باشد.";
    }

    const serialNumber = formData.serialNumber.replace(/\D/g, "");

    if (!serialNumber) {
      newErrors.serialNumber = "شماره سریال را وارد کنید.";
    }

    const dueDate = formData.dueDate.trim();

    if (!dueDate) {
      newErrors.dueDate = "تاریخ سررسید را وارد کنید.";
    } else if (!/^\d{4}\/\d{2}\/\d{2}$/.test(dueDate)) {
      newErrors.dueDate = "تاریخ را به شکل 1405/07/20 وارد کنید.";
    } else if (!moment(dueDate, "jYYYY/jMM/jDD", true).isValid()) {
      // حالت strict مانع قبول شدن تاریخ‌های ناموجود مثل 1405/13/45 می‌شود
      newErrors.dueDate = "تاریخ سررسید معتبر نیست.";
    }

    const amount = Number(formData.amount);

    if (!formData.amount) {
      newErrors.amount = "مبلغ را وارد کنید.";
    } else if (!Number.isFinite(amount) || amount <= 0) {
      newErrors.amount = "مبلغ باید بیشتر از صفر باشد.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    // مقادیر تمیزشده به والد تحویل داده می‌شود؛ ذخیره‌ی واقعی در App انجام می‌شود
    const savedCheck: Check = {
      id: check?.id ?? "",
      ownerName: formData.ownerName.trim(),
      mobile: formData.mobile.replace(/\s/g, ""),
      bank: formData.bank,
      sayadiNumber: formData.sayadiNumber.replace(/\D/g, ""),
      serialNumber: formData.serialNumber.replace(/\D/g, ""),
      dueDate: formData.dueDate.trim(),
      amount: Number(formData.amount),
    };

    onSave(savedCheck);
  };

  // بستن با Escape و جلوگیری از اسکرول صفحه‌ی پشت مودال
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onClose]);

  // با بسته‌شدن مودال، فوکوس به المانی که آن را باز کرده بود برمی‌گردد
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    return () => previouslyFocused?.focus?.();
  }, []);

  const getInputClass = (error?: string, extraClass = "") =>
    `${inputBaseClass} ${
      error
        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
        : "border-gray-200"
    } ${extraClass}`;

  /**
   * ویژگی‌های مشترک همه‌ی فیلدها (id، مقدار، رویداد و ویژگی‌های ARIA)
   * تا هر فیلد با خطا یا راهنمای خودش برای صفحه‌خوان‌ها مرتبط شود.
   */
  const getFieldProps = (
    name: keyof FormValues,
    options: { hasHint?: boolean; extraClass?: string } = {},
  ) => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name]
      ? `${name}-error`
      : options.hasHint
        ? `${name}-hint`
        : undefined,
    className: getInputClass(errors[name], options.extraClass),
  });

  // پیش‌نمایش زنده‌ی مبلغ با جداکننده‌ی هزارگان
  const amountNumber = Number(formData.amount);
  const amountPreview =
    Number.isFinite(amountNumber) && amountNumber > 0
      ? `${formatAmount(amountNumber)} تومان`
      : null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-gray-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        // فقط کلیک روی پس‌زمینه مودال را می‌بندد (نه کشیدن ماوس از داخل فرم به بیرون)
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-modal-title"
        className="animate-slide-up sm:animate-pop-in flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-xl sm:rounded-3xl"
      >
        {/* سربرگ مودال */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>

            <div className="min-w-0">
              <h2
                id="check-modal-title"
                className="truncate text-base font-bold text-gray-950"
              >
                {isEditing ? "ویرایش چک" : "ثبت چک جدید"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                اطلاعات چک را با دقت وارد کنید
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="بستن"
            className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* بدنه‌ی فرم (قابل اسکرول) */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <Field id="ownerName" label="نام صاحب چک" error={errors.ownerName}>
              <input
                {...getFieldProps("ownerName")}
                placeholder="مثلاً علی رضایی"
                autoComplete="name"
                autoFocus
              />
            </Field>

            <Field
              id="mobile"
              label="شماره موبایل"
              hint="شماره موبایل صاحب چک"
              error={errors.mobile}
            >
              <input
                {...getFieldProps("mobile", { hasHint: true })}
                placeholder="09121234567"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
                dir="ltr"
              />
            </Field>

            <Field id="bank" label="بانک" error={errors.bank}>
              <select {...getFieldProps("bank")}>
                <option value="">انتخاب بانک</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="sayadiNumber"
              label="شماره صیادی"
              hint="شماره ۱۶ رقمی درج‌شده روی چک"
              error={errors.sayadiNumber}
            >
              <input
                {...getFieldProps("sayadiNumber", {
                  hasHint: true,
                  extraClass: "tracking-[0.18em]",
                })}
                placeholder="16 رقم"
                maxLength={16}
                inputMode="numeric"
                dir="ltr"
              />
            </Field>

            {/* شماره سریال و تاریخ سررسید در دسکتاپ کنار هم قرار می‌گیرند */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="serialNumber"
                label="شماره سریال"
                error={errors.serialNumber}
              >
                <input
                  {...getFieldProps("serialNumber")}
                  placeholder="شماره سریال"
                  inputMode="numeric"
                  dir="ltr"
                />
              </Field>

              <Field
                id="dueDate"
                label="تاریخ سررسید"
                hint="فرمت: 1405/07/20"
                error={errors.dueDate}
              >
                <input
                  {...getFieldProps("dueDate", { hasHint: true })}
                  type="text"
                  placeholder="1405/07/20"
                  inputMode="numeric"
                  maxLength={10}
                  dir="ltr"
                />
              </Field>
            </div>

            <Field
              id="amount"
              label="مبلغ چک"
              hint={amountPreview ?? "مبلغ را بدون جداکننده وارد کنید"}
              error={errors.amount}
            >
              <div className="relative">
                <input
                  {...getFieldProps("amount", {
                    hasHint: true,
                    extraClass: "pl-16 text-base font-medium tabular-nums",
                  })}
                  type="text"
                  placeholder="50000000"
                  inputMode="numeric"
                  dir="ltr"
                />

                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  تومان
                </span>
              </div>
            </Field>
          </div>

          {/* نوار دکمه‌ها؛ همیشه پایین مودال ثابت می‌ماند (با رعایت safe-area موبایل) */}
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/90 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="min-h-12 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="min-h-12 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    در حال ذخیره...
                  </span>
                ) : isEditing ? (
                  "ذخیره تغییرات"
                ) : (
                  "ثبت چک"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckModal;
