import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import App from "./App";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import PhoneOtpForm from "./components/PhoneOtpForm";

type AuthMode = "signin" | "signup";

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

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [usePhoneAuth, setUsePhoneAuth] = useState(false);
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

  if (checking) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center px-4"
      >
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-100 border-t-teal-700" />
            در حال بررسی وضعیت ورود...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (session) return <App />;

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-cyan-100/50 blur-3xl"
      />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-2xl shadow-slate-900/[0.08] backdrop-blur-xl md:grid-cols-[1fr_1.05fr]">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-[#103d4b] via-[#145a68] to-[#087e83] p-10 text-white md:flex lg:p-12">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-extrabold shadow-lg">
              چ
            </div>
            <p className="mt-8 text-sm font-semibold text-teal-100">
              مدیریت مالی، ساده‌تر
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-[1.7] lg:text-4xl">
              سررسیدها را فراموش نکنید.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-teal-50/85">
              همه چک‌ها، تاریخ‌های مهم و یادآوری‌ها را در یک فضای امن و مرتب
              مدیریت کنید.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
            <p className="text-xs text-teal-100">یادآور چک</p>
            <p className="mt-1 text-sm font-medium">
              همیشه یک قدم جلوتر از سررسیدها
            </p>
          </div>
        </section>

        <Card className="rounded-none border-0 bg-transparent shadow-none">
          <CardHeader className="px-6 pb-2 pt-8 sm:px-10 sm:pt-12">
            <div className="mb-5 flex items-center gap-3 md:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-800 text-lg font-extrabold text-white shadow-lg shadow-teal-900/15">
                چ
              </div>
              <div>
                <CardTitle className="text-xl">یادآور چک</CardTitle>
                <CardDescription className="mt-1">
                  مدیریت هوشمند چک‌ها
                </CardDescription>
              </div>
            </div>
            <p className="text-sm font-semibold text-teal-700">
              {mode === "signin" ? "خوش برگشتید" : "شروع کنید"}
            </p>
            <CardTitle className="mt-2 text-2xl sm:text-3xl">
              {mode === "signin" ? "ورود به حساب" : "ساخت حساب جدید"}
            </CardTitle>
            <CardDescription className="mt-3">
              برای مدیریت امن چک‌ها، وارد حساب کاربری خود شوید.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-5 sm:px-10 sm:pb-12">
            {!usePhoneAuth && (
            <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setMessage("");
                }}
                className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/[0.03]" : "text-slate-500 hover:text-slate-800"}`}
              >
                ورود
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
                className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/[0.03]" : "text-slate-500 hover:text-slate-800"}`}
              >
                ثبت‌نام
              </button>
            </div>
            )}
            {usePhoneAuth ? (
              <PhoneOtpForm onBack={() => setUsePhoneAuth(false)} />
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="auth-email"
                  className="text-sm font-semibold text-slate-700"
                >
                  ایمیل
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="auth-password"
                  className="text-sm font-semibold text-slate-700"
                >
                  رمز عبور
                </label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  minLength={6}
                  required
                  className="text-left"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={busy}
                className="w-full"
              >
                {busy && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {busy
                  ? "در حال انجام..."
                  : mode === "signup"
                    ? "ساخت حساب"
                    : "ورود به حساب"}
              </Button>
            </form>
            )}
            <button type="button" onClick={() => { setUsePhoneAuth((current) => !current); setError(""); setMessage(""); }} className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              {usePhoneAuth ? "ورود با ایمیل و رمز عبور" : "ورود با شماره موبایل و کد پیامکی"}
            </button>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="mt-4 rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-3 text-sm leading-6 text-teal-800"
              >
                {message}
              </p>
            )}
            <p className="mt-6 border-t border-border pt-5 text-xs leading-6 text-muted-foreground">
              اطلاعات چک‌ها پس از ورود به حساب کاربری نمایش داده می‌شود. در صورت
              فعال بودن تأیید ایمیل، ابتدا لینک تأیید ارسال‌شده از طرف Supabase
              را باز کنید.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
