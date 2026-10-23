import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import App from "./App";

/** حالت فرم: ورود به حساب موجود یا ساخت حساب جدید */
type AuthMode = "signin" | "signup";

/** کلاس مشترک فیلدهای ایمیل و رمز عبور */
const inputClass =
  "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-base outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

/**
 * پیام‌های انگلیسی Supabase را به متن فارسی قابل فهم تبدیل می‌کند.
 * برای خطاهای ناشناخته یک پیام عمومی برگردانده می‌شود.
 */
function authError(message: string) {
  const value = message.toLowerCase();

  if (value.includes("invalid login credentials"))
    return "ایمیل یا رمز عبور اشتباه است.";

  if (value.includes("user already registered"))
    return "این ایمیل قبلاً ثبت‌نام کرده است؛ وارد حساب شوید.";

  if (value.includes("password should be at least"))
    return "رمز عبور باید حداقل ۶ کاراکتر باشد.";

  if (value.includes("email not confirmed"))
    return "ایمیل شما هنوز تأیید نشده است. صندوق ورودی و پوشه هرزنامه را بررسی کنید.";

  if (value.includes("rate limit") || value.includes("too many"))
    return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";

  if (value.includes("invalid email")) return "فرمت ایمیل معتبر نیست.";

  if (value.includes("email address") && value.includes("not authorized"))
    return "ارسال ایمیل در Supabase برای این آدرس مجاز نیست؛ تنظیمات Email را بررسی کنید.";

  return "عملیات انجام نشد. اطلاعات را بررسی کنید و دوباره تلاش کنید.";
}

/** لوگوی برنامه (حرف «چ» روی پس‌زمینه‌ی گرادیانی) */
function LogoMark({ className }: { className: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-linear-to-br from-brand-500 to-brand-700 font-bold text-white shadow-sm ${className}`}
    >
      چ
    </div>
  );
}

/**
 * دروازه‌ی احراز هویت:
 * - تا مشخص شدن وضعیت ورود، یک صفحه‌ی «در حال بررسی» نشان می‌دهد
 * - اگر کاربر وارد شده باشد، برنامه‌ی اصلی (App) را نمایش می‌دهد
 * - در غیر این صورت، فرم ورود / ثبت‌نام با ایمیل و رمز عبور را نشان می‌دهد
 */
export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  // true تا زمانی که وضعیت اولیه‌ی نشست (session) از Supabase خوانده شود
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // busy: درخواست ورود/ثبت‌نام در حال انجام است
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // خواندن نشست فعلی و گوش دادن به تغییرات آن (ورود، خروج، تمدید توکن)
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;
        if (sessionError) setError("بررسی وضعیت ورود انجام نشد.");
        setSession(data.session);
        setChecking(false);
      })
      .catch(() => {
        // مثلاً قطع اینترنت؛ بدون این، صفحه برای همیشه روی «در حال بررسی» می‌ماند
        if (!mounted) return;
        setError("بررسی وضعیت ورود انجام نشد.");
        setChecking(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /** تغییر بین تب «ورود» و «ثبت‌نام» و پاک‌کردن پیام‌های قبلی */
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    // اعتبارسنجی سمت کلاینت قبل از ارسال درخواست
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("یک ایمیل معتبر وارد کنید.");
      return;
    }

    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error: requestError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (requestError) {
          setError(authError(requestError.message));
          return;
        }

        if (data.session) {
          // تأیید ایمیل خاموش است؛ کاربر همان لحظه وارد می‌شود
          setMessage("ثبت‌نام و ورود با موفقیت انجام شد.");
        } else {
          // تأیید ایمیل روشن است؛ کاربر باید ابتدا لینک ایمیل را بزند
          setMessage(
            "ثبت‌نام انجام شد. ایمیل تأیید Supabase را باز کنید و لینک تأیید را بزنید؛ سپس با همین ایمیل و رمز عبور وارد شوید.",
          );
          setMode("signin");
        }
      } else {
        const { error: requestError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (requestError) {
          setError(authError(requestError.message));
          return;
        }

        setMessage("ورود با موفقیت انجام شد.");
      }
    } catch {
      setError("ارتباط با سرویس ورود برقرار نشد. اتصال اینترنت را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };

  // مرحله‌ی ۱: هنوز وضعیت ورود مشخص نشده
  if (checking) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center px-4"
      >
        <div
          role="status"
          className="animate-fade-in flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm text-gray-500 shadow-card"
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          در حال بررسی وضعیت ورود...
        </div>
      </main>
    );
  }

  // مرحله‌ی ۲: کاربر وارد شده است
  if (session) return <App />;

  // مرحله‌ی ۳: فرم ورود / ثبت‌نام
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center px-4 py-10"
    >
      <section className="animate-slide-up w-full max-w-md rounded-3xl border border-gray-200/80 bg-white p-6 shadow-card-hover sm:p-8">
        {/* سربرگ کارت */}
        <div className="mb-7 flex items-center gap-3">
          <LogoMark className="h-12 w-12 rounded-2xl text-lg" />

          <div>
            <h1 className="text-xl font-bold text-gray-950">مدیریت چک‌ها</h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "signin"
                ? "برای ادامه وارد حساب خود شوید"
                : "با ایمیل خود حساب جدید بسازید"}
            </p>
          </div>
        </div>

        {/* تب‌های ورود / ثبت‌نام */}
        <div
          role="group"
          aria-label="نوع عملیات"
          className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1"
        >
          {(
            [
              { value: "signin", label: "ورود" },
              { value: "signup", label: "ثبت‌نام" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={mode === tab.value}
              onClick={() => switchMode(tab.value)}
              className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === tab.value
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="auth-email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              ایمیل
            </label>

            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              رمز عبور
            </label>

            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                minLength={6}
                required
                className={`${inputClass} pr-16`}
              />

              {/* نمایش / پنهان‌کردن رمز عبور برای جلوگیری از اشتباه تایپی */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                }
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                {showPassword ? "پنهان" : "نمایش"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                در حال انجام...
              </span>
            ) : mode === "signup" ? (
              "ساخت حساب"
            ) : (
              "ورود به حساب"
            )}
          </button>
        </form>

        {/* پیام خطا (قرمز) و پیام موفقیت/اطلاع‌رسانی (آبی) */}
        {error && (
          <p
            role="alert"
            className="animate-fade-in mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm leading-6 text-red-600"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="animate-fade-in mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm leading-6 text-blue-700"
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-xs leading-5 text-gray-400">
          اطلاعات چک‌ها پس از ورود به حساب کاربری نمایش داده می‌شود. در صورت
          فعال بودن تأیید ایمیل، ابتدا لینک تأیید ارسال‌شده از طرف Supabase را
          باز کنید.
        </p>
      </section>
    </main>
  );
}
