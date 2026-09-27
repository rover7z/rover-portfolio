"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

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
  }, [pathname]);

  return null;
}
