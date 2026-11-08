import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "warn" | "danger" | "ok";

const tones: Record<Tone, string> = {
  info: "bg-green-050 text-green-900 border-green-200",
  warn: "bg-warn-bg text-warn border-gold-200",
  danger: "bg-danger-bg text-danger border-[#ebc3bb]",
  ok: "bg-ok-bg text-ok border-green-200",
};

/** Inline message block. `role` is set to "status" or "alert" so screen readers announce it. */
export function Notice({
  tone = "info",
  title,
  children,
  className,
  live = "polite",
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
  live?: "polite" | "assertive";
}) {
  return (
    <div role={live === "assertive" ? "alert" : "status"} className={cn("rounded-control border px-4 py-3 text-sm", tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-1")}>{children}</div>}
    </div>
  );
}
