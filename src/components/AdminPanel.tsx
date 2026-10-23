import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type UserRole = "user" | "admin" | "super_admin";
type UserPlan = "free" | "pro" | "enterprise";

type AdminUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  plan: UserPlan;
  created_at: string;
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

type AdminPanelProps = {
  currentRole: UserRole;
  onBack: () => void;
};

export default function AdminPanel({ currentRole, onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: requestError } = await supabase.rpc("admin_list_users");
    if (requestError) {
      console.error("Unable to load admin users:", requestError);
      setError("دریافت فهرست کاربران انجام نشد. دسترسی مدیر و تابع دیتابیس را بررسی کنید.");
      setUsers([]);
    } else {
      setUsers((data ?? []) as AdminUser[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Load the user list when the admin panel mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
  }, [loadUsers]);

  const updatePlan = async (userId: string, plan: UserPlan) => {
    setBusyUserId(userId);
    setError("");
    setNotice("");
    const { error: requestError } = await supabase.rpc("admin_update_user_plan", {
      target_user_id: userId,
      new_plan: plan,
    });
    if (requestError) {
      console.error("Unable to update user plan:", requestError);
      setError("تغییر پلن انجام نشد. مجوزها و اتصال دیتابیس را بررسی کنید.");
    } else {
      setUsers((previous) => previous.map((user) => user.id === userId ? { ...user, plan } : user));
      setNotice("پلن کاربر با موفقیت به‌روزرسانی شد.");
    }
    setBusyUserId(null);
  };

  const updateRole = async (userId: string, role: UserRole) => {
    if (currentRole !== "super_admin") return;
    setBusyUserId(userId);
    setError("");
    setNotice("");
    const { error: requestError } = await supabase.rpc("admin_update_user_role", {
      target_user_id: userId,
      new_role: role,
    });
    if (requestError) {
      console.error("Unable to update user role:", requestError);
      setError("تغییر نقش انجام نشد. مدیر کل نمی‌تواند نقش حساب خودش را تغییر دهد.");
    } else {
      setUsers((previous) => previous.map((user) => user.id === userId ? { ...user, role } : user));
      setNotice("نقش کاربر با موفقیت به‌روزرسانی شد.");
    }
    setBusyUserId(null);
  };

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((user) =>
    [user.email ?? "", user.phone ?? "", roleLabels[user.role], planLabels[user.plan]]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );

  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-gray-500">مدیریت دسترسی‌ها</p>
          <h1 className="text-2xl font-bold text-gray-950">پنل مدیریت کاربران</h1>
          <p className="mt-2 text-sm text-gray-500">تعداد کاربران: {users.length.toLocaleString("fa-IR")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadUsers()} disabled={loading} className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">بروزرسانی</button>
          <button type="button" onClick={onBack} className="min-h-11 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">بازگشت به چک‌ها</button>
        </div>
      </header>

      <div className="mb-5">
        <label htmlFor="admin-user-search" className="mb-2 block text-sm font-medium text-gray-700">جستجوی کاربران</label>
        <input id="admin-user-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ایمیل، شماره موبایل، نقش یا پلن" className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100 sm:max-w-md sm:text-sm" />
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">{notice}</p>}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-16 text-center text-sm text-gray-500">در حال دریافت فهرست کاربران...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center text-sm text-gray-500">کاربری با این مشخصات پیدا نشد.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <article key={user.id} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px] lg:items-center">
                <div className="min-w-0">
                  <p className="break-all font-semibold text-gray-900">{user.email || "بدون ایمیل"}</p>
                  <p className="mt-1 text-sm text-gray-500" dir="ltr">{user.phone || "شماره موبایل ثبت نشده"}</p>
                  <p className="mt-1 text-xs text-gray-400">عضویت: {new Date(user.created_at).toLocaleDateString("fa-IR")}</p>
                </div>
                <div>
                  <label htmlFor={`plan-${user.id}`} className="mb-1.5 block text-xs font-medium text-gray-500">پلن حساب</label>
                  <select id={`plan-${user.id}`} value={user.plan} disabled={busyUserId === user.id} onChange={(event) => void updatePlan(user.id, event.target.value as UserPlan)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400 disabled:opacity-50">
                    <option value="free">رایگان</option>
                    <option value="pro">حرفه‌ای</option>
                    <option value="enterprise">سازمانی</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`role-${user.id}`} className="mb-1.5 block text-xs font-medium text-gray-500">نقش کاربر</label>
                  {currentRole === "super_admin" ? (
                    <select id={`role-${user.id}`} value={user.role} disabled={busyUserId === user.id} onChange={(event) => void updateRole(user.id, event.target.value as UserRole)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400 disabled:opacity-50">
                      <option value="user">کاربر</option>
                      <option value="admin">مدیر</option>
                      <option value="super_admin">مدیر کل</option>
                    </select>
                  ) : (
                    <div className="flex min-h-11 items-center rounded-xl bg-gray-50 px-3 text-sm text-gray-700">{roleLabels[user.role]}</div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-gray-400">تغییرات از طریق توابع امن دیتابیس ثبت می‌شوند. مدیر عادی امکان تغییر نقش‌ها را ندارد.</p>
    </main>
  );
}
