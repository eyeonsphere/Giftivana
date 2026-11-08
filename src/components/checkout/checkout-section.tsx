"use client";

interface CheckoutSectionProps {
  stepNumber: number;
  title: string;
  isActive: boolean;
  isComplete: boolean;
  summary?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}

export function CheckoutSection({
  stepNumber,
  title,
  isActive,
  isComplete,
  summary,
  onEdit,
  children,
}: CheckoutSectionProps) {
  return (
    <div className="rounded-card border border-sand bg-white overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 ${
          isActive ? "bg-white" : "bg-ivory/50"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
            isComplete
              ? "bg-emerald-600 text-white"
              : isActive
                ? "bg-ink text-white"
                : "bg-sand/50 text-ink/40"
          }`}
        >
          {isComplete ? "✓" : stepNumber}
        </span>

        <span
          className={`font-display text-base font-medium ${
            isActive ? "text-ink" : "text-ink/60"
          }`}
        >
          {title}
        </span>

        {isComplete && !isActive && summary && (
          <span className="ml-auto mr-2 text-sm text-ink/50 truncate max-w-[200px]">
            {summary}
          </span>
        )}

        {isComplete && !isActive && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto shrink-0 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Edit
          </button>
        )}
      </div>

      {/* Body */}
      {isActive && (
        <div className="border-t border-sand/50 px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      )}
    </div>
  );
}
