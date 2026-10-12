"use client";
import { useActionState, useRef, useEffect } from "react";
import type { AdminState } from "@/app/actions/admin";

/** Generic form wrapper that shows success/error messages from a server action. */
export function ActionForm({
  action,
  children,
  submit,
  className,
  resetOnSuccess,
}: {
  action: (p: AdminState, fd: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  submit: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>}
      {state.ok && <p className="mt-3 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-600" role="status">{state.ok}</p>}
      <button disabled={pending} className="btn-navy mt-4">{pending ? "Saving…" : submit}</button>
    </form>
  );
}
