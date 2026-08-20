import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="admin-login-shell">
      <section className="login-card">
        <div className="brand-pill">UPSWELL · CHECK-IN</div>
        <h1>Staff access</h1>
        <p className="muted">Enter the staff PIN to open events and the scanner.</p>
        <LoginForm />
      </section>
    </main>
  );
}
