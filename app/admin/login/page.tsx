"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!configured) {
      setMessage("Supabase is not connected yet. Add the project URL and publishable key to .env.local first.");
      return;
    }
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="adminLoginPage">
      <section className="adminLoginCard">
        <a href="/" className="adminBrand"><span className="brandMark">R</span><span><strong>Rover</strong><small>Portfolio Admin</small></span></a>
        <p className="adminKicker">PRIVATE AREA</p>
        <h1>Welcome back.</h1>
        <p className="adminMuted">Sign in with the administrator account to manage Rover&apos;s portfolio.</p>
        <form onSubmit={submit} className="adminLoginForm">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          <button type="submit" className="adminPrimary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        {message && <p className="adminMessage">{message}</p>}
        <a href="/" className="backToSite">← Back to portfolio</a>
      </section>
    </main>
  );
}
