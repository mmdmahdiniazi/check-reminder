/**
 * مدل یک چک در سمت رابط کاربری.
 * نام فیلدها camelCase است و هنگام ارتباط با Supabase به snake_case
 * (مثل sayadi_number) نگاشت می‌شود (به App.tsx مراجعه کنید).
 */
export type Check = {
  /** شناسه‌ی یکتا؛ برای چک جدید که هنوز ذخیره نشده، رشته‌ی خالی است */
  id: string;
  /** نام بانک صادرکننده */
  bank: string;
  /** شماره صیادی ۱۶ رقمی */
  sayadiNumber: string;
  /** شماره سریال چک */
  serialNumber: string;
  /** تاریخ سررسید شمسی به شکل «1405/07/20» */
  dueDate: string;
  /** مبلغ چک به تومان */
  amount: number;
  /** نام صاحب چک */
  ownerName: string;
  /** شماره موبایل صاحب چک (۱۱ رقم، با 09 شروع می‌شود) */
  mobile: string;
};
