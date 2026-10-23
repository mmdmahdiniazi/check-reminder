import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import CheckCard from "./components/CheckCard";
import CheckModal from "./components/CheckModal";
import NotificationBell from "./components/NotificationBell";
import Toast from "./components/Toast";

import type { Check } from "./types/check";

import { supabase } from "./lib/supabase";

import {
  getDaysRemaining,
  getDueThisWeek,
  getNearestDueDate,
  getReminderType,
} from "./utils/date";

import { formatNumber, normalizeSearchText } from "./utils/format";

/* ==========================================================================
   نوع‌ها و ثابت‌ها
   ========================================================================== */

type UserRole = "user" | "admin" | "super_admin";

type UserPlan = "free" | "pro" | "enterprise";

type UserProfile = {
  role: UserRole;
  plan: UserPlan;
};

/** برچسب فارسی نقش‌ها و پلن‌ها برای نمایش در هدر */
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

const VALID_ROLES: UserRole[] = ["user", "admin", "super_admin"];

const VALID_PLANS: UserPlan[] = ["free", "pro", "enterprise"];

/** مدت نمایش Toast به میلی‌ثانیه */
const TOAST_DURATION_MS = 3000;

type ToastState = {
  /** شناسه‌ی یکتا تا با هر پیام جدید، انیمیشن و زمان‌سنج Toast از نو شروع شود */
  id: number;
  type: "success" | "error";
  message: string;
};

type SortMode = "created" | "due";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "created", label: "جدیدترین ثبت" },
  { value: "due", label: "نزدیک‌ترین سررسید" },
];

/* ==========================================================================
   نگاشت داده بین Supabase (snake_case) و رابط کاربری (camelCase)
   ========================================================================== */

/** شکل یک ردیف جدول checks در دیتابیس */
type CheckRow = {
  id: string;
  bank: string;
  sayadi_number: string;
  serial_number: string;
  due_date: string;
  amount: number;
  owner_name: string;
  mobile: string;
};

const fromRow = (row: CheckRow): Check => ({
  id: row.id,
  bank: row.bank,
  sayadiNumber: row.sayadi_number,
  serialNumber: row.serial_number,
  dueDate: row.due_date,
  amount: row.amount,
  ownerName: row.owner_name,
  mobile: row.mobile,
});

/** فیلدهای قابل ذخیره‌ی یک چک (بدون id که توسط دیتابیس ساخته می‌شود) */
const toRow = (check: Check) => ({
  bank: check.bank,
  sayadi_number: check.sayadiNumber,
  serial_number: check.serialNumber,
  due_date: check.dueDate,
  amount: check.amount,
  owner_name: check.ownerName,
  mobile: check.mobile,
});

/**
 * برای چک‌هایی که امروز دقیقاً به یکی از روزهای یادآوری رسیده‌اند
 * (مثلاً ۷ روز مانده)، اعلان می‌سازد.
 * خطای 23505 یعنی اعلان تکراری است و عمداً نادیده گرفته می‌شود
 * (تا با هر بار باز کردن برنامه، اعلان تکراری ساخته نشود).
 */
async function createReminderNotifications(checks: Check[]) {
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
}

/**
 * مقایسه‌گر برای مرتب‌سازی بر اساس سررسید:
 * چک‌های آینده از نزدیک به دور، و بعد از آن‌ها چک‌های گذشته (تازه‌ترین اول).
 */
function compareByDueDate(a: Check, b: Check): number {
  const daysA = getDaysRemaining(a.dueDate);
  const daysB = getDaysRemaining(b.dueDate);

  const isPastA = daysA < 0;
  const isPastB = daysB < 0;

  if (isPastA !== isPastB) return isPastA ? 1 : -1;

  return isPastA ? daysB - daysA : daysA - daysB;
}

/* ==========================================================================
   کامپوننت‌های کمکی (فقط در همین فایل استفاده می‌شوند)
   ========================================================================== */

/** مسیر SVG آیکون‌های استفاده‌شده در صفحه */
const ICONS = {
  document:
    "M9 12h6m-6 4h6M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  clock: "M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  calendar:
    "M8 2v4m8-4v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  search: "m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  warning:
    "M12 8v4m0 4h.01M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z",
} as const;

type IconProps = {
  path: string;
  className?: string;
  strokeWidth?: number;
};

