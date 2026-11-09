import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/helpers";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPartnerEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: partner }, { data: locations }, { data: countries }] = await Promise.all([
    supabase.from("partners").select("*").eq("id", id).maybeSingle(),
    supabase.from("partner_locations").select("*, cities(name)").eq("partner_id", id).order("label"),
    supabase.from("countries").select("code, name").eq("is_destination", true).order("name"),
  ]);

  if (!partner) notFound();

  async function savePartner(formData: FormData) {
    "use server";
    await requireStaff();
    const admin = createAdminClient();
    await admin.from("partners").update({
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      store_category: formData.get("storeCategory") as string,
      country_code: formData.get("countryCode") as string,
      status: formData.get("status") as string,
      contact_notes: formData.get("contactNotes") as string,
    }).eq("id", id);
    revalidatePath(`/admin/partners/${id}`);
    revalidatePath("/admin/partners");
  }

  const p = partner;
  const methods = (p.supported_fulfillment_methods as string[]) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/partners" className="text-gray-500 hover:text-gray-700">&larr; Partners</Link>
        <h1 className="text-2xl font-semibold">{p.name as string}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-800" : p.status === "draft" ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-800"}`}>
          {p.status as string}
        </span>
        {p.is_demo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Demo</span>}
      </div>

      <form action={savePartner} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Partner details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input name="name" defaultValue={p.name as string} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Slug</span>
              <input name="slug" defaultValue={p.slug as string} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <textarea name="description" rows={3} defaultValue={p.description as string} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Country</span>
              <select name="countryCode" defaultValue={p.country_code as string} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                {(countries ?? []).map((c: Record<string, unknown>) => (
                  <option key={c.code as string} value={c.code as string}>{c.name as string}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Store category</span>
              <select name="storeCategory" defaultValue={p.store_category as string} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="supermarket">Supermarket</option>
                <option value="department">Department store</option>
                <option value="grocery">Grocery</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select name="status" defaultValue={p.status as string} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Fulfillment methods</span>
            <p className="mt-1 text-sm text-gray-500">{methods.join(", ") || "None"}</p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Contact notes (staff only)</span>
            <textarea name="contactNotes" rows={3} defaultValue={(p.contact_notes as string) ?? ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="Internal notes about this partner..." />
          </label>
        </div>

        <button type="submit" className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Save changes
        </button>
      </form>

      {/* Locations */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Locations</h2>
        {(locations ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No locations.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Label</th>
                <th className="px-3 py-2 font-medium">City</th>
                <th className="px-3 py-2 font-medium">Address</th>
                <th className="px-3 py-2 font-medium text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(locations ?? []).map((loc: Record<string, unknown>) => {
                const city = loc.cities as Record<string, unknown> | null;
                return (
                  <tr key={loc.id as string}>
                    <td className="px-3 py-2 font-medium">{loc.label as string}</td>
                    <td className="px-3 py-2 text-gray-600">{(city?.name as string) ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{(loc.address as string) ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{loc.is_active ? "✓" : "✗"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
