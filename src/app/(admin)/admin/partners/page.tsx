import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { connection } from "next/server";


const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
};

export default async function AdminPartnersPage() {
  await connection();
  const supabase = createAdminClient();
  const { data: partners } = await supabase
    .from("partners")
    .select("*, countries(name)")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Partners</h1>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Store type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Fulfillment</th>
              <th className="px-4 py-3 font-medium text-center">Demo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(partners ?? []).map((p: Record<string, unknown>) => {
              const country = p.countries as Record<string, unknown> | null;
              const methods = (p.supported_fulfillment_methods as string[]) ?? [];
              return (
                <tr key={p.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/partners/${p.id}`} className="font-medium text-blue-600 hover:underline">
                      {p.name as string}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(country?.name as string) ?? (p.country_code as string)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{p.store_category as string}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status as string] ?? "bg-gray-100"}`}>
                      {p.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{methods.join(", ")}</td>
                  <td className="px-4 py-3 text-center">{p.is_demo ? "Yes" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
