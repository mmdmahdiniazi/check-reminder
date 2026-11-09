import { useEffect, useState } from "react";

import CheckCard from "./components/CheckCard";
import AdminPanel from "./components/AdminPanel";
import CheckModal from "./components/CheckModal";
import NotificationBell from "./components/NotificationBell";
import ThemeToggle from "./components/ThemeToggle";
import AppNavigation from "./components/AppNavigation";
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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user)
          throw new Error("اطلاعات کاربر واردشده دریافت نشد.");

        const { data, error } = await supabase
          .from("profiles")
          .select("role, plan")
          .eq("id", user.id)
          .single();
        if (error) throw error;

        const validRoles: UserRole[] = ["user", "admin", "super_admin"];
        const validPlans: UserPlan[] = ["free", "pro", "enterprise"];
        if (
          !validRoles.includes(data.role as UserRole) ||
          !validPlans.includes(data.plan as UserPlan)
        ) {
          throw new Error("نقش یا پلن حساب معتبر نیست.");
        }
        if (active) {
          setProfile({
            role: data.role as UserRole,
            plan: data.plan as UserPlan,
          });
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
    return () => {
      active = false;
    };
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
    return (
      <AdminPanel
        currentRole={profile.role}
        onBack={() => setShowAdminPanel(false)}
      />
    );
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

        await createNotifications([check]);

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

        await createNotifications([newCheck]);

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
    return (
      <AdminPanel
        currentRole={profile.role}
        onBack={() => setShowAdminPanel(false)}
      />
    );
  }

  return (
    <>
      <AppNavigation
        currentPage="dashboard"
        canManage={Boolean(profile && profile.role !== "user")}
        onOpenAdmin={() => setShowAdminPanel(true)}
      />
      <div className="app-content min-h-screen bg-background text-foreground lg:mr-64" dir="rtl">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 shadow-sm shadow-slate-950/[0.025] backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground shadow-lg shadow-blue-900/10">چ</div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">یادآور چک</h1>
                <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">مدیریت هوشمند سررسید چک‌ها</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {profile && profile.role !== "user" && (
                <button type="button" onClick={() => setShowAdminPanel(true)} className="hidden min-h-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:bg-muted sm:inline-flex">پنل مدیریت</button>
              )}
              <ThemeToggle />
              <NotificationBell />
              <button type="button" onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) showToast("error", "خروج از حساب انجام نشد.");
              }} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">خروج</button>
              <button type="button" onClick={handleOpenAddModal} disabled={isSaving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4">
                <span className="text-xl leading-none">+</span><span className="hidden sm:inline">ثبت چک جدید</span><span className="sm:hidden">ثبت چک</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
          <section id="overview" className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm shadow-slate-950/[0.025] sm:mb-8 sm:p-7 lg:p-8">
            <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-secondary px-3 py-1.5 text-xs font-bold text-primary"><span className="h-2 w-2 rounded-full bg-primary" />نمای کلی حساب</div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">وضعیت چک‌های شما</h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">همه چک‌های دریافتی و سررسیدهای پیش‌رو را در یک نمای منظم مدیریت کنید.</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {isProfileLoading ? (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" />در حال دریافت اطلاعات حساب...</span>
                  ) : profile ? (
                    <>
                      <span className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground">{roleLabels[profile.role]}</span>
                      <span className="rounded-xl border border-primary/15 bg-secondary px-3 py-2 text-xs font-semibold text-primary">پلن {planLabels[profile.plan]}</span>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-destructive">{profileError}</span><button type="button" onClick={() => void fetchProfile()} className="text-xs font-bold text-primary underline underline-offset-4">تلاش مجدد</button></div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-4 rounded-2xl border border-border bg-muted/70 px-4 py-3 sm:min-w-48 sm:flex-col sm:items-start sm:justify-center">
                <span className="text-xs font-medium text-muted-foreground">تعداد چک‌های ثبت‌شده</span>
                <span className="text-2xl font-extrabold tabular-nums text-foreground">{checks.length.toLocaleString("fa-IR")}</span>
              </div>
            </div>
          </section>

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="flex-1 text-sm leading-6 text-destructive">{errorMessage}</p>
              <button type="button" onClick={() => setErrorMessage("")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-destructive/70 transition hover:bg-destructive/10" aria-label="بستن پیام خطا">×</button>
            </div>
          )}

          <section aria-label="آمار چک‌ها" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="group rounded-2xl border border-border bg-card p-5 shadow-sm shadow-slate-950/[0.02] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-muted-foreground">کل چک‌ها</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg></span></div>
              <p className="mt-5 text-3xl font-extrabold tracking-tight tabular-nums text-foreground">{checks.length.toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-muted-foreground">چک ثبت‌شده در حساب شما</p>
            </div>
            <div className="group rounded-2xl border border-border bg-card p-5 shadow-sm shadow-slate-950/[0.02] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-muted-foreground">نزدیک‌ترین سررسید</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_12%,var(--card))] text-[var(--warning)]"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span></div>
              <p className="mt-5 text-2xl font-extrabold tracking-tight tabular-nums text-foreground" dir="ltr">{nearestDueDate ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">نزدیک‌ترین تاریخ آینده</p>
            </div>
            <div className="group rounded-2xl border border-border bg-card p-5 shadow-sm shadow-slate-950/[0.02] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-muted-foreground">سررسید این هفته</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--success)_12%,var(--card))] text-[var(--success)]"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg></span></div>
              <p className="mt-5 text-3xl font-extrabold tracking-tight tabular-nums text-foreground">{dueThisWeek.toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-muted-foreground">چک در هفت روز آینده</p>
            </div>
          </section>

          <section id="checks" className="mt-8 scroll-mt-24 sm:mt-10">
            <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-slate-950/[0.02] sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><div className="flex items-center gap-2"><h2 className="text-lg font-extrabold tracking-tight text-foreground">چک‌های دریافتی</h2><span className="rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-primary">{filteredChecks.length.toLocaleString("fa-IR")}</span></div><p className="mt-1 text-sm text-muted-foreground">{isSearching ? `${filteredChecks.length} نتیجه از ${checks.length} چک` : `${checks.length} چک ثبت شده`}</p></div>
              <div className="relative w-full sm:w-80 lg:w-96">
                <Input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="جستجوی نام، شماره صیادی یا موبایل" aria-label="جستجوی چک" className="h-12 w-full rounded-xl border-border bg-background px-10 text-base sm:text-sm" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg></span>
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="پاک کردن جستجو">×</button>}
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-border bg-card px-4 py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" /><p className="mt-4 text-sm font-medium text-muted-foreground">در حال دریافت چک‌ها...</p></div>
            ) : checks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-8 w-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg></div>
                <p className="mt-5 text-base font-bold text-foreground">هنوز چکی ثبت نشده است</p><p className="mt-2 text-sm text-muted-foreground">اولین چک خود را ثبت کنید تا مدیریت سررسیدها شروع شود.</p>
                <Button type="button" onClick={handleOpenAddModal} className="mt-6 min-h-11 rounded-xl px-5">ثبت اولین چک</Button>
              </div>
            ) : filteredChecks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-8 w-8"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg></div>
                <p className="mt-5 text-base font-bold text-foreground">چکی پیدا نشد</p><p className="mt-2 text-sm text-muted-foreground">عبارت جستجو را تغییر دهید یا جستجو را پاک کنید.</p>
                <button type="button" onClick={() => setSearchQuery("")} className="mt-6 min-h-11 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted">پاک کردن جستجو</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
                {filteredChecks.map((check) => <CheckCard key={check.id} check={check} onEdit={handleEditCheck} onDelete={handleDeleteCheck} isDeleting={deletingCheckId === check.id} />)}
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
    </>
  );
}

export default App;
