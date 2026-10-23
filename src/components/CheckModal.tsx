import { useEffect, useState } from "react";
import type { Check } from "../types/check";
import moment from "moment-jalaali";

type CheckModalProps = {
  check?: Check | null;
  onClose: () => void;
  onSave: (check: Check) => void;
  isSaving?: boolean;
};

type FormErrors = {
  ownerName?: string;
  mobile?: string;
  bank?: string;
  sayadiNumber?: string;
  serialNumber?: string;
  dueDate?: string;
  amount?: string;
};

const inputBaseClass =
  "w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-4 focus:ring-gray-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

function CheckModal({
  check,
  onClose,
  onSave,
  isSaving = false,
}: CheckModalProps) {
  const isEditing = Boolean(check);

  const [formData, setFormData] = useState({
    ownerName: "",
    mobile: "",
    bank: "",
    sayadiNumber: "",
    serialNumber: "",
    dueDate: "",
    amount: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (check) {
      // Synchronize the controlled form with the selected check.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ownerName: check.ownerName,
        mobile: check.mobile,
        bank: check.bank,
        sayadiNumber: check.sayadiNumber,
        serialNumber: check.serialNumber,
        dueDate: check.dueDate,
        amount: String(check.amount),
      });
    } else {
      setFormData({
        ownerName: "",
        mobile: "",
        bank: "",
        sayadiNumber: "",
        serialNumber: "",
        dueDate: "",
        amount: "",
      });
    }

    setErrors({});
  }, [check]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    let cleanValue = value;

    if (
      name === "mobile" ||
      name === "sayadiNumber" ||
      name === "serialNumber" ||
      name === "amount"
    ) {
      cleanValue = value.replace(/\D/g, "");
    }

    if (name === "mobile") {
      cleanValue = cleanValue.slice(0, 11);
    }

    if (name === "sayadiNumber") {
      cleanValue = cleanValue.slice(0, 16);
    }

    if (name === "dueDate") {
      cleanValue = value.replace(/[^\d/]/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: cleanValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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

  const getInputClass = (error?: string) =>
    `${inputBaseClass} ${
      error
        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
        : "border-gray-200"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-xl sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
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
              <h2 className="truncate text-base font-bold text-gray-950">
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
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <label htmlFor="ownerName" className={labelClass}>
                نام صاحب چک
              </label>

              <input
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="مثلاً علی رضایی"
                autoComplete="name"
                autoFocus
                className={getInputClass(errors.ownerName)}
              />

              {errors.ownerName && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.ownerName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="mobile" className={labelClass}>
                شماره موبایل
              </label>

              <input
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="09121234567"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
                dir="ltr"
                className={getInputClass(errors.mobile)}
              />

              <p className="mt-1.5 text-xs text-gray-400">
                شماره موبایل صاحب چک
              </p>

              {errors.mobile && (
                <p className="mt-1.5 text-xs text-red-500">{errors.mobile}</p>
              )}
            </div>

            <div>
              <label htmlFor="bank" className={labelClass}>
                بانک
              </label>

              <select
                id="bank"
                name="bank"
                value={formData.bank}
                onChange={handleChange}
                className={getInputClass(errors.bank)}
              >
                <option value="">انتخاب بانک</option>
                <option value="بانک ملی">بانک ملی</option>
                <option value="بانک ملت">بانک ملت</option>
                <option value="بانک صادرات">بانک صادرات</option>
                <option value="بانک تجارت">بانک تجارت</option>
                <option value="بانک رفاه">بانک رفاه</option>
                <option value="بانک پاسارگاد">بانک پاسارگاد</option>
                <option value="بانک سامان">بانک سامان</option>
                <option value="بانک پارسیان">بانک پارسیان</option>
                <option value="بانک کشاورزی">بانک کشاورزی</option>
                <option value="بانک مسکن">بانک مسکن</option>
                <option value="بانک آینده">بانک آینده</option>
                <option value="سایر">سایر</option>
              </select>

              {errors.bank && (
                <p className="mt-1.5 text-xs text-red-500">{errors.bank}</p>
              )}
            </div>

            <div>
              <label htmlFor="sayadiNumber" className={labelClass}>
                شماره صیادی
              </label>

              <input
                id="sayadiNumber"
                name="sayadiNumber"
                value={formData.sayadiNumber}
                onChange={handleChange}
                placeholder="16 رقم"
                maxLength={16}
                inputMode="numeric"
                dir="ltr"
                className={`${getInputClass(
                  errors.sayadiNumber,
                )} tracking-[0.18em]`}
              />

              <p className="mt-1.5 text-xs text-gray-400">
                شماره ۱۶ رقمی درج‌شده روی چک
              </p>

              {errors.sayadiNumber && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.sayadiNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="serialNumber" className={labelClass}>
                  شماره سریال
                </label>

                <input
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="شماره سریال"
                  inputMode="numeric"
                  dir="ltr"
                  className={getInputClass(errors.serialNumber)}
                />

                {errors.serialNumber && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.serialNumber}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="dueDate" className={labelClass}>
                  تاریخ سررسید
                </label>

                <input
                  id="dueDate"
                  type="text"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  placeholder="1405/07/20"
                  inputMode="numeric"
                  maxLength={10}
                  dir="ltr"
                  className={getInputClass(errors.dueDate)}
                />

                <p className="mt-1.5 text-xs text-gray-400">فرمت: 1405/07/20</p>

                {errors.dueDate && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.dueDate}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="amount" className={labelClass}>
                مبلغ چک
              </label>

              <div className="relative">
                <input
                  id="amount"
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="50000000"
                  inputMode="numeric"
                  dir="ltr"
                  className={`${getInputClass(
                    errors.amount,
                  )} pl-16 text-base font-medium tabular-nums`}
                />

                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  تومان
                </span>
              </div>

              <p className="mt-1.5 text-xs text-gray-400">
                مبلغ را بدون جداکننده وارد کنید
              </p>

              {errors.amount && (
                <p className="mt-1.5 text-xs text-red-500">{errors.amount}</p>
              )}
            </div>
          </div>

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
                className="min-h-12 rounded-xl bg-gray-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
