import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-12">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-md">
        {children}
      </div>
    </div>
  );
}
