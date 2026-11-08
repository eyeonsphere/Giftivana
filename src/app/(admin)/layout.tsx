import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth/helpers";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireStaff();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav
        userName={session.user.user_metadata?.full_name ?? session.user.email ?? null}
        userRole={session.role}
      />

      {/* Main content — offset on desktop for the fixed sidebar */}
      <div className="lg:pl-64">
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
