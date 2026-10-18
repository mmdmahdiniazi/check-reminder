import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import App from "./App";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0098")) return `+${digits.slice(2)}`;
  if (digits.startsWith("98")) return `+${digits}`;
  if (digits.startsWith("0")) return `+98${digits.slice(1)}`;
  return `+98${digits}`;
}

function authError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("rate limit") || value.includes("too many")) return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
  if (value.includes("expired")) return "کد تأیید منقضی شده است. دوباره کد بگیرید.";
  if (value.includes("sms") || value.includes("phone provider")) return "ارسال پیامک در Supabase هنوز به‌درستی تنظیم نشده است.";
  return "عملیات انجام نشد. شماره و کد را بررسی کنید و دوباره تلاش کنید.";
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [codeSent, setCodeSent] = useState(false);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalized = normalizePhone(phone);
    if (!/^\+989\d{9}$/.test(normalized)) {
      setError("شماره موبایل ایران را به‌صورت 09123456789 وارد کنید.");
      return;
    }
    setBusy(true);
    const { error: requestError } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (requestError) {
      setError(authError(requestError.message));
      return;
    }
    setPhone(normalized);
    setCodeSent(true);
    setMessage("کد تأیید ارسال شد.");
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const cleanToken = token.replace(/\D/g, "");
    if (cleanToken.length < 4 || cleanToken.length > 8) {
      setError("کد پیامکی را کامل وارد کنید.");
      return;
    }
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: cleanToken,
      type: "sms",
    });
    setBusy(false);
    if (verifyError) {
      setError(authError(verifyError.message));
      return;
    }
    setMessage("ورود با موفقیت انجام شد.");
  };

  if (checking) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4"><div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-sm text-gray-500">در حال بررسی وضعیت ورود...</div></main>;
  if (session) return <App />;

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-lg font-bold text-white">چ</div>
          <div><h1 className="text-xl font-bold text-gray-950">مدیریت چک‌ها</h1><p className="mt-1 text-sm text-gray-500">ورود یا ثبت‌نام با شماره موبایل</p></div>
        </div>
        {!codeSent ? (
          <form onSubmit={sendCode} className="space-y-5">
            <div>
              <label htmlFor="auth-phone" className="mb-2 block text-sm font-medium text-gray-700">شماره موبایل</label>
              <input id="auth-phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" maxLength={16} required className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-base outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100" />
              <p className="mt-2 text-xs leading-5 text-gray-400">اگر حساب نداشته باشید، پس از تأیید شماره، حساب شما ساخته می‌شود.</p>
            </div>
            <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50">{busy ? "در حال ارسال کد..." : "ارسال کد تأیید"}</button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-5">
            <div>
              <label htmlFor="auth-otp" className="mb-2 block text-sm font-medium text-gray-700">کد پیامکی</label>
              <input id="auth-otp" type="text" inputMode="numeric" autoComplete="one-time-code" dir="ltr" value={token} onChange={(e) => setToken(e.target.value)} placeholder="کد تأیید" maxLength={8} required autoFocus className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100" />
              <p className="mt-2 text-xs text-gray-400">کد برای {phone} ارسال شد.</p>
            </div>
            <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50">{busy ? "در حال بررسی..." : "تأیید و ورود"}</button>
            <button type="button" disabled={busy} onClick={() => { setCodeSent(false); setToken(""); setError(""); setMessage(""); }} className="min-h-11 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">تغییر شماره موبایل</button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm leading-6 text-red-600">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-green-100 bg-green-50 px-3 py-3 text-sm leading-6 text-green-700">{message}</p>}
        <p className="mt-6 text-xs leading-5 text-gray-400">شماره موبایل برای احراز هویت استفاده می‌شود. اطلاعات چک‌ها فقط در حساب شما قابل مشاهده خواهد بود.</p>
      </section>
    </main>
  );
}
