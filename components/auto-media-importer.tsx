"use client";

import { useState } from "react";
import type { PortfolioItem, PortfolioKind } from "../lib/content";

type AutoMetadata = {
  url?: string;
  kind?: PortfolioKind;
  title?: string;
  subtitle?: string;
  description?: string;
  platform?: string;
  cover_url?: string;
  year?: string;
  source_rating_text?: string;
  source_rating_label?: string;
};

export function AutoMediaImporter({
  item,
  lang,
  onUrlChange,
  onApply,
}: {
  item: PortfolioItem;
  lang: "ar" | "en";
  onUrlChange: (url: string) => void;
  onApply: (data: AutoMetadata) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isAr = lang === "ar";

  async function fetchDetails() {
    const url = item.external_url?.trim();
    if (!url) {
      setMessage(isAr ? "ألصق الرابط أولاً." : "Paste a link first.");
      return;
    }

    setLoading(true);
    setMessage(isAr ? "جاري جلب التفاصيل…" : "Fetching details…");
    try {
      const response = await fetch("/api/fetch-media-metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, kind: item.kind }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not fetch details");
      onApply(data);
      setMessage(isAr ? "تم جلب التفاصيل. راجعها ثم احفظ." : "Details fetched. Review them, then save.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isAr ? "تعذر جلب التفاصيل." : "Could not fetch details."));
    } finally {
      setLoading(false);
    }
  }

  const kindLabel = item.kind === "movie"
    ? (isAr ? "رابط الفيلم" : "Movie link")
    : item.kind === "music"
      ? (isAr ? "رابط الأغنية" : "Song link")
      : (isAr ? "رابط اللعبة" : "Game link");

  return (
    <div className="v6Nested">
      <p className="v6Group">{isAr ? "إضافة تلقائية من الرابط" : "Auto-import from link"}</p>
      <label>{kindLabel}
        <input
          dir="ltr"
          placeholder="https://…"
          value={item.external_url ?? ""}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </label>
      <button type="button" onClick={fetchDetails} disabled={loading || !item.external_url?.trim()}>
        {loading ? (isAr ? "جاري الجلب…" : "Fetching…") : (isAr ? "جلب التفاصيل تلقائياً" : "Auto Fetch Details")}
      </button>
      <p className="v6AdminMessage" style={{ margin: 0 }}>
        {message || (isAr
          ? "يعمل مع صفحات عامة مثل Netflix وIMDb وSpotify وYouTube وSteam وPlayStation وGoogle Play وغيرها. بعض المنصات لا تعرض تقييماً عاماً، وفي هذه الحالة يبقى التقييم فارغاً."
          : "Works with public pages such as Netflix, IMDb, Spotify, YouTube, Steam, PlayStation, Google Play and others. Some platforms do not expose a public rating, so rating may stay empty.")}
      </p>
      {item.source_rating_text && (
        <p style={{ margin: 0, fontSize: 12 }}>
          ★ {item.source_rating_label ? `${item.source_rating_label}: ` : ""}{item.source_rating_text}
        </p>
      )}
    </div>
  );
}