/** آیکون خطی ساده با اندازه و ضخامت قابل تنظیم (برای صفحه‌خوان‌ها پنهان است) */
function Icon({ path, className = "h-5 w-5", strokeWidth = 1.7 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

type StatCardProps = {
  title: string;
  value: ReactNode;
  caption: string;
  iconPath: string;
  /** رنگ پس‌زمینه و متن آیکون */
  iconClass: string;
  /** برای مقادیری مثل تاریخ که باید چپ‌به‌راست نمایش داده شوند */
  valueDir?: "ltr" | "rtl";
  valueSizeClass?: string;
};

/** کارت آمار در بالای صفحه (کل چک‌ها، نزدیک‌ترین سررسید، سررسید این هفته) */
function StatCard({
  title,
  value,
  caption,
  iconPath,
  iconClass,
  valueDir,
  valueSizeClass = "text-3xl",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-card transition duration-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{title}</p>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon path={iconPath} />
        </span>
      </div>

      <p
        className={`mt-5 font-bold tracking-tight text-gray-950 ${valueSizeClass}`}
        dir={valueDir}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">{caption}</p>
    </div>
  );
}

type StatePanelProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  /** حاشیه‌ی خط‌چین برای حالت‌های «خالی»؛ حالت خطا حاشیه‌ی ساده دارد */
  dashed?: boolean;
};

/** پنل مرکزی برای حالت‌های خالی، بدون نتیجه و خطا در فهرست چک‌ها */
function StatePanel({
  icon,
  title,
  description,
  action,
  dashed = true,
}: StatePanelProps) {
  return (
    <div
      className={`animate-fade-in rounded-2xl border bg-white px-5 py-16 text-center ${
        dashed ? "border-dashed border-gray-300" : "border-gray-200/80"
      }`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        {icon}
      </div>

      <p className="mt-5 text-base font-semibold text-gray-800">{title}</p>

      <p className="mt-2 text-sm text-gray-500">{description}</p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** اسکلت بارگذاری کارت چک (جایگزین چرخنده‌ی ساده تا صفحه ناگهان نپرد) */
function CheckCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-5"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-100" />
        </div>

        <div className="h-6 w-24 rounded bg-gray-200" />
      </div>

      <div className="mt-5 h-24 rounded-xl bg-gray-100" />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="h-14 rounded-xl bg-gray-100" />
        <div className="h-14 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

/* ==========================================================================
   صفحه‌ی اصلی
   ========================================================================== */

function App() {
  // --- داده‌ها و فیلترها ---
  const [checks, setChecks] = useState<Check[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("created");

  // --- مودال ثبت / ویرایش ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);

  // --- وضعیت عملیات‌ها ---
  const [isLoading, setIsLoading] = useState(true);
  // loadError: دریافت فهرست چک‌ها شکست خورده (برای نمایش پنل خطا و دکمه‌ی تلاش مجدد)
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCheckId, setDeletingCheckId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // پیام خطای ذخیره/ویرایش/حذف که بالای صفحه نشان داده می‌شود
  const [errorMessage, setErrorMessage] = useState("");

  const [toast, setToast] = useState<ToastState | null>(null);

  // --- اطلاعات حساب کاربر (نقش و پلن) ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const showToast = useCallback((type: ToastState["type"], message: string) => {
    setToast({ id: Date.now(), type, message });
  }, []);

  /** دریافت فهرست چک‌ها از Supabase و ساخت اعلان‌های یادآوری لازم */
  const fetchChecks = useCallback(async () => {
    const { data, error } = await supabase
      .from("checks")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error fetching checks:", error);

      setLoadError(true);
      showToast("error", "دریافت اطلاعات چک‌ها با خطا مواجه شد.");
      setIsLoading(false);
      return;
    }

    const formattedChecks = (data ?? []).map(fromRow);

    setChecks(formattedChecks);
    setLoadError(false);
    // فهرست همین الان نشان داده می‌شود؛ ساخت اعلان‌ها در پس‌زمینه ادامه پیدا می‌کند
    setIsLoading(false);

    await createReminderNotifications(formattedChecks);
  }, [showToast]);

  /** دریافت نقش و پلن کاربر واردشده از جدول profiles */
  const fetchProfile = useCallback(async () => {
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

      // مقادیر دریافتی باید حتماً یکی از نقش‌ها/پلن‌های شناخته‌شده باشند
      if (
        !VALID_ROLES.includes(data.role as UserRole) ||
        !VALID_PLANS.includes(data.plan as UserPlan)
      ) {
        throw new Error("نقش یا پلن حساب معتبر نیست.");
      }

      setProfile({
        role: data.role as UserRole,
        plan: data.plan as UserPlan,
      });
      setProfileError("");
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setProfileError("دریافت اطلاعات حساب با خطا مواجه شد.");
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // دریافت اولیه‌ی چک‌ها و پروفایل هنگام باز شدن صفحه
  useEffect(() => {
    void fetchChecks();
    void fetchProfile();
  }, [fetchChecks, fetchProfile]);

  // بستن خودکار Toast بعد از چند ثانیه
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  /** تلاش مجدد برای دریافت چک‌ها بعد از خطا */
  const handleRetryLoad = () => {
    setIsLoading(true);
    setLoadError(false);
    void fetchChecks();
  };

  /** تلاش مجدد برای دریافت اطلاعات حساب بعد از خطا */
  const handleRetryProfile = () => {
    setIsProfileLoading(true);
    setProfileError("");
    void fetchProfile();
  };

  /** خروج از حساب؛ در صورت موفقیت، AuthGate صفحه‌ی ورود را نشان می‌دهد */
  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      showToast("error", "خروج از حساب انجام نشد.");
      setIsSigningOut(false);
    }
  };

  /**
   * ذخیره‌ی چک: اگر id داشته باشد ویرایش، در غیر این صورت ثبت چک جدید.
   * فهرست محلی هم بلافاصله به‌روز می‌شود تا نیازی به دریافت دوباره نباشد.
   */
  const handleSaveCheck = async (check: Check) => {
    if (isSaving) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      if (check.id) {
        const { error } = await supabase
          .from("checks")
          .update(toRow(check))
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
          .insert(toRow(check))
          .select()
          .single();

        if (error) {
          console.error("Error adding check:", error);

          setErrorMessage("ثبت چک با خطا مواجه شد.");

          showToast("error", "ثبت چک با خطا مواجه شد.");

          return;
        }

        setChecks((prev) => [fromRow(data), ...prev]);

        showToast("success", "چک با موفقیت ثبت شد.");
      }

      setIsModalOpen(false);
      setEditingCheck(null);
    } finally {
      setIsSaving(false);
    }
  };

  /** حذف یک چک (تأیید کاربر قبل از این در CheckCard گرفته شده است) */
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
    // وسط ذخیره‌سازی نباید مودال بسته شود
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingCheck(null);
  };

  /**
   * فهرست نمایشی: ابتدا جستجو (نام، شماره صیادی، سریال، موبایل و بانک؛
   * مستقل از ارقام فارسی/انگلیسی) و سپس مرتب‌سازی.
   */
  const visibleChecks = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    const filtered = query
      ? checks.filter((check) =>
          normalizeSearchText(
            [
              check.ownerName,
              check.sayadiNumber,
              check.serialNumber,
              check.mobile,
              check.bank,
            ].join(" "),
          ).includes(query),
        )
      : checks;

    // حالت «جدیدترین ثبت» ترتیب دریافتی از سرور را حفظ می‌کند
    return sortMode === "due" ? [...filtered].sort(compareByDueDate) : filtered;
  }, [checks, searchQuery, sortMode]);

  // آمار کارت‌های بالای صفحه
  const nearestDueDate = getNearestDueDate(
    checks.map((check) => check.dueDate),
  );

  const dueThisWeek = getDueThisWeek(checks.map((check) => check.dueDate));

  const isSearching = searchQuery.trim().length > 0;

  /** دکمه‌ی «ثبت چک» که در حالت خالی هم استفاده می‌شود */
  const primaryButtonClass =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4";

  /** کارت‌های فهرست را با چند ثانیه تأخیر پله‌ای وارد می‌کند (حداکثر ۸ مورد) */
  const getEntranceDelay = (index: number) => ({
    animationDelay: `${Math.min(index, 8) * 40}ms`,
  });

  /** محتوای ناحیه‌ی فهرست بر اساس وضعیت: بارگذاری، خطا، خالی، بدون نتیجه یا فهرست */
  const renderChecksList = () => {
    if (isLoading) {
      return (
        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          role="status"
          aria-label="در حال دریافت چک‌ها"
        >
          {[0, 1, 2, 3].map((item) => (
            <CheckCardSkeleton key={item} />
          ))}
        </div>
      );
    }

    if (loadError) {
      return (
        <StatePanel
          dashed={false}
          icon={<Icon path={ICONS.warning} className="h-7 w-7" />}
          title="دریافت چک‌ها انجام نشد"
          description="اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
          action={
            <button
              type="button"
              onClick={handleRetryLoad}
              className="min-h-11 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              تلاش مجدد
            </button>
          }
        />
      );
    }

    if (checks.length === 0) {
      return (
        <StatePanel
          icon={<Icon path={ICONS.document} className="h-7 w-7" />}
          title="هنوز چکی ثبت نشده است"
          description="اولین چک خود را ثبت کنید تا مدیریت سررسیدها شروع شود."
          action={
            <button
              type="button"
              onClick={handleOpenAddModal}
              className={`${primaryButtonClass} px-5`}
            >
              ثبت اولین چک
            </button>
          }
        />
      );
    }

    if (visibleChecks.length === 0) {
      return (
        <StatePanel
          icon={
            <Icon path={ICONS.search} className="h-7 w-7" strokeWidth={1.8} />
          }
          title="چکی پیدا نشد"
          description="عبارت جستجو را تغییر دهید یا جستجو را پاک کنید."
          action={
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              پاک کردن جستجو
            </button>
          }
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleChecks.map((check, index) => (
          <div
            key={check.id}
            className="animate-slide-up"
            style={getEntranceDelay(index)}
          >
            <CheckCard
              check={check}
              onEdit={handleEditCheck}
              onDelete={handleDeleteCheck}
              isDeleting={deletingCheckId === check.id}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-900" dir="rtl">
      {/* ----------------------------- هدر ----------------------------- */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          {/* لوگو، عنوان و نشان‌های نقش/پلن */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
                چ
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                  مدیریت چک‌ها
                </h1>

                <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                  پیگیری ساده و منظم سررسید چک‌ها
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {isProfileLoading ? (
                    <span
                      className="h-5 w-24 animate-pulse rounded-lg bg-gray-100"
                      role="status"
                      aria-label="در حال دریافت اطلاعات حساب"
                    />
                  ) : profile ? (
                    <>
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {roleLabels[profile.role]}
                      </span>

                      <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
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
                        onClick={handleRetryProfile}
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

          {/* اعلان‌ها، خروج و ثبت چک جدید */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <NotificationBell />

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSigningOut ? "در حال خروج..." : "خروج"}
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              disabled={isSaving}
              className={primaryButtonClass}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                +
              </span>

              <span className="hidden sm:inline">ثبت چک جدید</span>
              <span className="sm:hidden">ثبت چک</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* عنوان صفحه */}
        <section className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-brand-600">
              نمای کلی حساب
            </p>

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
              : `${formatNumber(checks.length)} چک در حساب شما`}
          </div>
        </section>

        {/* پیام خطای ذخیره/ویرایش/حذف */}
        {errorMessage && (
          <div
            role="alert"
            className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
          >
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

        {/* کارت‌های آمار */}
        <section
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          aria-label="خلاصه وضعیت چک‌ها"
        >
          <StatCard
            title="کل چک‌ها"
            value={formatNumber(checks.length)}
            caption="چک ثبت‌شده"
            iconPath={ICONS.document}
            iconClass="bg-gray-100 text-gray-600"
          />

          <StatCard
            title="نزدیک‌ترین سررسید"
            value={nearestDueDate ?? "-"}
            caption="نزدیک‌ترین تاریخ آینده"
            iconPath={ICONS.clock}
            iconClass="bg-orange-50 text-orange-600"
            valueDir="ltr"
            valueSizeClass="text-2xl"
          />

          <StatCard
            title="سررسید این هفته"
            value={formatNumber(dueThisWeek)}
            caption="چک در هفت روز آینده"
            iconPath={ICONS.calendar}
            iconClass="bg-green-50 text-green-600"
          />
        </section>

        {/* فهرست چک‌ها */}
        <section className="mt-8 sm:mt-10">
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                چک‌های دریافتی
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isSearching
                  ? `${formatNumber(visibleChecks.length)} نتیجه از ${formatNumber(checks.length)} چک`
                  : `${formatNumber(checks.length)} چک ثبت شده`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              {/* مرتب‌سازی؛ فقط وقتی حداقل دو چک وجود دارد معنا دارد */}
              {checks.length > 1 && (
                <div
                  role="group"
                  aria-label="مرتب‌سازی چک‌ها"
                  className="grid grid-cols-2 rounded-xl bg-gray-100 p-1"
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={sortMode === option.value}
                      onClick={() => setSortMode(option.value)}
                      className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition sm:text-sm ${
                        sortMode === option.value
                          ? "bg-white text-brand-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {/* جستجو */}
              <div className="relative w-full sm:w-80">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="جستجوی نام، شماره صیادی یا موبایل"
                  aria-label="جستجوی چک"
                  className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-sm"
                />

                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                >
                  <Icon path={ICONS.search} strokeWidth={1.8} />
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
          </div>

          {renderChecksList()}
        </section>
      </main>

      {/* مودال ثبت/ویرایش؛ key باعث می‌شود فرم برای هر چک از نو ساخته شود */}
      {isModalOpen && (
        <CheckModal
          key={editingCheck?.id ?? "new"}
          check={editingCheck}
          onClose={handleCloseModal}
          onSave={handleSaveCheck}
          isSaving={isSaving}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={TOAST_DURATION_MS}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
