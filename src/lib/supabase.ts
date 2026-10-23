import { createClient } from "@supabase/supabase-js";

/**
 * کلاینت مشترک Supabase برای کل برنامه.
 * مقادیر از متغیرهای محیطی Vite (فایل .env.local) خوانده می‌شوند.
 * فقط کلید عمومی (publishable) مجاز است؛ هرگز کلید service-role را اینجا نگذارید.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// اگر متغیرها تنظیم نشده باشند، به‌جای خطای مبهم Supabase، پیام واضح می‌دهیم
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "متغیرهای VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY تنظیم نشده‌اند. فایل .env.local را بررسی کنید.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
