import { requireUser } from "@/lib/auth";
import { changeOwnPassword } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";

export default async function Account() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold text-navy-900">My account</h1>
      <p className="mt-1 text-sm text-slate-600">{user.name} · {user.email}</p>
      <ActionForm action={changeOwnPassword} submit="Change password" className="card mt-6 space-y-3 p-5" resetOnSuccess>
        <div><label className="label" htmlFor="cur">Current password</label><input id="cur" name="current" type="password" required autoComplete="current-password" className="input" /></div>
        <div><label className="label" htmlFor="np">New password (10+ characters)</label><input id="np" name="password" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
        <div><label className="label" htmlFor="cp">Confirm new password</label><input id="cp" name="confirm" type="password" required autoComplete="new-password" className="input" /></div>
      </ActionForm>
    </div>
  );
}
