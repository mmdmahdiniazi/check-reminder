import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn("flex h-12 w-full rounded-xl border border-input bg-white px-3.5 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}
