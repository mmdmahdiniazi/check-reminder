type ToastType = "success" | "error";

type ToastProps = {
  type: ToastType;
  message: string;
  onClose: () => void;
};

function Toast({ type, message, onClose }: ToastProps) {
  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-5 sm:right-auto sm:w-auto sm:max-w-md sm:translate-x-0">
      <div
        className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg ${
          isSuccess ? "border-green-100" : "border-red-100"
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isSuccess
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? "✓" : "!"}
        </div>

        <p
          className={`flex-1 text-sm font-medium ${
            isSuccess ? "text-green-700" : "text-red-700"
          }`}
        >
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="text-lg text-gray-400 transition hover:text-gray-700"
          aria-label="بستن پیام"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;
