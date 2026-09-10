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

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", unreadIds);

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
        className="relative flex h-11 w-11 items-center justify-center rounded-lg border bg-white text-gray-600 transition hover:bg-gray-50"
        aria-label="اعلان‌ها"
        aria-expanded={isOpen}
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
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.7.64 3.49 1.1 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-xl border bg-white shadow-lg sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-[350px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">اعلان‌ها</h3>

              <p className="mt-0.5 text-xs text-gray-400">
                {unreadCount} اعلان خوانده نشده
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="min-h-10 rounded-lg px-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                خواندن همه
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="max-h-[60vh] overflow-y-auto sm:max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-gray-500">اعلانی وجود ندارد</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`block w-full border-b px-4 py-4 text-right transition last:border-b-0 hover:bg-gray-50 ${
                    !notification.is_read ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.is_read ? "bg-gray-300" : "bg-red-500"
                      }`}
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
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
