import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("py-12 sm:py-16", className)}>
      <div className="ev-container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  intro,
  action,
  as: As = "h2",
}: {
  title: string;
  intro?: string;
  action?: { href: string; label: string };
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <As>{title}</As>
        {intro && <p className="mt-2 text-ink-soft">{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className="shrink-0 text-[15px] font-medium text-green-800 underline-offset-4 hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-paper/60 px-6 py-14 text-center">
      <h3 className="font-sans text-lg font-semibold">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-md text-ink-soft">{body}</p>}
      {children && <div className="mt-6 flex justify-center gap-3">{children}</div>}
    </div>
  );
}
