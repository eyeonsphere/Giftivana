import { createAdminClient } from "@/lib/supabase/admin";
import { updateProduct } from "../actions";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;

  // "new" is handled as a create form
  const isNew = id === "new";

  const supabase = createAdminClient();

  const [{ data: categories }, { data: partners }] = await Promise.all([
    supabase.from("categories").select("id, name, product_type").order("sort_order"),
    supabase.from("partners").select("id, name").order("name"),
  ]);

  let product: Record<string, unknown> | null = null;
  let variants: Record<string, unknown>[] = [];
  let denominations: Record<string, unknown>[] = [];

  if (!isNew) {
    const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (!p) notFound();
    product = p;

    const [vRes, dRes] = await Promise.all([
      supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("gift_card_denominations").select("*").eq("product_id", id).order("sort_order"),
    ]);
    variants = vRes.data ?? [];
    denominations = dRes.data ?? [];
  }

  async function saveProduct(formData: FormData) {
    "use server";
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      shortDescription: formData.get("shortDescription") as string,
      description: formData.get("description") as string,
      categoryId: formData.get("categoryId") as string,
      partnerId: formData.get("partnerId") as string,
      status: formData.get("status") as string,
      isFeatured: formData.get("isFeatured") === "on",
      basePriceMinor: Math.round(parseFloat(formData.get("basePrice") as string) * 100),
      currency: formData.get("currency") as string,
      productType: formData.get("productType") as string,
    };

    if (isNew) {
      const result = await (await import("../actions")).createProduct(data);
      if (result.ok && result.id) redirect(`/admin/products/${result.id}`);
    } else {
      await updateProduct(id, data);
      revalidatePath(`/admin/products/${id}`);
    }
  }


  const p = product ?? {};
  const basePrice = ((p.base_price_minor as number) ?? 0) / 100;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/products" className="text-gray-500 hover:text-gray-700">&larr; Products</Link>
        <h1 className="text-2xl font-semibold">{isNew ? "New product" : (p.name as string)}</h1>
        {!isNew && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-800" : p.status === "draft" ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-800"}`}>
            {p.status as string}
          </span>
        )}
      </div>

      <form action={saveProduct} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input name="name" defaultValue={(p.name as string) ?? ""} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Slug</span>
              <input name="slug" defaultValue={(p.slug as string) ?? ""} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Short description</span>
            <input name="shortDescription" defaultValue={(p.short_description as string) ?? ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <textarea name="description" rows={4} defaultValue={(p.description as string) ?? ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Type</span>
              <select name="productType" defaultValue={(p.product_type as string) ?? "physical"} disabled={!isNew} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="physical">Physical</option>
                <option value="gift_card">Gift card</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Category</span>
              <select name="categoryId" defaultValue={(p.category_id as string) ?? ""} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="">Select...</option>
                {(categories ?? []).map((c: Record<string, unknown>) => (
                  <option key={c.id as string} value={c.id as string}>{c.name as string}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select name="status" defaultValue={(p.status as string) ?? "draft"} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Base price (USD)</span>
              <input name="basePrice" type="number" step="0.01" defaultValue={basePrice || ""} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Currency</span>
              <input name="currency" defaultValue={(p.currency as string) ?? "USD"} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Partner (gift cards)</span>
              <select name="partnerId" defaultValue={(p.partner_id as string) ?? ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="">None</option>
                {(partners ?? []).map((pt: Record<string, unknown>) => (
                  <option key={pt.id as string} value={pt.id as string}>{pt.name as string}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2">
            <input name="isFeatured" type="checkbox" defaultChecked={!!p.is_featured} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Featured on homepage</span>
          </label>
        </div>

        <button type="submit" className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800">
          {isNew ? "Create product" : "Save changes"}
        </button>
      </form>

      {/* Variants (read-only for now) */}
      {!isNew && variants.length > 0 && (
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Variants</h2>
          <table className="min-w-full text-sm">
            <thead className="border-b text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium text-right">Price</th>
                <th className="px-3 py-2 font-medium text-center">Default</th>
                <th className="px-3 py-2 font-medium text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variants.map((v: Record<string, unknown>) => (
                <tr key={v.id as string}>
                  <td className="px-3 py-2">{v.name as string}</td>
                  <td className="px-3 py-2 text-gray-500">{(v.sku as string) ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{((v.price_minor as number) / 100).toFixed(2)} {v.currency as string}</td>
                  <td className="px-3 py-2 text-center">{v.is_default ? "✓" : ""}</td>
                  <td className="px-3 py-2 text-center">{v.is_active ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gift card denominations (read-only for now) */}
      {!isNew && denominations.length > 0 && (
        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Denominations</h2>
          <table className="min-w-full text-sm">
            <thead className="border-b text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium text-right">Face value</th>
                <th className="px-3 py-2 font-medium">Face currency</th>
                <th className="px-3 py-2 font-medium text-right">Charge price</th>
                <th className="px-3 py-2 font-medium">Charge currency</th>
                <th className="px-3 py-2 font-medium text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {denominations.map((d: Record<string, unknown>) => (
                <tr key={d.id as string}>
                  <td className="px-3 py-2 text-right font-mono">{(d.face_value_minor as number).toLocaleString()}</td>
                  <td className="px-3 py-2">{d.face_currency as string}</td>
                  <td className="px-3 py-2 text-right font-mono">{((d.charge_price_minor as number) / 100).toFixed(2)}</td>
                  <td className="px-3 py-2">{d.charge_currency as string}</td>
                  <td className="px-3 py-2 text-center">{d.is_active ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
