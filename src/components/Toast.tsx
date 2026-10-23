type ToastType = "success" | "error";

type ToastProps = {
  /** نوع پیام؛ رنگ و آیکون بر اساس آن تعیین می‌شود */
  type: ToastType;
  message: string;
  onClose: () => void;
  /** مدت نمایش به میلی‌ثانیه؛ فقط برای نوار زمان‌سنج استفاده می‌شود (بستن خودکار در والد انجام می‌شود) */
  duration?: number;
};

/**
 * پیام کوتاه و موقتی (Toast) برای اطلاع‌رسانی نتیجه‌ی عملیات.
 * - موفقیت: با role="status" اعلام می‌شود (مزاحم نیست)
 * - خطا: با role="alert" بلافاصله به صفحه‌خوان‌ها اعلام می‌شود
 * - نوار پایین کارت، زمان باقی‌مانده تا بسته‌شدن خودکار را نشان می‌دهد
 */
function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  const isSuccess = type === "success";

  return (
    // لایه‌ی بیرونی فقط جای‌گذاری می‌کند تا با انیمیشن ورود تداخل نکند
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-5 sm:right-auto sm:w-auto sm:translate-x-0">
      <div
        role={isSuccess ? "status" : "alert"}
        aria-live={isSuccess ? "polite" : "assertive"}
        className={`animate-slide-up relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-white px-4 py-3.5 shadow-xl ${
          isSuccess ? "border-green-100" : "border-red-100"
        }`}
      >
        {/* آیکون وضعیت */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isSuccess
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isSuccess ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          )}
        </div>

        {/* متن پیام */}
        <p
          className={`min-w-0 flex-1 text-sm font-medium ${
            isSuccess ? "text-green-800" : "text-red-800"
          }`}
        >
          {message}
        </p>

        {/* دکمه‌ی بستن دستی */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="بستن پیام"
        >
          ×
        </button>

        {/* نوار زمان‌سنج بسته‌شدن خودکار */}
        <span
          aria-hidden="true"
          className={`animate-toast-progress absolute inset-x-0 bottom-0 h-0.5 origin-right ${
            isSuccess ? "bg-green-400" : "bg-red-400"
          }`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

export default Toast;
