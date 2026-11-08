import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Form primitives with the label wired to the control, hint and error text
 * announced via aria-describedby, and a visible focus ring from globals.css.
 */

const control =
  "w-full rounded-control border border-line-strong bg-paper px-3.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-green-500 disabled:bg-ivory-deep disabled:text-ink-muted aria-invalid:border-danger";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ id, label, hint, error, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Input({ id, label, hint, error, className, wrapperClassName, ...rest }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input id={id} className={cn(control, "h-11", className)} aria-invalid={!!error || undefined} aria-describedby={describedBy(id, hint, error)} {...rest} />
    </FieldShell>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Select({ id, label, hint, error, className, wrapperClassName, children, ...rest }: SelectProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select
        id={id}
        className={cn(
          control,
          "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22><path d=%22M4 6l4 4 4-4%22 fill=%22none%22 stroke=%22%233f4a43%22 stroke-width=%221.6%22 stroke-linecap=%22round%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center] pe-9",
          className,
        )}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Textarea({ id, label, hint, error, className, wrapperClassName, ...rest }: TextareaProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea
        id={id}
        className={cn(control, "min-h-24 py-2.5", className)}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </FieldShell>
  );
}
