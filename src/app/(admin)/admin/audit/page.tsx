import { requireAdmin } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ action?: string; entity?: string; page?: string }>;
}

export default async function AuditLogPage({ searchParams }: Props) {
  await requireAdmin();
  const { action, entity, page: pageStr } = await searchParams;
  const supabase = createAdminClient();

  const pageSize = 50;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (action) query = query.eq("action", action);
  if (entity) query = query.eq("entity_type", entity);

  const { data: rows, count } = await query;

  // Get distinct actions and entity types for filters
  const { data: actionsRaw } = await supabase
    .from("admin_audit_log")
    .select("action")
    .limit(100);
  const distinctActions = [...new Set((actionsRaw ?? []).map((r: Record<string, unknown>) => r.action as string))].sort();

  const { data: entitiesRaw } = await supabase
    .from("admin_audit_log")
    .select("entity_type")
    .limit(100);
  const distinctEntities = [...new Set((entitiesRaw ?? []).map((r: Record<string, unknown>) => r.entity_type as string))].sort();

  // Look up actor names
  const actorIds = [...new Set((rows ?? []).map((r: Record<string, unknown>) => r.actor_id).filter(Boolean))] as string[];
  let actorMap = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    actorMap = new Map((profiles ?? []).map((p: Record<string, unknown>) => [p.id as string, (p.full_name as string) ?? "Unknown"]));
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (params.action ?? action) sp.set("action", (params.action ?? action)!);
    if (params.entity ?? entity) sp.set("entity", (params.entity ?? entity)!);
    if (params.page) sp.set("page", params.page);
    const qs = sp.toString();
    return `/admin/audit${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit log</h1>
        <p className="mt-1 text-sm text-gray-500">
          {count ?? 0} entries{action ? ` filtered by action "${action}"` : ""}{entity ? ` for ${entity}` : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="action-filter" className="block text-xs font-medium text-gray-500 mb-1">Action</label>
          <form>
            <select
              id="action-filter"
              name="action"
              defaultValue={action ?? ""}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              
            >
              <option value="">All actions</option>
              {distinctActions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {entity && <input type="hidden" name="entity" value={entity} />}
            <noscript><button type="submit" className="ml-1 text-sm text-indigo-600">Apply</button></noscript>
          </form>
        </div>
        <div>
          <label htmlFor="entity-filter" className="block text-xs font-medium text-gray-500 mb-1">Entity type</label>
          <form>
            <select
              id="entity-filter"
              name="entity"
              defaultValue={entity ?? ""}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              
            >
              <option value="">All entities</option>
              {distinctEntities.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            {action && <input type="hidden" name="action" value={action} />}
            <noscript><button type="submit" className="ml-1 text-sm text-indigo-600">Apply</button></noscript>
          </form>
        </div>
        {(action || entity) && (
          <div className="flex items-end">
            <a href="/admin/audit" className="text-sm text-indigo-600 hover:text-indigo-800">
              Clear filters
            </a>
          </div>
        )}
      </div>

      {/* Table */}
      {!rows?.length ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          No audit log entries{action || entity ? " matching filters" : ""}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Entity ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row: Record<string, unknown>) => (
                <tr key={row.id as string} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {new Date(row.created_at as string).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {row.actor_id ? actorMap.get(row.actor_id as string) ?? (row.actor_id as string).slice(0, 8) : "system"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                      {row.action as string}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {row.entity_type as string}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-500">
                    {((row.entity_id as string) ?? "—").slice(0, 12)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                    {row.before || row.after ? (
                      <details>
                        <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                          View diff
                        </summary>
                        <div className="mt-2 space-y-2">
                          {row.before ? (
                            <div>
                              <span className="font-medium text-red-600">Before:</span>
                              <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                                {String(JSON.stringify(row.before, null, 2))}
                              </pre>
                            </div>
                          ) : null}
                          {row.after ? (
                            <div>
                              <span className="font-medium text-green-600">After:</span>
                              <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                                {String(JSON.stringify(row.after, null, 2))}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
