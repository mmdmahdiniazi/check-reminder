export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount);
}

export function formatMobile(mobile: string): string {
  return mobile.replace(/(\d{4})(?=\d)/g, "$1 ");
}
