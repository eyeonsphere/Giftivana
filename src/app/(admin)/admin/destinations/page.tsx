import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/helpers";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminDestinationsPage() {
  const supabase = createAdminClient();

  const [{ data: countries }, { data: cities }, { data: settings }] = await Promise.all([
    supabase.from("countries").select("*").order("sort_order, name"),
    supabase.from("cities").select("*").order("country_code, sort_order"),
    supabase.from("delivery_settings").select("*"),
  ]);

  const settingsMap = new Map(
    (settings ?? []).map((s: Record<string, unknown>) => [s.city_id as string, s])
  );

  const citiesByCountry = new Map<string, Record<string, unknown>[]>();
  for (const city of cities ?? []) {
    const cc = city.country_code as string;
    if (!citiesByCountry.has(cc)) citiesByCountry.set(cc, []);
    citiesByCountry.get(cc)!.push(city);
  }

  async function toggleCountryFlag(formData: FormData) {
    "use server";
    await requireStaff();
    const admin = createAdminClient();
    const code = formData.get("code") as string;
    const field = formData.get("field") as string;
    const current = formData.get("current") === "true";
    await admin.from("countries").update({ [field]: !current }).eq("code", code);
    revalidatePath("/admin/destinations");
  }

  async function updateDeliverySettings(formData: FormData) {
    "use server";
    await requireStaff();
    const admin = createAdminClient();
    const cityId = formData.get("cityId") as string;
    await admin.from("delivery_settings").upsert({
      city_id: cityId,
      min_lead_days: parseInt(formData.get("minLeadDays") as string),
      max_advance_days: parseInt(formData.get("maxAdvanceDays") as string),
      cutoff_time: formData.get("cutoffTime") as string,
    });
    revalidatePath("/admin/destinations");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Destinations</h1>

      {/* Countries */}
      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto mb-8">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold">Countries</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead className="border-b text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium text-center">Destination</th>
              <th className="px-4 py-2 font-medium text-center">Origin</th>
              <th className="px-4 py-2 font-medium text-center">Active</th>
              <th className="px-4 py-2 font-medium">Timezone</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(countries ?? []).map((c: Record<string, unknown>) => (
              <tr key={c.code as string} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{c.name as string}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{c.code as string}</td>
                {(["is_destination", "is_origin", "is_active"] as const).map((field) => (
                  <td key={field} className="px-4 py-2 text-center">
                    <form action={toggleCountryFlag} className="inline">
                      <input type="hidden" name="code" value={c.code as string} />
                      <input type="hidden" name="field" value={field} />
                      <input type="hidden" name="current" value={String(c[field])} />
                      <button type="submit" className={`rounded px-2 py-0.5 text-xs ${c[field] ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {c[field] ? "Yes" : "No"}
                      </button>
                    </form>
                  </td>
                ))}
                <td className="px-4 py-2 text-xs text-gray-500">{c.default_timezone as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cities by country */}
      {(countries ?? [])
        .filter((c: Record<string, unknown>) => c.is_destination)
        .map((country: Record<string, unknown>) => {
          const cc = country.code as string;
          const countryCities = citiesByCountry.get(cc) ?? [];
          return (
            <div key={cc} className="rounded-lg border bg-white shadow-sm overflow-x-auto mb-6">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold">{country.name as string} — Cities &amp; delivery</h2>
              </div>
              <table className="min-w-full text-sm">
                <thead className="border-b text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">City</th>
                    <th className="px-4 py-2 font-medium">Slug</th>
                    <th className="px-4 py-2 font-medium text-center">Active</th>
                    <th className="px-4 py-2 font-medium text-center">Lead days</th>
                    <th className="px-4 py-2 font-medium text-center">Max advance</th>
                    <th className="px-4 py-2 font-medium text-center">Cutoff</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {countryCities.map((city: Record<string, unknown>) => {
                    const ds = settingsMap.get(city.id as string) as Record<string, unknown> | undefined;
                    return (
                      <tr key={city.id as string} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{city.name as string}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{city.slug as string}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`rounded px-2 py-0.5 text-xs ${city.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                            {city.is_active ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <form action={updateDeliverySettings} className="inline-flex items-center gap-1">
                            <input type="hidden" name="cityId" value={city.id as string} />
                            <input
                              name="minLeadDays"
                              type="number"
                              defaultValue={(ds?.min_lead_days as number) ?? 3}
                              className="w-14 rounded border-gray-300 text-center text-xs"
                            />
                            <input type="hidden" name="maxAdvanceDays" value={(ds?.max_advance_days as number) ?? 45} />
                            <input type="hidden" name="cutoffTime" value={(ds?.cutoff_time as string) ?? "14:00"} />
                            <button type="submit" className="text-xs text-blue-600 hover:underline">Save</button>
                          </form>
                        </td>
                        <td className="px-4 py-2 text-center text-gray-500">
                          {(ds?.max_advance_days as number) ?? 45}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-500">
                          {(ds?.cutoff_time as string) ?? "14:00"}
                        </td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    );
                  })}
                  {countryCities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-400">No cities</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
    </div>
  );
}
