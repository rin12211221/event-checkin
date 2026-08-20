"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { loginAdmin } from "@/app/actions";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      const result = await loginAdmin(String(data.get("pin") ?? ""));
      if (!result.ok) return setError(result.error ?? "Could not sign in.");
      router.replace("/admin");
      router.refresh();
    });
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Staff PIN<input name="pin" type="password" inputMode="numeric" autoFocus required /></label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="button button-primary button-large" disabled={pending}>{pending ? "Opening…" : "Open dashboard"}</button>
    </form>
  );
}
