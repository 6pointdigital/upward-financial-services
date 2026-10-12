"use client";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";

type Field = { name: string; label: string; type?: string; autoComplete?: string };

export function AuthForm({
  action,
  fields,
  submit,
}: {
  action: (p: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[];
  submit: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="label" htmlFor={`af-${f.name}`}>{f.label}</label>
          <input id={`af-${f.name}`} name={f.name} type={f.type ?? "text"} required autoComplete={f.autoComplete} className="input" />
        </div>
      ))}
      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn-navy w-full">{pending ? "Please wait…" : submit}</button>
    </form>
  );
}
