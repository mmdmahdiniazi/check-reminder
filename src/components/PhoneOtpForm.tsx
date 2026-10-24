import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

function toAsciiDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalizeIranianPhone(value: string) {
  const digits = toAsciiDigits(value).replace(/[\s()-]/g, "");
  if (/^09\d{9}$/.test(digits)) return `+98${digits.slice(1)}`;
  if (/^989\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\+989\d{9}$/.test(digits)) return digits;
  return null;
}

export default function PhoneOtpForm({ onBack }: { onBack: () => void }) {
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalized = normalizeIranianPhone(phoneInput);
    if (!normalized) {
      setError("شماره موبایل معتبر وارد کنید؛ نمونه: 09123456789");
      return;
    }

    setBusy(true);
    try {
      const { error: requestError } = await supabase.auth.signInWithOtp({
        phone: normalized,
      });
      if (requestError) {
        setError(requestError.message.toLowerCase().includes("rate limit")
          ? "درخواست‌های زیادی ثبت شده است. کمی بعد دوباره تلاش کنید."
          : "ارسال کد انجام نشد. تنظیمات ورود پیامکی Supabase را بررسی کنید.");
        return;
      }
      setPhone(normalized);
      setStep("otp");
      setMessage("اگر شماره و سرویس پیامکی تنظیم شده باشند، کد ورود برای شما ارسال می‌شود.");
    } catch {
      setError("ارتباط با سرویس ورود برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanToken = toAsciiDigits(token).replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleanToken)) {
      setError("کد پیامکی ۶ رقمی را وارد کنید.");
      return;
    }

    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: cleanToken,
        type: "sms",
      });
      if (verifyError) {
        setError("کد معتبر نیست یا منقضی شده است. دوباره بررسی کنید.");
      }
    } catch {
      setError("تأیید کد انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone-number" className="text-sm font-semibold text-slate-700">
              شماره موبایل
            </label>
            <Input
              id="phone-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="09123456789"
              required
              className="text-left"
            />
          </div>
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? "در حال ارسال..." : "ارسال کد ورود"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            کد ۶ رقمی ارسال‌شده به <span dir="ltr" className="font-semibold">{phone}</span> را وارد کنید.
          </p>
          <div className="space-y-2">
            <label htmlFor="phone-otp" className="text-sm font-semibold text-slate-700">
              کد یک‌بارمصرف
            </label>
            <Input
              id="phone-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="کد ۶ رقمی"
              maxLength={6}
              required
              className="text-center tracking-[0.35em]"
            />
          </div>
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? "در حال بررسی..." : "تأیید و ورود"}
          </Button>
          <button type="button" onClick={() => { setStep("phone"); setToken(""); setError(""); setMessage(""); }} className="w-full text-sm font-medium text-teal-700 hover:text-teal-900">
            اصلاح شماره موبایل
          </button>
        </form>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-6 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-3 text-sm leading-6 text-teal-800">{message}</p>}
      <button type="button" onClick={onBack} className="w-full rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-50">
        بازگشت به ورود با ایمیل
      </button>
    </div>
  );
}
