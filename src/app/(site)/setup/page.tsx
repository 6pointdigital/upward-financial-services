import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { setupFirstAdmin } from "@/app/actions/auth";
import { userCount } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up" };

export default async function SetupPage() {
  if ((await userCount()) > 0) redirect("/login");
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="card p-6">
        <h1 className="text-xl font-extrabold text-navy-900">Create the first admin account</h1>
        <p className="mt-1 text-sm text-slate-600">
          This one-time page disappears once an account exists. Use an Upward staff email.
        </p>
        <div className="mt-6">
          <AuthForm
            action={setupFirstAdmin}
            submit="Create admin account"
            fields={[
              { name: "name", label: "Full name", autoComplete: "name" },
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password (10+ characters)", type: "password", autoComplete: "new-password" },
              { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
