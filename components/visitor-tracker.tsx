"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function makeId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

function getVisitorId() {
  const key = "rover_visitor_id";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = memoryVisitorId ?? makeId("rv");
      memoryVisitorId = id;
      localStorage.setItem(key, id);
    }
    memoryVisitorId = id;
    return id;
  } catch {
    return memoryVisitorId ??= makeId("rv");
  }
}

function getSessionId() {
  const key = "rover_session_id";
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = memorySessionId ?? makeId("rs");
      memorySessionId = id;
      sessionStorage.setItem(key, id);
    }
    memorySessionId = id;
    return id;
  } catch {
    return memorySessionId ??= makeId("rs");
  }
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
