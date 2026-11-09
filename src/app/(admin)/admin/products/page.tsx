import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
  archived: "bg-red-100 text-red-800",
};

interface Props {
  searchParams: Promise<{ status?: string; type?: string }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const { status, type } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (type && type !== "all") query = query.eq("product_type", type);

  const { data: products } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          New product
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Status:</span>
          {["all", "active", "draft", "archived"].map((s) => (
            <Link
              key={s}
              href={`/admin/products?status=${s}${type ? `&type=${type}` : ""}`}
              className={`rounded-full px-3 py-1 ${(!status && s === "all") || status === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {s}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Type:</span>
          {["all", "physical", "gift_card"].map((t) => (
            <Link
              key={t}
              href={`/admin/products?type=${t}${status ? `&status=${status}` : ""}`}
              className={`rounded-full px-3 py-1 ${(!type && t === "all") || type === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {t === "gift_card" ? "gift card" : t}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Base price</th>
              <th className="px-4 py-3 font-medium text-center">Featured</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(products ?? []).map((p: Record<string, unknown>) => {
              const cat = p.categories as Record<string, unknown> | null;
              return (
                <tr key={p.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-blue-600 hover:underline">
                      {p.name as string}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(cat?.name as string) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                      {p.product_type === "gift_card" ? "gift card" : "physical"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status as string] ?? "bg-gray-100"}`}>
                      {p.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">
                    {((p.base_price_minor as number) / 100).toFixed(2)} {p.currency as string}
                  </td>
                  <td className="px-4 py-3 text-center">{p.is_featured ? "★" : ""}</td>
                </tr>
              );
            })}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
