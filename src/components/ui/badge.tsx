import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
const variants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  success: "border-transparent bg-emerald-50 text-emerald-700",
  warning: "border-transparent bg-amber-50 text-amber-700",
  destructive: "border-transparent bg-red-50 text-red-700",
  outline: "border-border bg-white text-foreground",
};
export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors", variants[variant], className)} {...props} />;
}
