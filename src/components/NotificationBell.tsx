import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications(data ?? []);
  };

  useEffect(() => {
    // Load notifications when the bell mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              is_read: true,
            }
          : notification,
      ),
    );
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    setIsMarkingAll(true);

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", unreadIds);

    setIsMarkingAll(false);

    if (error) {
      console.error("Error marking notifications as read:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition ${
          isOpen
            ? "border-gray-300 bg-gray-100 text-gray-900"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
        aria-label="اعلان‌ها"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.7.64 3.49 1.1 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-20 z-50 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-2xl shadow-slate-950/15 sm:absolute sm:left-0 sm:right-auto sm:top-14 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/80 px-4 py-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950">اعلان‌ها</h3>

              <p className="mt-1 text-xs text-gray-400">
                {unreadCount === 0
                  ? "همه اعلان‌ها خوانده شده‌اند"
                  : `${unreadCount} اعلان خوانده نشده`}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarkingAll ? "در حال انجام..." : "خواندن همه"}
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto sm:max-h-[420px]">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.5-2.5V10a6.5 6.5 0 0 0-13 0v4.5L4 17h5m6 0a3 3 0 0 1-6 0"
                    />
                  </svg>
                </div>

                <p className="text-sm font-medium text-gray-600">
                  اعلانی وجود ندارد
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  اعلان‌های مربوط به سررسید چک‌ها اینجا نمایش داده می‌شوند.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`block w-full border-b border-gray-100 px-4 py-4 text-right transition last:border-b-0 hover:bg-gray-50 ${
                    notification.is_read ? "bg-white" : "bg-gray-50/80"
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        notification.is_read ? "bg-gray-300" : "bg-teal-600"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm ${
                            notification.is_read
                              ? "font-medium text-gray-700"
                              : "font-bold text-gray-900"
                          }`}
                        >
                          {notification.title}
                        </p>

                        {!notification.is_read && (
                          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                            جدید
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-6 text-gray-500">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
