import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { login } from "@/app/actions/auth";
import { getCurrentUser, userCount } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/portal");
  if ((await userCount()) === 0) redirect("/setup");
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="card p-6">
        <h1 className="text-xl font-extrabold text-navy-900">Dealer & staff login</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your equipment listings.</p>
        <div className="mt-6">
          <AuthForm
            action={login}
            submit="Log in"
            fields={[
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
            ]}
          />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        Dealer wanting to list with Upward? Contact your Upward representative for an account.{" "}
        <Link href="/" className="font-semibold text-brand-600">Back to inventory</Link>
      </p>
    </div>
  );
}
