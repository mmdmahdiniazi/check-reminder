import { useEffect, useState } from "react";

import CheckCard from "./components/CheckCard";
import AdminPanel from "./components/AdminPanel";
import CheckModal from "./components/CheckModal";
import NotificationBell from "./components/NotificationBell";
import Toast from "./components/Toast";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

import type { Check } from "./types/check";

import { supabase } from "./lib/supabase";

import {
  getNearestDueDate,
  getDueThisWeek,
  getReminderType,
} from "./utils/date";

type UserRole = "user" | "admin" | "super_admin";

type UserPlan = "free" | "pro" | "enterprise";

type UserProfile = {
  role: UserRole;
  plan: UserPlan;
};

const roleLabels: Record<UserRole, string> = {
  user: "کاربر",
  admin: "مدیر",
  super_admin: "مدیر کل",
};

const planLabels: Record<UserPlan, string> = {
  free: "رایگان",
  pro: "حرفه‌ای",
  enterprise: "سازمانی",
};

function App() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCheckId, setDeletingCheckId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({
      type,
      message,
    });
  };

  const createNotifications = async (checks: Check[]) => {
    for (const check of checks) {
      const reminderType = getReminderType(check.dueDate);

      if (!reminderType) continue;

      const { error } = await supabase.from("notifications").insert({
        check_id: check.id,
        title: "یادآوری سررسید چک",
        message: `چک ${check.ownerName} به مبلغ ${check.amount.toLocaleString(
          "fa-IR",
        )} تومان، ${reminderType} روز دیگر سررسید می‌شود.`,
        reminder_type: reminderType,
      });

      if (error && error.code !== "23505") {
        console.error("Error creating notification:", error);
      }
    }
  };

  const fetchChecks = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("checks")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error fetching checks:", error);

      setErrorMessage("دریافت اطلاعات چک‌ها با خطا مواجه شد.");

      showToast("error", "دریافت اطلاعات چک‌ها با خطا مواجه شد.");

      setIsLoading(false);
      return;
    }

    const formattedChecks: Check[] = (data ?? []).map((item) => ({
      id: item.id,
      bank: item.bank,
      sayadiNumber: item.sayadi_number,
      serialNumber: item.serial_number,
      dueDate: item.due_date,
      amount: item.amount,
      ownerName: item.owner_name,
      mobile: item.mobile,
    }));

    setChecks(formattedChecks);

    await createNotifications(formattedChecks);

    setIsLoading(false);
  };

  useEffect(() => {
    // Load the dashboard data and the authenticated user's role/plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchChecks();

    let active = true;
    const loadProfile = async () => {
      setIsProfileLoading(true);
      setProfileError("");
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("اطلاعات کاربر واردشده دریافت نشد.");

        const { data, error } = await supabase
          .from("profiles")
          .select("role, plan")
          .eq("id", user.id)
          .single();
        if (error) throw error;

        const validRoles: UserRole[] = ["user", "admin", "super_admin"];
        const validPlans: UserPlan[] = ["free", "pro", "enterprise"];
        if (!validRoles.includes(data.role as UserRole) || !validPlans.includes(data.plan as UserPlan)) {
          throw new Error("نقش یا پلن حساب معتبر نیست.");
        }
        if (active) {
          setProfile({ role: data.role as UserRole, plan: data.plan as UserPlan });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (active) {
          setProfile(null);
          setProfileError("دریافت اطلاعات حساب با خطا مواجه شد.");
        }
      } finally {
        if (active) setIsProfileLoading(false);
      }
    };

    void loadProfile();
    return () => { active = false; };
  }, []);


  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  if (showAdminPanel && profile && profile.role !== "user") {
    return <AdminPanel currentRole={profile.role} onBack={() => setShowAdminPanel(false)} />;
  }

  const handleSaveCheck = async (check: Check) => {
    if (isSaving) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      if (check.id) {
        const { error } = await supabase
          .from("checks")
          .update({
            bank: check.bank,
            sayadi_number: check.sayadiNumber,
            serial_number: check.serialNumber,
            due_date: check.dueDate,
            amount: check.amount,
            owner_name: check.ownerName,
            mobile: check.mobile,
          })
          .eq("id", check.id);

        if (error) {
          console.error("Error updating check:", error);

          setErrorMessage("ویرایش چک با خطا مواجه شد.");

          showToast("error", "ویرایش چک با خطا مواجه شد.");

          return;
        }

        setChecks((prev) =>
          prev.map((item) => (item.id === check.id ? check : item)),
        );

        showToast("success", "چک با موفقیت ویرایش شد.");
      } else {
        const { data, error } = await supabase
          .from("checks")
          .insert({
            bank: check.bank,
            sayadi_number: check.sayadiNumber,
            serial_number: check.serialNumber,
            due_date: check.dueDate,
            amount: check.amount,
            owner_name: check.ownerName,
            mobile: check.mobile,
          })
          .select()
          .single();

        if (error) {
          console.error("Error adding check:", error);

          setErrorMessage("ثبت چک با خطا مواجه شد.");

          showToast("error", "ثبت چک با خطا مواجه شد.");

          return;
        }

        const newCheck: Check = {
          id: data.id,
          bank: data.bank,
          sayadiNumber: data.sayadi_number,
          serialNumber: data.serial_number,
          dueDate: data.due_date,
          amount: data.amount,
          ownerName: data.owner_name,
          mobile: data.mobile,
        };

        setChecks((prev) => [newCheck, ...prev]);

        showToast("success", "چک با موفقیت ثبت شد.");
      }

      setIsModalOpen(false);
      setEditingCheck(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCheck = async (id: string) => {
    if (deletingCheckId) return;

    setDeletingCheckId(id);
    setErrorMessage("");

    try {
      const { error } = await supabase.from("checks").delete().eq("id", id);

      if (error) {
        console.error("Error deleting check:", error);

        setErrorMessage("حذف چک با خطا مواجه شد.");

        showToast("error", "حذف چک با خطا مواجه شد.");

        return;
      }

      setChecks((prev) => prev.filter((check) => check.id !== id));

      showToast("success", "چک با موفقیت حذف شد.");
    } finally {
      setDeletingCheckId(null);
    }
  };

  const handleEditCheck = (check: Check) => {
    setEditingCheck(check);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingCheck(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingCheck(null);
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredChecks = checks.filter((check) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const searchableText = [
      check.ownerName,
      check.sayadiNumber,
      check.serialNumber,
      check.mobile,
      check.bank,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearchQuery);
  });

  const nearestDueDate = getNearestDueDate(
    checks.map((check) => check.dueDate),
  );

  const dueThisWeek = getDueThisWeek(checks.map((check) => check.dueDate));

  const isSearching = searchQuery.trim().length > 0;

  const fetchProfile = async () => {
    setIsProfileLoading(true);
    setProfileError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("اطلاعات کاربر واردشده دریافت نشد.");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role, plan")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      const validRoles: UserRole[] = ["user", "admin", "super_admin"];

      const validPlans: UserPlan[] = ["free", "pro", "enterprise"];

      if (
        !validRoles.includes(data.role as UserRole) ||
        !validPlans.includes(data.plan as UserPlan)
      ) {
        throw new Error("نقش یا پلن حساب معتبر نیست.");
      }

      setProfile({
        role: data.role as UserRole,
        plan: data.plan as UserPlan,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setProfileError("دریافت اطلاعات حساب با خطا مواجه شد.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  if (showAdminPanel && profile && profile.role !== "user") {
    return <AdminPanel currentRole={profile.role} onBack={() => setShowAdminPanel(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f8fb] text-gray-900" dir="rtl">
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-800 text-sm font-extrabold text-white shadow-md shadow-teal-900/15">
                چ
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold text-gray-900 sm:text-lg">
                  چک‌بان
                </h1>

                <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                  پیگیری ساده و منظم سررسید چک‌ها
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isProfileLoading ? (
                    <span className="text-xs text-gray-400">
                      در حال دریافت اطلاعات حساب...
                    </span>
                  ) : profile ? (
                    <>
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {roleLabels[profile.role]}
                      </span>

                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        پلن {planLabels[profile.plan]}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-red-600">
                        {profileError}
                      </span>

                      <button
                        type="button"
                        onClick={() => void fetchProfile()}
                        className="text-xs font-semibold text-gray-700 underline underline-offset-4"
                      >
                        تلاش مجدد
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {profile && profile.role !== "user" && (
              <button
                type="button"
                onClick={() => setShowAdminPanel(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                پنل مدیریت
              </button>
            )}
            <NotificationBell />

            <button
              type="button"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) showToast("error", "خروج از حساب انجام نشد.");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              خروج
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <span className="text-lg leading-none">+</span>

              <span className="hidden sm:inline">ثبت چک جدید</span>
              <span className="sm:hidden">ثبت چک</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/80 bg-gradient-to-l from-white via-white to-teal-50/70 p-5 shadow-sm shadow-slate-900/[0.025] sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">نمای کلی حساب <span className="h-1.5 w-1.5 rounded-full bg-teal-600" /></p>

            <h2 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              وضعیت چک‌های شما
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              چک‌های ثبت‌شده و نزدیک‌ترین سررسیدها را از یکجا مدیریت کنید.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            {checks.length === 0
              ? "هنوز چکی ثبت نشده"
              : `${checks.length} چک در حساب شما`}
          </div>
        </section>

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="flex-1 text-sm leading-6 text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-red-400 transition hover:bg-red-100 hover:text-red-600"
              aria-label="بستن پیام خطا"
            >
              ×
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">کل چک‌ها</p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  />
                </svg>
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold tracking-tight text-gray-950">
              {checks.length.toLocaleString("fa-IR")}
            </p>

            <p className="mt-1 text-xs text-gray-400">چک ثبت‌شده</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">نزدیک‌ترین سررسید</p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </span>
            </div>

            <p
              className="mt-5 text-2xl font-bold tracking-tight text-gray-950"
              dir="ltr"
            >
              {nearestDueDate ?? "-"}
            </p>

            <p className="mt-1 text-xs text-gray-400">نزدیک‌ترین تاریخ آینده</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">سررسید این هفته</p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 2v4m8-4v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  />
                </svg>
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold tracking-tight text-gray-950">
              {dueThisWeek.toLocaleString("fa-IR")}
            </p>

            <p className="mt-1 text-xs text-gray-400">چک در هفت روز آینده</p>
          </div>
        </section>

        <section className="mt-9 sm:mt-12">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.025] sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                چک‌های دریافتی
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isSearching
                  ? `${filteredChecks.length} نتیجه از ${checks.length} چک`
                  : `${checks.length} چک ثبت شده`}
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="جستجوی نام، شماره صیادی یا موبایل"
                aria-label="جستجوی چک"
                className="h-12 w-full rounded-xl border-gray-200 bg-white px-10 text-base sm:text-sm"
              />

              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>
              </span>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="پاک کردن جستجو"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-gray-200/80 bg-white px-4 py-20 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />

              <p className="mt-4 text-sm text-gray-500">
                در حال دریافت چک‌ها...
              </p>
            </div>
          ) : checks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  />
                </svg>
              </div>

              <p className="mt-5 text-base font-semibold text-gray-800">
                هنوز چکی ثبت نشده است
              </p>

              <p className="mt-2 text-sm text-gray-500">
                اولین چک خود را ثبت کنید تا مدیریت سررسیدها شروع شود.
              </p>

              <Button type="button" onClick={handleOpenAddModal} className="mt-6">ثبت اولین چک</Button>
            </div>
          ) : filteredChecks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>

              <p className="mt-5 text-base font-semibold text-gray-800">
                چکی پیدا نشد
              </p>

              <p className="mt-2 text-sm text-gray-500">
                عبارت جستجو را تغییر دهید یا جستجو را پاک کنید.
              </p>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-6 min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                پاک کردن جستجو
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredChecks.map((check) => (
                <CheckCard
                  key={check.id}
                  check={check}
                  onEdit={handleEditCheck}
                  onDelete={handleDeleteCheck}
                  isDeleting={deletingCheckId === check.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {isModalOpen && (
        <CheckModal
          check={editingCheck}
          onClose={handleCloseModal}
          onSave={handleSaveCheck}
          isSaving={isSaving}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
