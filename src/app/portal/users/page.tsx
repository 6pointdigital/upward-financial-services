import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/env";
import { listDealerships } from "@/lib/data";
import { createUser, resetUserPassword, updateUser } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { date } from "@/lib/format";

type U = { id: number; name: string; email: string; role: string; active: number; dealership_name: string | null; last_login_at: string | null };

export default async function Users() {
  const me = await requireAdmin();
  const db = await getDb();
  const [users, dealers] = await Promise.all([
    db.prepare("SELECT u.id, u.name, u.email, u.role, u.active, u.last_login_at, d.name AS dealership_name FROM users u LEFT JOIN dealerships d ON d.id = u.dealership_id ORDER BY u.role, u.name").all<U>(),
    listDealerships(true),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold text-navy-900">Users</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card divide-y divide-slate-100">
          {users.results.map((u) => (
            <details key={u.id} className={`group p-4 ${u.active ? "" : "opacity-60"}`}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{u.name} {!u.active && <span className="text-xs text-red-600">(disabled)</span>}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <span className={`badge ${u.role === "admin" ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-700"}`}>{u.role === "admin" ? "Upward admin" : u.dealership_name ?? "Dealer"}</span>
                  <p className="mt-1">Last login {date(u.last_login_at)}</p>
                </div>
              </summary>
              {u.id !== me.id && (
                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <ActionForm action={resetUserPassword} submit="Reset password" resetOnSuccess>
                    <input type="hidden" name="id" value={u.id} />
                    <label className="label" htmlFor={`pw-${u.id}`}>New temporary password</label>
                    <input id={`pw-${u.id}`} name="password" type="text" minLength={10} required className="input" autoComplete="off" />
                  </ActionForm>
                  <form action={updateUser} className="sm:text-right">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="op" value="toggle" />
                    <span className="label">Access</span>
                    <button className={u.active ? "btn-danger" : "btn-ghost"}>{u.active ? "Disable account" : "Re-enable account"}</button>
                  </form>
                </div>
              )}
            </details>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-navy-900">Add user</h2>
          <ActionForm action={createUser} submit="Create user" className="mt-4 space-y-3" resetOnSuccess>
            <div><label className="label" htmlFor="u-name">Full name *</label><input id="u-name" name="name" required className="input" /></div>
            <div><label className="label" htmlFor="u-email">Email *</label><input id="u-email" name="email" type="email" required className="input" /></div>
            <div><label className="label" htmlFor="u-role">Role</label>
              <select id="u-role" name="role" className="input" defaultValue="dealer">
                <option value="dealer">Dealer — manages own dealership’s listings</option>
                <option value="admin">Upward admin — full access</option>
              </select>
            </div>
            <div><label className="label" htmlFor="u-dealer">Dealership (for dealer users)</label>
              <select id="u-dealer" name="dealership_id" className="input" defaultValue="">
                <option value="">—</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="u-pw">Temporary password *</label><input id="u-pw" name="password" type="text" minLength={10} required autoComplete="off" className="input" /></div>
            <p className="text-xs text-slate-500">They can change it under “My account” after logging in.</p>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
