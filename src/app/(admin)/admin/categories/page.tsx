import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/helpers";


export default async function AdminCategoriesPage() {
  await connection();
  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  async function createCategory(formData: FormData) {
    "use server";
    await requireStaff();
    const admin = createAdminClient();
    await admin.from("categories").insert({
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string).toLowerCase().replace(/\s+/g, "-"),
      description: (formData.get("description") as string) ?? "",
      product_type: formData.get("productType") as string,
      sort_order: parseInt(formData.get("sortOrder") as string) || 0,
      is_active: true,
    });
    revalidatePath("/admin/categories");
  }

  async function toggleActive(formData: FormData) {
    "use server";
    await requireStaff();
    const admin = createAdminClient();
    const id = formData.get("id") as string;
    const current = formData.get("isActive") === "true";
    await admin.from("categories").update({ is_active: !current }).eq("id", id);
    revalidatePath("/admin/categories");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Categories</h1>

      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-center">Sort</th>
              <th className="px-4 py-3 font-medium text-center">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(categories ?? []).map((c: Record<string, unknown>) => (
              <tr key={c.id as string} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name as string}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.slug as string}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {c.product_type === "gift_card" ? "gift card" : "physical"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-500">{c.sort_order as number}</td>
                <td className="px-4 py-3 text-center">
                  <form action={toggleActive} className="inline">
                    <input type="hidden" name="id" value={c.id as string} />
                    <input type="hidden" name="isActive" value={String(c.is_active)} />
                    <button type="submit" className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add category</h2>
        <form action={createCategory} className="grid grid-cols-1 gap-4 sm:grid-cols-5 items-end">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Slug</span>
            <input name="slug" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Type</span>
            <select name="productType" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
              <option value="physical">Physical</option>
              <option value="gift_card">Gift card</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Sort order</span>
            <input name="sortOrder" type="number" defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </label>
          <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
