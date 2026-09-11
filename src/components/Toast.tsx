type ToastType = "success" | "error";

type ToastProps = {
  type: ToastType;
  message: string;
  onClose: () => void;
};

function Toast({ type, message, onClose }: ToastProps) {
  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-5 sm:right-auto sm:w-auto sm:translate-x-0">
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-xl ${
          isSuccess ? "border-green-100" : "border-red-100"
        }`}
      >
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

        <p
          className={`min-w-0 flex-1 text-sm font-medium ${
            isSuccess ? "text-green-800" : "text-red-800"
          }`}
        >
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="بستن پیام"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;
