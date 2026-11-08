import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "green" | "gold" | "peach" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-ivory-deep text-ink-soft",
  green: "bg-green-100 text-green-800",
  gold: "bg-gold-200 text-[#5f4a17]",
  peach: "bg-peach-200 text-[#7a4a2e]",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
