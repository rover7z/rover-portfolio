"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type Lang = "ar" | "en";
const copy = {
  ar: { admin: "إدارة معرض الأعمال", private: "منطقة خاصة", welcome: "أهلاً برجعتك.", desc: "سجّل الدخول بحساب الأدمن لإدارة موقع Rover.", email: "البريد الإلكتروني", password: "كلمة المرور", signIn: "تسجيل الدخول", signing: "جاري الدخول…", back: "→ العودة إلى الموقع", notConnected: "Supabase غير مربوط بالموقع بعد." },
  en: { admin: "Portfolio Admin", private: "PRIVATE AREA", welcome: "Welcome back.", desc: "Sign in with the administrator account to manage Rover's portfolio.", email: "Email", password: "Password", signIn: "Sign in", signing: "Signing in…", back: "← Back to portfolio", notConnected: "Supabase is not connected yet." },
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>("ar");
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const t = copy[lang];

  useEffect(() => {
    const saved = window.localStorage.getItem("rover-admin-lang");
    if (saved === "ar" || saved === "en") setLang(saved);
  }, []);

  function changeLang(next: Lang) {
    setLang(next);
    window.localStorage.setItem("rover-admin-lang", next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!configured) { setMessage(t.notConnected); return; }
    setLoading(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    router.replace("/admin"); router.refresh();
  }

  return (
    <main className="adminLoginPage" dir={lang === "ar" ? "rtl" : "ltr"}>
      <section className="adminLoginCard">
        <div className="adminLoginLang"><button className={lang === "ar" ? "active" : ""} onClick={() => changeLang("ar")}>العربية</button><button className={lang === "en" ? "active" : ""} onClick={() => changeLang("en")}>EN</button></div>
        <a href="/" className="adminBrand"><span className="brandMark">R</span><span><strong>Rover</strong><small>{t.admin}</small></span></a>
        <p className="adminKicker">{t.private}</p><h1>{t.welcome}</h1><p className="adminMuted">{t.desc}</p>
        <form onSubmit={submit} className="adminLoginForm"><label>{t.email}<input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label><label>{t.password}<input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label><button type="submit" className="adminPrimary" disabled={loading}>{loading ? t.signing : t.signIn}</button></form>
        {message && <p className="adminMessage">{message}</p>}<a href="/" className="backToSite">{t.back}</a>
      </section>
    </main>
  );
}
