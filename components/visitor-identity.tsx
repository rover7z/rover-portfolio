"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase/client";

type Identity = {
  name: string;
  email: string;
  avatar: string;
};

function makeId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

function getVisitorId() {
  const key = "rover_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = makeId("rv");
    localStorage.setItem(key, id);
  }
  return id;
}

function getSessionId() {
  const key = "rover_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = makeId("rs");
    sessionStorage.setItem(key, id);
  }
  return id;
}

function toIdentity(user: User): Identity {
  const meta = user.user_metadata ?? {};
  return {
    name: String(meta.full_name || meta.name || "").trim(),
    email: user.email ?? "",
    avatar: String(meta.avatar_url || meta.picture || "").trim(),
  };
}

export function VisitorIdentity() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [hidden, setHidden] = useState(false);
  const [arabic, setArabic] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    setArabic((navigator.language || "").toLowerCase().startsWith("ar"));

    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId,
        sessionId,
        path: `${location.pathname}${location.search}`,
        referrer: document.referrer || "",
        userAgent: navigator.userAgent || "",
        language: navigator.language || "",
        screenWidth: window.screen?.width ?? null,
        screenHeight: window.screen?.height ?? null,
      }),
    }).catch(() => {});

    let alive = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!alive || !data.user) return;
      setIdentity(toIdentity(data.user));
      await supabase.rpc("identify_site_visitor", { p_visitor_id: visitorId });
    }).catch(() => {});

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session?.user) {
        setIdentity(toIdentity(session.user));
        const id = getVisitorId();
        window.setTimeout(() => {
          void supabase.rpc("identify_site_visitor", { p_visitor_id: id });
        }, 0);
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, supabase]);

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    const redirectTo = `${window.location.origin}/auth/callback?next=/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "openid email profile",
      },
    });
    if (error) {
      setBusy(false);
      setMessage(arabic ? "تعذّر فتح تسجيل Google." : "Could not start Google sign-in.");
    }
  }

  if (pathname.startsWith("/admin") || hidden) return null;

  if (identity) {
    return (
      <div className="rvIdentityChip" dir={arabic ? "rtl" : "ltr"}>
        {identity.avatar ? <img src={identity.avatar} alt="" /> : <span className="rvIdentityInitial">{(identity.name || identity.email || "G").slice(0, 1).toUpperCase()}</span>}
        <div>
          <strong>{identity.name || (arabic ? "تم التعرف عليك" : "You're identified")}</strong>
          <small>{identity.email}</small>
        </div>
        <button type="button" aria-label="Close" onClick={() => setHidden(true)}>×</button>
      </div>
    );
  }

  return (
    <div className="rvGoogleIdentify" dir={arabic ? "rtl" : "ltr"}>
      <button className="rvGoogleClose" type="button" aria-label="Close" onClick={() => setHidden(true)}>×</button>
      <span className="rvGoogleMark">G</span>
      <div className="rvGoogleCopy">
        <strong>{arabic ? "عرّف بنفسك" : "Identify yourself"}</strong>
        <small>{arabic ? "اختياري — باستخدام حساب Google" : "Optional — using your Google account"}</small>
      </div>
      <button className="rvGoogleButton" disabled={busy} type="button" onClick={signInWithGoogle}>
        {busy ? (arabic ? "جاري الفتح…" : "Opening…") : (arabic ? "الدخول بـ Google" : "Continue with Google")}
      </button>
      {message && <small className="rvGoogleError">{message}</small>}
    </div>
  );
}
