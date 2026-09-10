import { useEffect, useState } from "react";

import CheckCard from "./components/CheckCard";
import CheckModal from "./components/CheckModal";
import NotificationBell from "./components/NotificationBell";
import Toast from "./components/Toast";

import type { Check } from "./types/check";

import { supabase } from "./lib/supabase";

import {
  getNearestDueDate,
  getDueThisWeek,
  getReminderType,
} from "./utils/date";

function App() {
  const [checks, setChecks] = useState<Check[]>([]);
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
    fetchChecks();
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

    const confirmed = window.confirm("آیا از حذف این چک مطمئن هستید؟");

    if (!confirmed) return;

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

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
              مدیریت چک‌ها
            </h1>

            <p className="mt-1 hidden text-sm text-gray-500 sm:block">
              مدیریت و یادآوری سررسید چک‌ها
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />

            <button
              type="button"
              onClick={handleOpenAddModal}
              disabled={isSaving}
              className="min-h-11 rounded-lg bg-black px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <span className="sm:hidden">+ چک</span>

              <span className="hidden sm:inline">+ ثبت چک</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-6">
        {/* Error */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 sm:mb-6">
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

        {/* Stats */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border bg-white p-4 sm:p-5">
            <p className="text-sm text-gray-500">کل چک‌ها</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {checks.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 sm:p-5">
            <p className="text-sm text-gray-500">نزدیک‌ترین سررسید</p>

            <p
              className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl"
              dir="ltr"
            >
              {nearestDueDate ?? "-"}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 sm:p-5">
            <p className="text-sm text-gray-500">سررسید این هفته</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {dueThisWeek}
            </p>
          </div>
        </section>

        {/* Checks */}
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">چک‌های دریافتی</h2>

              <p className="mt-1 text-sm text-gray-500">
                {isSearching
                  ? `${filteredChecks.length} نتیجه از ${checks.length} چک`
                  : `${checks.length} چک ثبت شده`}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا شماره..."
                aria-label="جستجوی چک"
                className="min-h-11 w-full rounded-lg border bg-white px-10 py-2.5 text-base outline-none transition focus:border-gray-400 sm:text-sm"
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
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="پاک کردن جستجو"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border bg-white px-4 py-16 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />

              <p className="mt-3 text-sm text-gray-500">
                در حال دریافت چک‌ها...
              </p>
            </div>
          ) : checks.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white px-5 py-14 text-center">
              <p className="text-sm font-medium text-gray-700">
                هنوز چکی ثبت نشده
              </p>

              <p className="mt-1 text-sm text-gray-400">
                اولین چک خود را ثبت کنید
              </p>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-5 min-h-11 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                + ثبت اولین چک
              </button>
            </div>
          ) : filteredChecks.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>

              <p className="mt-4 text-sm font-medium text-gray-700">
                چکی پیدا نشد
              </p>

              <p className="mt-1 text-sm text-gray-400">
                عبارت جستجو را تغییر دهید یا جستجو را پاک کنید.
              </p>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-5 min-h-11 rounded-lg border px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                پاک کردن جستجو
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
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

      {/* Modal */}
      {isModalOpen && (
        <CheckModal
          check={editingCheck}
          onClose={handleCloseModal}
          onSave={handleSaveCheck}
          isSaving={isSaving}
        />
      )}

      {/* Toast */}
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
