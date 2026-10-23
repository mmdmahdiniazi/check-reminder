import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

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
const roleLabels: Record<UserRole, string> = { user: "کاربر", admin: "مدیر", super_admin: "مدیر کل" };
const planLabels: Record<UserPlan, string> = { free: "رایگان", pro: "حرفه‌ای", enterprise: "سازمانی" };

type AdminPanelProps = { currentRole: UserRole; onBack: () => void };

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
  }, [loadUsers]);

  const updatePlan = async (userId: string, plan: UserPlan) => {
    setBusyUserId(userId);
    setError("");
    setNotice("");
    try {
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
    } finally {
      setBusyUserId(null);
    }
  };

  const updateRole = async (userId: string, role: UserRole) => {
    if (currentRole !== "super_admin") return;
    setBusyUserId(userId);
    setError("");
    setNotice("");
    try {
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
    } finally {
      setBusyUserId(null);
    }
  };

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((user) =>
    [user.email ?? "", user.phone ?? "", roleLabels[user.role], planLabels[user.plan]]
      .join(" ").toLocaleLowerCase().includes(normalizedQuery),
  );

  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-white bg-gradient-to-l from-[#123b4a] via-[#145969] to-[#0c777d] p-5 text-white shadow-xl shadow-teal-950/10 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl">⚙</div>
          <div>
            <p className="text-sm font-medium text-teal-100">فضای مدیریت</p>
            <h1 className="mt-1 text-2xl font-extrabold">مدیریت کاربران</h1>
            <p className="mt-2 text-sm text-teal-50/80">نقش‌ها و سطح دسترسی حساب‌ها را از یکجا مدیریت کنید.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void loadUsers()} disabled={loading} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            {loading ? "در حال بروزرسانی..." : "بروزرسانی"}
          </Button>
          <Button variant="secondary" onClick={onBack}>بازگشت به چک‌ها</Button>
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">کل حساب‌ها</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight">{users.length.toLocaleString("fa-IR")}</p>
          <p className="mt-1 text-xs text-muted-foreground">حساب ثبت‌شده در سامانه</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">مدیران</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight">{users.filter((user) => user.role !== "user").length.toLocaleString("fa-IR")}</p>
          <p className="mt-1 text-xs text-muted-foreground">دارای دسترسی مدیریتی</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">پلن‌های حرفه‌ای و سازمانی</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight">{users.filter((user) => user.plan !== "free").length.toLocaleString("fa-IR")}</p>
          <p className="mt-1 text-xs text-muted-foreground">حساب‌های ارتقایافته</p>
        </CardContent></Card>
      </section>

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold">فهرست حساب‌ها</h2>
            <p className="mt-1 text-sm text-muted-foreground">{filteredUsers.length.toLocaleString("fa-IR")} نتیجه از {users.length.toLocaleString("fa-IR")} کاربر</p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input id="admin-user-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو با ایمیل، موبایل، نقش یا پلن" aria-label="جستجوی کاربران" />
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{notice}</p>}

      {loading ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-teal-100 border-t-teal-700" />
          در حال دریافت فهرست کاربران...
        </CardContent></Card>
      ) : filteredUsers.length === 0 ? (
        <Card><CardContent className="px-4 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">⌕</div>
          <p className="mt-4 font-semibold">کاربری پیدا نشد</p>
          <p className="mt-1 text-sm text-muted-foreground">عبارت جستجو را تغییر دهید یا فهرست را پاک کنید.</p>
          {query && <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery("")}>پاک کردن جستجو</Button>}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="transition-shadow hover:shadow-md">
              <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px] lg:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-800">{(user.email || user.phone || "؟").slice(0, 1).toLocaleUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="break-all font-bold text-foreground">{user.email || "بدون ایمیل"}</p>
                    <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{user.phone || "شماره موبایل ثبت نشده"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={user.role === "user" ? "secondary" : "default"}>{roleLabels[user.role]}</Badge>
                      <Badge variant={user.plan === "free" ? "outline" : "success"}>{planLabels[user.plan]}</Badge>
                      <span className="text-xs text-muted-foreground">عضویت: {new Date(user.created_at).toLocaleDateString("fa-IR")}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor={`plan-${user.id}`} className="text-xs font-semibold text-muted-foreground">پلن حساب</label>
                  <select id={`plan-${user.id}`} value={user.plan} disabled={busyUserId === user.id} onChange={(event) => void updatePlan(user.id, event.target.value as UserPlan)} className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-ring/15 disabled:opacity-50">
                    <option value="free">رایگان</option><option value="pro">حرفه‌ای</option><option value="enterprise">سازمانی</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor={`role-${user.id}`} className="text-xs font-semibold text-muted-foreground">نقش کاربر</label>
                  {currentRole === "super_admin" ? (
                    <select id={`role-${user.id}`} value={user.role} disabled={busyUserId === user.id} onChange={(event) => void updateRole(user.id, event.target.value as UserRole)} className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-ring/15 disabled:opacity-50">
                      <option value="user">کاربر</option><option value="admin">مدیر</option><option value="super_admin">مدیر کل</option>
                    </select>
                  ) : <div className="flex h-11 items-center rounded-xl bg-muted px-3 text-sm">{roleLabels[user.role]}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-5 text-xs leading-6 text-muted-foreground">تغییرات از طریق توابع امن دیتابیس ثبت می‌شوند. مدیر عادی امکان تغییر نقش‌ها را ندارد.</p>
    </main>
  );
}
