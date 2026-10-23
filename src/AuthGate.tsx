import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import App from "./App";

type AuthMode = "signin" | "signup";

function authError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) return "ایمیل یا رمز عبور اشتباه است.";
  if (value.includes("user already registered")) return "این ایمیل قبلاً ثبت‌نام کرده است؛ وارد حساب شوید.";
  if (value.includes("password should be at least")) return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  if (value.includes("email not confirmed")) return "ایمیل شما هنوز تأیید نشده است. صندوق ورودی و پوشه هرزنامه را بررسی کنید.";
  if (value.includes("rate limit") || value.includes("too many")) return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
  if (value.includes("invalid email")) return "فرمت ایمیل معتبر نیست.";
  if (value.includes("email address") && value.includes("not authorized")) return "ارسال ایمیل در Supabase برای این آدرس مجاز نیست؛ تنظیمات Email را بررسی کنید.";
  return "عملیات انجام نشد. اطلاعات را بررسی کنید و دوباره تلاش کنید.";
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError("بررسی وضعیت ورود انجام نشد.");
      setSession(data.session);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

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
          setMessage("ثبت‌نام و ورود با موفقیت انجام شد.");
        } else {
          setMessage("ثبت‌نام انجام شد. ایمیل تأیید Supabase را باز کنید و لینک تأیید را بزنید؛ سپس با همین ایمیل و رمز عبور وارد شوید.");
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

  if (checking) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-sm text-gray-500">
          در حال بررسی وضعیت ورود...
        </div>
      </main>
    );
  }

  if (session) return <App />;

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-lg font-bold text-white">چ</div>
          <div>
            <h1 className="text-xl font-bold text-gray-950">مدیریت چک‌ها</h1>
            <p className="mt-1 text-sm text-gray-500">ورود و ثبت‌نام با ایمیل</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          <button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            ورود
          </button>
          <button type="button" onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            ثبت‌نام
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="auth-email" className="mb-2 block text-sm font-medium text-gray-700">ایمیل</label>
            <input id="auth-email" type="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-base outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100" />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-2 block text-sm font-medium text-gray-700">رمز عبور</label>
            <input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" minLength={6} required className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-base outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100" />
          </div>
          <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50">
            {busy ? "در حال انجام..." : mode === "signup" ? "ساخت حساب" : "ورود به حساب"}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm leading-6 text-red-600">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm leading-6 text-blue-700">{message}</p>}

        <p className="mt-6 text-xs leading-5 text-gray-400">
          اطلاعات چک‌ها پس از ورود به حساب کاربری نمایش داده می‌شود. در صورت فعال بودن تأیید ایمیل، ابتدا لینک تأیید ارسال‌شده از طرف Supabase را باز کنید.
        </p>
      </section>
    </main>
  );
}
