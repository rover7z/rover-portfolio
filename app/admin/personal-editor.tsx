"use client";

import { ChangeEvent, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PersonalSiteClient, type PersonalEditTarget } from "../../components/personal-site-client";
import type { PortfolioItem, PortfolioKind } from "../../lib/content";
import { personalSectionKeys, type Lang, type LocalizedText, type PersonalSectionKey, type PersonalSiteConfig } from "../../lib/personal-site";
import { createClient } from "../../lib/supabase/client";
import { AutoMediaImporter } from "../../components/auto-media-importer";

type ContentKind = "photo" | "video" | "movie" | "music" | "game";
type Panel = PersonalEditTarget | { type: "item" } | { type: "content"; kind: ContentKind } | null;
type EditableItem = PortfolioItem & { _local?: boolean };

const labels = {
  ar: {
    editor: "محرر Rover المرئي", preview: "معاينة كزائر", edit: "الرجوع للتحرير", sections: "الأقسام", save: "حفظ الموقع", saving: "جاري الحفظ…", saved: "تم الحفظ", unsaved: "تغييرات غير محفوظة", signout: "خروج", close: "إغلاق",
    brand: "الشعار والقائمة", theme: "المظهر والألوان", hero: "الواجهة الرئيسية", about: "نبذة عني", contact: "التواصل", footer: "التذييل", section: "إعدادات القسم", item: "تعديل المحتوى", newItem: "إضافة محتوى",
    enabled: "إظهار القسم", nav: "إظهار بالقائمة", order: "الترتيب", navName: "اسم القائمة", title: "عنوان القسم", subtitle: "وصف القسم", english: "إنكليزي", arabic: "عربي",
    logoType: "نوع الشعار", letter: "حرف/رمز", image: "صورة", logo: "صورة الشعار", favicon: "أيقونة التبويب", upload: "رفع صورة", showName: "إظهار الاسم", showAlias: "إظهار Rover", showHeader: "إظهار القائمة العلوية", sticky: "تثبيت القائمة", langSwitch: "زر تغيير اللغة",
    name: "الاسم", alias: "اللقب", heading: "العنوان الكبير", home: "اسم الرئيسية", kicker: "الوصف الرئيسي", heroSub: "السطر الصغير", firstButton: "الزر الأول", secondButton: "الزر الثاني", firstTarget: "وجهة الزر الأول", secondTarget: "وجهة الزر الثاني", heroBg: "خلفية الواجهة",
    aboutText: "الوصف عني", aboutPhoto: "صورتي", expTitle: "عنوان الخبرة", expText: "الوظائف والخبرة", email: "البريد", instagram: "Instagram", youtube: "YouTube", github: "GitHub", links: "روابط إضافية", addLink: "إضافة رابط", linkName: "اسم الرابط", linkUrl: "الرابط",
    accent: "اللون الرئيسي", bg: "الخلفية", bg2: "الخلفية البديلة", panel: "لون البطاقات", text: "لون النص", muted: "النص الثانوي", line: "الحدود", radius: "استدارة الزوايا", footerText: "نص الحقوق", footerEnabled: "إظهار التذييل",
    type: "النوع", photo: "صورة", video: "فيديو", movie: "فيلم", music: "أغنية", game: "لعبة", itemTitle: "الاسم / العنوان", itemSubtitle: "العنوان الفرعي", artist: "الفنان", platform: "المنصة", description: "الوصف", category: "التصنيف", tags: "الوسوم", year: "السنة", duration: "المدة", rating: "تقييمي / 10", cover: "صورة الغلاف", mediaUrl: "رابط الفيديو/الصوت", external: "الرابط الخارجي", netflix: "رابط الفيلم / المنصة", spotify: "رابط Spotify", gameLink: "رابط اللعبة / المتجر", coverUpload: "رفع صورة الغلاف", mediaUpload: "رفع فيديو أو صوت", published: "منشور", featured: "مميز", sort: "ترتيب العنصر", saveItem: "حفظ المحتوى", deleteItem: "حذف", cancel: "إلغاء",
  },
  en: {
    editor: "Rover Visual Editor", preview: "Visitor preview", edit: "Back to editing", sections: "Sections", save: "Save website", saving: "Saving…", saved: "Saved", unsaved: "Unsaved changes", signout: "Sign out", close: "Close",
    brand: "Brand & navigation", theme: "Theme & colors", hero: "Hero", about: "About me", contact: "Contact", footer: "Footer", section: "Section settings", item: "Edit content", newItem: "Add content",
    enabled: "Show section", nav: "Show in navigation", order: "Order", navName: "Navigation name", title: "Section title", subtitle: "Section description", english: "English", arabic: "Arabic",
    logoType: "Logo type", letter: "Letter / symbol", image: "Image", logo: "Logo image", favicon: "Browser favicon", upload: "Upload image", showName: "Show name", showAlias: "Show Rover", showHeader: "Show header", sticky: "Sticky header", langSwitch: "Language switch",
    name: "Name", alias: "Alias", heading: "Big heading", home: "Home label", kicker: "Main description", heroSub: "Small line", firstButton: "Primary button", secondButton: "Secondary button", firstTarget: "Primary target", secondTarget: "Secondary target", heroBg: "Hero background",
    aboutText: "About description", aboutPhoto: "My photo", expTitle: "Experience title", expText: "Jobs & experience", email: "Email", instagram: "Instagram", youtube: "YouTube", github: "GitHub", links: "Extra links", addLink: "Add link", linkName: "Link name", linkUrl: "URL",
    accent: "Accent color", bg: "Background", bg2: "Alternate background", panel: "Card color", text: "Text color", muted: "Muted text", line: "Borders", radius: "Corner radius", footerText: "Copyright text", footerEnabled: "Show footer",
    type: "Type", photo: "Photo", video: "Video", movie: "Movie", music: "Song", game: "Game", itemTitle: "Name / title", itemSubtitle: "Subtitle", artist: "Artist", platform: "Platform", description: "Description", category: "Category", tags: "Tags", year: "Year", duration: "Duration", rating: "My rating / 10", cover: "Cover image", mediaUrl: "Video / audio URL", external: "External link", netflix: "Movie / Platform URL", spotify: "Spotify URL", gameLink: "Game / store URL", coverUpload: "Upload cover", mediaUpload: "Upload video or audio", published: "Published", featured: "Featured", sort: "Item order", saveItem: "Save content", deleteItem: "Delete", cancel: "Cancel",
  },
};

const blankItem = (kind: PortfolioKind): EditableItem => ({
  kind,
  title: "",
  title_ar: "",
  subtitle: "",
  subtitle_ar: "",
  description: "",
  description_ar: "",
  category: "",
  cover_url: "",
  video_url: "",
  external_url: "",
  year: "",
  duration: "",
  rating: null,
  source_rating_text: "",
  source_rating_label: "",
  tags: [],
  sort_order: 0,
  is_featured: false,
  is_published: true,
  _local: true,
});

export function PersonalEditor({ initialItems, initialSettings }: { initialItems: PortfolioItem[]; initialSettings: PersonalSiteConfig }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<EditableItem[]>(initialItems);
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [lang, setLang] = useState<Lang>("ar");
  const [preview, setPreview] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedItem, setSelectedItem] = useState<EditableItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const settingsRevisionRef = useRef(0);
  const t = labels[lang];

  function updateSettings(next: PersonalSiteConfig) {
    settingsRevisionRef.current += 1;
    setSettings(next);
    setDirty(true);
    setMessage("");
  }

  function patchLocalized(path: "hero.kicker" | "hero.subtitle" | "hero.homeNav" | "hero.primaryButton" | "hero.secondaryButton" | "about.text" | "about.eyebrow" | "about.experienceTitle" | "about.experienceText" | "footer.text" | "contact.eyebrow", language: Lang, value: string) {
    const next = structuredClone(settings);
    const [group, key] = path.split(".") as [keyof PersonalSiteConfig, string];
    (next[group] as any)[key][language] = value;
    updateSettings(next);
  }

  function patchSection(key: PersonalSectionKey, patch: Partial<PersonalSiteConfig["sections"][PersonalSectionKey]>) {
    const next = structuredClone(settings);
    next.sections[key] = { ...next.sections[key], ...patch };
    updateSettings(next);
  }

  function patchSectionLocalized(key: PersonalSectionKey, field: "nav" | "title" | "subtitle", language: Lang, value: string) {
    const next = structuredClone(settings);
    next.sections[key][field][language] = value;
    updateSettings(next);
  }

  function addCustomSection() {
    const next = structuredClone(settings);
    const allOrders = [
      ...personalSectionKeys.map((key) => next.sections[key].order),
      ...(next.customSections ?? []).map((section) => section.order),
    ];
    const order = Math.max(0, ...allOrders) + 1;
    const id = `custom-${Date.now().toString(36)}`;
    next.customSections = [...(next.customSections ?? []), {
      id,
      enabled: true,
      showInNav: true,
      order,
      nav: { en: "New", ar: "جديد" },
      title: { en: "New Section", ar: "قسم جديد" },
      subtitle: { en: "Add your section description.", ar: "أضف وصف هذا القسم." },
      body: { en: "", ar: "" },
      buttonLabel: { en: "", ar: "" },
      buttonUrl: "",
      style: {
        backgroundPreset: "inherit",
        backgroundColor: "",
        backgroundUrl: "",
        textColor: "",
        accentColor: "",
        panelColor: "",
        buttonColor: "",
      },
    }];
    updateSettings(next);
    setPanel({ type: "customSection", id });
    setPreview(false);
  }

  function patchCustomSection(id: string, patch: any) {
    const next = structuredClone(settings);
    next.customSections = (next.customSections ?? []).map((section) => section.id === id ? { ...section, ...patch } : section);
    updateSettings(next);
  }

  function patchCustomLocalized(id: string, field: "nav" | "title" | "subtitle" | "body" | "buttonLabel", language: Lang, value: string) {
    const next = structuredClone(settings);
    const section = (next.customSections ?? []).find((entry) => entry.id === id);
    if (!section) return;
    section[field][language] = value;
    updateSettings(next);
  }

  function deleteCustomSection(id: string) {
    if (!window.confirm(lang === "ar" ? "حذف هذا القسم؟" : "Delete this section?")) return;
    const next = structuredClone(settings);
    next.customSections = (next.customSections ?? []).filter((section) => section.id !== id);
    updateSettings(next);
    setPanel(null);
  }

  async function saveSettings() {
    if (busy) return;
    const snapshot = structuredClone(settings);
    const revision = settingsRevisionRef.current;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.from("site_settings").upsert({ key: "site_config_v6", value: snapshot }, { onConflict: "key" });
      if (error) throw error;
      setSavedSettings(snapshot);
      const hasNewChanges = settingsRevisionRef.current !== revision;
      setDirty(hasNewChanges);
      setMessage(hasNewChanges ? t.unsaved : t.saved);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (error as { message?: string })?.message || (lang === "ar" ? "تعذر الحفظ. حاول مرة أخرى." : "Could not save. Try again."));
    } finally {
      setBusy(false);
    }
  }

  function discardSettings() {
    if (busy) return;
    settingsRevisionRef.current += 1;
    setSettings(structuredClone(savedSettings));
    setDirty(false);
    setMessage("");
  }

  function startAdd(kind: PortfolioKind) {
    const item = blankItem(kind);
    setSelectedItem(item);
    setPanel({ type: "item" });
    setPreview(false);
  }

  function startEditItem(item: PortfolioItem) {
    setSelectedItem({ ...item });
    setPanel({ type: "item" });
    setPreview(false);
  }

  function patchItem<K extends keyof EditableItem>(key: K, value: EditableItem[K]) {
    setSelectedItem((current) => current ? { ...current, [key]: value } : current);
  }

  async function saveItem() {
    if (!selectedItem || !selectedItem.title.trim()) {
      setMessage(lang === "ar" ? "اكتب اسم/عنوان المحتوى أولاً." : "Add a title first.");
      return;
    }
    setBusy(true);
    setMessage("");
    const payload = {
      kind: selectedItem.kind,
      title: selectedItem.title.trim(),
      title_ar: selectedItem.title_ar?.trim() || null,
      subtitle: selectedItem.subtitle?.trim() || null,
      subtitle_ar: selectedItem.subtitle_ar?.trim() || null,
      description: selectedItem.description?.trim() || null,
      description_ar: selectedItem.description_ar?.trim() || null,
      category: selectedItem.category?.trim() || null,
      cover_url: selectedItem.cover_url?.trim() || null,
      video_url: selectedItem.video_url?.trim() || null,
      external_url: selectedItem.external_url?.trim() || null,
      year: selectedItem.year?.trim() || null,
      duration: selectedItem.duration?.trim() || null,
      rating: selectedItem.kind === "movie" && selectedItem.rating !== null && selectedItem.rating !== undefined ? Number(selectedItem.rating) : null,
      source_rating_text: selectedItem.source_rating_text?.trim() || null,
      source_rating_label: selectedItem.source_rating_label?.trim() || null,
      tags: selectedItem.tags ?? [],
      sort_order: Number(selectedItem.sort_order ?? 0),
      is_featured: Boolean(selectedItem.is_featured),
      is_published: Boolean(selectedItem.is_published),
    };
    if (selectedItem.id) {
      const { data, error } = await supabase.from("portfolio_items").update(payload).eq("id", selectedItem.id).select().single();
      setBusy(false);
      if (error) return setMessage(error.message);
      setItems((current) => current.map((x) => x.id === selectedItem.id ? data as EditableItem : x));
      setSelectedItem(data as EditableItem);
    } else {
      const { data, error } = await supabase.from("portfolio_items").insert(payload).select().single();
      setBusy(false);
      if (error) return setMessage(error.message);
      setItems((current) => [...current, data as EditableItem]);
      setSelectedItem(data as EditableItem);
    }
    setMessage(t.saved);
    router.refresh();
  }

  async function deleteItem() {
    if (!selectedItem?.id) { setSelectedItem(null); setPanel(null); return; }
    const returnKind = selectedItem.kind as ContentKind;
    if (!window.confirm(lang === "ar" ? `حذف “${selectedItem.title}”؟` : `Delete “${selectedItem.title}”?`)) return;
    setBusy(true);
    const { error } = await supabase.from("portfolio_items").delete().eq("id", selectedItem.id);
    setBusy(false);
    if (error) return setMessage(error.message);
    setItems((current) => current.filter((x) => x.id !== selectedItem.id));
    setSelectedItem(null);
    setPanel({ type: "content", kind: returnKind });
    router.refresh();
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(lang === "ar" ? "جاري الرفع…" : "Uploading…");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(false); return setMessage(lang === "ar" ? "انتهت الجلسة. سجّل دخول من جديد." : "Session expired. Sign in again."); }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-media").upload(path, file, { upsert: false, cacheControl: "3600" });
    if (error) { setBusy(false); return setMessage(error.message); }
    const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path);
    onUrl(data.publicUrl);
    setMessage(lang === "ar" ? "تم الرفع. لا تنسَ الحفظ." : "Uploaded. Remember to save.");
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const contentKinds: { kind: ContentKind; label: { ar: string; en: string }; icon: string }[] = [
    { kind: "photo", label: { ar: "الصور", en: "Photos" }, icon: "◉" },
    { kind: "video", label: { ar: "الفيديو", en: "Videos" }, icon: "▶" },
    { kind: "movie", label: { ar: "الأفلام", en: "Movies" }, icon: "▣" },
    { kind: "music", label: { ar: "الأغاني", en: "Music" }, icon: "♫" },
    { kind: "game", label: { ar: "الألعاب", en: "Games" }, icon: "✦" },
  ];
  const publishedCount = items.filter((item) => item.is_published).length;
  const draftCount = items.length - publishedCount;
  const openPanel = (next: Panel) => { setPanel(next); setPreview(false); setMessage(""); };
  const activeContentKind = panel?.type === "content" ? panel.kind : panel?.type === "item" ? selectedItem?.kind : undefined;
  const openSectionSettings = (kind: ContentKind) => {
    const key: Record<ContentKind, PersonalSectionKey> = { photo: "photos", video: "videos", movie: "movies", music: "music", game: "games" };
    openPanel({ type: "section", key: key[kind] });
  };

  return <div className={`v20Admin ${preview ? "isPreview" : ""}`} dir={lang === "ar" ? "rtl" : "ltr"}>
    <header className="v20Topbar">
      <a className="v20Brand" href="/admin" aria-label="Rover Admin">
        <span className="v20BrandMark">R</span>
        <span><strong>Rover</strong><small>{lang === "ar" ? "لوحة الإدارة" : "ADMIN STUDIO"}</small></span>
      </a>
      <div className="v20TopActions">
        {dirty && <span className="v20SaveState"><i />{t.unsaved}</span>}
        <button type="button" className="v20ActionButton" onClick={() => { setPreview((value) => !value); setPanel(null); }}><span>{preview ? "✎" : "↗"}</span>{preview ? t.edit : t.preview}</button>
        <a className="v20ActionButton v20QuietButton" href="/" target="_blank" rel="noreferrer">↗ <span>{lang === "ar" ? "الموقع" : "Website"}</span></a>
        <a className="v20ActionButton v20QuietButton" href="/admin/visitors">◷ <span>{lang === "ar" ? "الزوار" : "Visitors"}</span></a>
        <button type="button" className="v20ActionButton v20LanguageButton" onClick={() => setLang((value) => value === "ar" ? "en" : "ar")}>{lang === "ar" ? "EN" : "عربي"}</button>
        {dirty && <button type="button" className="v20ActionButton v20QuietButton" disabled={busy} onClick={discardSettings}>{lang === "ar" ? "تراجع" : "Discard"}</button>}
        <button type="button" className="v20SaveButton" disabled={busy || !dirty} onClick={saveSettings}>{busy ? t.saving : t.save}</button>
        <button type="button" className="v20Signout" onClick={signOut} aria-label={t.signout} title={t.signout}>⇥</button>
      </div>
    </header>

    {preview ? <main className="v20PreviewCanvas"><PersonalSiteClient items={items} settings={settings} forcedLang={lang} /></main> : <div className="v20Layout">
      <aside className="v20Sidebar">
        <p className="v20NavCaption">{lang === "ar" ? "إدارة الموقع" : "SITE MANAGEMENT"}</p>
        <button className={`v20NavItem ${panel === null ? "active" : ""}`} onClick={() => openPanel(null)}><b>⌂</b><span>{lang === "ar" ? "نظرة عامة" : "Overview"}</span></button>
        <button className={`v20NavItem ${panel?.type === "hero" ? "active" : ""}`} onClick={() => openPanel({ type: "hero" })}><b>✦</b><span>{lang === "ar" ? "الواجهة الرئيسية" : "Homepage"}</span></button>
        <p className="v20NavCaption">{lang === "ar" ? "المحتوى" : "CONTENT"}</p>
        {contentKinds.map(({ kind, label, icon }) => {
          const count = items.filter((item) => item.kind === kind).length;
          const selected = panel?.type === "content" && panel.kind === kind;
          return <button key={kind} className={`v20NavItem ${selected ? "active" : ""}`} onClick={() => openPanel({ type: "content", kind })}><b>{icon}</b><span>{label[lang]}</span><small>{count}</small></button>;
        })}
        <button className={`v20NavItem ${panel?.type === "sections" || panel?.type === "section" || panel?.type === "customSection" ? "active" : ""}`} onClick={() => openPanel({ type: "sections" })}><b>▤</b><span>{lang === "ar" ? "ترتيب الأقسام" : "Sections & order"}</span></button>
        {(settings.customSections ?? []).map((section) => <button key={section.id} className={`v20NavItem v20SubNav ${panel?.type === "customSection" && panel.id === section.id ? "active" : ""}`} onClick={() => openPanel({ type: "customSection", id: section.id })}><b>＋</b><span>{section.nav[lang] || section.title[lang]}</span></button>)}
        <p className="v20NavCaption">{lang === "ar" ? "إعدادات الموقع" : "SITE SETTINGS"}</p>
        <button className={`v20NavItem ${panel?.type === "about" ? "active" : ""}`} onClick={() => openPanel({ type: "about" })}><b>CV</b><span>{lang === "ar" ? "نبذة وسيرة ذاتية" : "About & CV"}</span></button>
        <button className={`v20NavItem ${panel?.type === "contact" ? "active" : ""}`} onClick={() => openPanel({ type: "contact" })}><b>✉</b><span>{lang === "ar" ? "التواصل" : "Contact"}</span></button>
        <button className={`v20NavItem ${panel?.type === "theme" ? "active" : ""}`} onClick={() => openPanel({ type: "theme" })}><b>◐</b><span>{lang === "ar" ? "المظهر والألوان" : "Appearance"}</span></button>
        <button className={`v20NavItem ${panel?.type === "brand" ? "active" : ""}`} onClick={() => openPanel({ type: "brand" })}><b>R</b><span>{lang === "ar" ? "الشعار والقائمة" : "Brand & navigation"}</span></button>
        <button className={`v20NavItem ${panel?.type === "footer" ? "active" : ""}`} onClick={() => openPanel({ type: "footer" })}><b>⌄</b><span>{lang === "ar" ? "التذييل والحقوق" : "Footer"}</span></button>
      </aside>

      <main className="v20Main">
        {panel === null ? <AdminOverview
          lang={lang}
          items={items}
          publishedCount={publishedCount}
          draftCount={draftCount}
          dirty={dirty}
          onOpen={openPanel}
          contentKinds={contentKinds}
          sectionCount={personalSectionKeys.length + (settings.customSections ?? []).length}
        /> : panel.type === "content" ? <ContentManager
          kind={panel.kind}
          items={items.filter((item) => item.kind === panel.kind)}
          lang={lang}
          onAdd={() => startAdd(panel.kind)}
          onEdit={startEditItem}
          onEditSection={() => openSectionSettings(panel.kind)}
        /> : panel.type === "item" ? <AdminPanelPage title={selectedItem?._local ? t.newItem : selectedItem?.title || t.item} description={lang === "ar" ? "عدّل النصوص والوسائط والروابط وحالة النشر من مكان واحد." : "Edit copy, media, links, and publishing details in one place."} onBack={() => openPanel({ type: "content", kind: (selectedItem?.kind as ContentKind) || "photo" })} lang={lang}>
          {selectedItem && <ItemPanel item={selectedItem} patchItem={patchItem} saveItem={saveItem} deleteItem={deleteItem} upload={upload} busy={busy} lang={lang} t={t} />}
          {message && <p className="v6AdminMessage">{message}</p>}
        </AdminPanelPage> : <AdminPanelPage
          title={panelTitle(panel, t, Boolean(selectedItem?._local))}
          description={panelDescription(panel, lang, settings, items)}
          onBack={() => openPanel(null)}
          lang={lang}
        >
          {panel.type === "sections" && <SectionsPanel settings={settings} patchSection={patchSection} onEdit={(key: PersonalSectionKey) => openPanel({ type: "section", key })} onEditCustom={(id: string) => openPanel({ type: "customSection", id })} onAddCustom={addCustomSection} t={t} />}
          {panel.type === "section" && <SectionPanel sectionKey={panel.key} settings={settings} patchSection={patchSection} patchLocalized={patchSectionLocalized} upload={upload} t={t} />}
          {panel.type === "customSection" && <CustomSectionPanel sectionId={panel.id} settings={settings} patchSection={patchCustomSection} patchLocalized={patchCustomLocalized} deleteSection={deleteCustomSection} upload={upload} t={t} />}
          {panel.type === "brand" && <BrandPanel settings={settings} updateSettings={updateSettings} upload={upload} t={t} />}
          {panel.type === "hero" && <HeroPanel settings={settings} updateSettings={updateSettings} patchLocalized={patchLocalized} upload={upload} t={t} />}
          {panel.type === "theme" && <ThemePanel settings={settings} updateSettings={updateSettings} upload={upload} t={t} />}
          {panel.type === "about" && <AboutPanel settings={settings} updateSettings={updateSettings} patchLocalized={patchLocalized} upload={upload} t={t} />}
          {panel.type === "contact" && <ContactPanel settings={settings} updateSettings={updateSettings} patchLocalized={patchLocalized} upload={upload} t={t} />}
          {panel.type === "footer" && <FooterPanel settings={settings} updateSettings={updateSettings} patchLocalized={patchLocalized} t={t} />}
          {message && <p className="v6AdminMessage">{message}</p>}
        </AdminPanelPage>}
      </main>
    </div>}
  </div>;
}

function AdminOverview({ lang, items, publishedCount, draftCount, dirty, onOpen, contentKinds, sectionCount }: any) {
  const ar = lang === "ar";
  const settingsTiles: Array<[Panel, string, string, string]> = [
    [{ type: "hero" }, ar ? "الواجهة الرئيسية" : "Homepage", ar ? "الاسم والعناوين والأزرار والخلفيات" : "Name, copy, buttons, and hero images", "⌂"],
    [{ type: "sections" }, ar ? "الأقسام والترتيب" : "Sections & order", ar ? "إظهار الأقسام وترتيبها وتعديل بياناتها" : "Visibility, order, and section details", "▤"],
    [{ type: "about" }, ar ? "نبذة وسيرة ذاتية" : "About & CV", ar ? "الصورة والخبرة والتعليم والمهارات" : "Photo, experience, education, and skills", "CV"],
    [{ type: "contact" }, ar ? "التواصل" : "Contact", ar ? "البريد والحسابات والروابط" : "Email, accounts, and links", "✉"],
    [{ type: "theme" }, ar ? "المظهر والألوان" : "Appearance & colors", ar ? "خلفيات النهار والليل والألوان" : "Day and night backgrounds and colors", "◐"],
    [{ type: "brand" }, ar ? "الشعار والقائمة" : "Brand & navigation", ar ? "الشعار والاسم والقائمة العلوية" : "Logo, name, and top navigation", "R"],
    [{ type: "footer" }, ar ? "التذييل والحقوق" : "Footer", ar ? "إظهار التذييل ونص الحقوق" : "Footer visibility and copyright text", "⌄"],
  ];
  return <div className="v20Overview">
    <div className="v20Welcome">
      <div><p className="v20Eyebrow">ROVER / ADMIN STUDIO</p><h1>{ar ? "إدارة موقعك" : "Manage your website"}</h1><p>{ar ? "عدّل المحتوى والمظهر وكل تفاصيل الموقع من مساحة واحدة واضحة." : "Update content, appearance, and website details from one clear workspace."}</p></div>
      <span className={"v20Health" + (dirty ? " pending" : "")}><i />{dirty ? (ar ? "تغييرات غير محفوظة" : "Unsaved changes") : (ar ? "الموقع متصل" : "Website connected")}</span>
    </div>
    <div className="v20Stats">
      <article><span>{ar ? "كل المحتوى" : "All content"}</span><strong>{items.length}</strong><small>{ar ? "صور، فيديو، أفلام، أغاني وألعاب" : "Photos, videos, movies, music, and games"}</small></article>
      <article><span>{ar ? "منشور" : "Published"}</span><strong>{publishedCount}</strong><small>{ar ? "ظاهر للزوار" : "Visible to visitors"}</small></article>
      <article><span>{ar ? "مسودات" : "Drafts"}</span><strong>{draftCount}</strong><small>{ar ? "محفوظة وغير منشورة" : "Saved but hidden"}</small></article>
      <article><span>{ar ? "أقسام الموقع" : "Website sections"}</span><strong>{sectionCount}</strong><small>{ar ? "إعدادات مستقلة لكل قسم" : "Independent settings for each section"}</small></article>
    </div>
    <section className="v20QuickSection">
      <div className="v20SectionHeading"><div><p className="v20Eyebrow">{ar ? "تعديل مباشر" : "QUICK ACCESS"}</p><h2>{ar ? "المحتوى" : "Your content"}</h2></div></div>
      <div className="v20ContentTiles">{contentKinds.map(({ kind, label, icon }: any) => {
        const count = items.filter((item: PortfolioItem) => item.kind === kind).length;
        return <button key={kind} className="v20ContentTile" onClick={() => onOpen({ type: "content", kind })}><span className="v20TileIcon">{icon}</span><strong>{label[lang]}</strong><small>{count} {ar ? "عنصر" : count === 1 ? "item" : "items"}</small><b>↗</b></button>;
      })}</div>
    </section>
    <section className="v20QuickSection">
      <div className="v20SectionHeading"><div><p className="v20Eyebrow">{ar ? "كل التفاصيل بيدك" : "EVERY DETAIL, IN ONE PLACE"}</p><h2>{ar ? "إعدادات الموقع" : "Site settings"}</h2></div></div>
      <div className="v20SettingsTiles">{settingsTiles.map(([target, title, note, icon]) => <button key={title} className="v20SettingTile" onClick={() => onOpen(target)}><span>{icon}</span><div><strong>{title}</strong><small>{note}</small></div><b>↗</b></button>)}</div>
    </section>
  </div>;
}

function ContentManager({ kind, items, lang, onAdd, onEdit, onEditSection }: { kind: ContentKind; items: PortfolioItem[]; lang: Lang; onAdd: () => void; onEdit: (item: PortfolioItem) => void; onEditSection: () => void }) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | "published" | "draft">("all");
  const ar = lang === "ar";
  const labelsByKind: Record<ContentKind, { ar: string; en: string; icon: string }> = {
    photo: { ar: "الصور", en: "Photos", icon: "◉" }, video: { ar: "الفيديو", en: "Videos", icon: "▶" },
    movie: { ar: "الأفلام", en: "Movies", icon: "▣" }, music: { ar: "الأغاني", en: "Music", icon: "♫" }, game: { ar: "الألعاب", en: "Games", icon: "✦" },
  };
  const info = labelsByKind[kind];
  const visible = items.filter((item) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [item.title, item.title_ar, item.subtitle, item.subtitle_ar, item.category].some((value) => value?.toLowerCase().includes(needle));
    const matchesVisibility = visibility === "all" || (visibility === "published" ? item.is_published : !item.is_published);
    return matchesQuery && matchesVisibility;
  }).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  return <div className="v20ContentManager">
    <AdminPanelPage title={info[lang]} description={ar ? "أدر العناصر الظاهرة في هذا القسم. افتح أي بطاقة لتعديل بياناتها أو أضف محتوى جديداً." : "Manage the items shown in this section. Edit any item or add new content."} lang={lang} actions={<><button className="v20SecondaryButton" onClick={onEditSection}>{ar ? "إعدادات القسم" : "Section settings"}</button><button className="v20PrimaryButton" onClick={onAdd}>＋ {ar ? "إضافة محتوى" : "Add content"}</button></>}>
      <div className="v20ListToolbar">
        <label className="v20Search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث بالاسم أو التصنيف" : "Search by name or category"} /></label>
        <div className="v20FilterTabs">{(["all", "published", "draft"] as const).map((value) => <button key={value} className={visibility === value ? "active" : ""} onClick={() => setVisibility(value)}>{value === "all" ? (ar ? "الكل" : "All") : value === "published" ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}</button>)}</div>
        <span className="v20ResultCount">{visible.length} {ar ? "عنصر" : visible.length === 1 ? "item" : "items"}</span>
      </div>
      {visible.length ? <div className="v20ItemGrid">{visible.map((item) => <button key={item.id || item.kind + "-" + item.title} className="v20ItemCard" onClick={() => onEdit(item)}>
        <span className="v20ItemThumb">{item.cover_url ? <img src={item.cover_url} alt="" loading="lazy" /> : <span>{info.icon}</span>}<i className={item.is_published ? "published" : "draft"}>{item.is_published ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}</i></span>
        <span className="v20ItemInfo"><strong>{ar && item.title_ar ? item.title_ar : item.title || (ar ? "بدون عنوان" : "Untitled")}</strong><small>{[item.category, item.year, item.duration].filter(Boolean).join(" · ") || (ar ? "لا توجد تفاصيل إضافية" : "No additional details")}</small><b>{item.is_featured ? (ar ? "★ مميز" : "★ Featured") : (ar ? "تعديل التفاصيل" : "Edit details")} <span>↗</span></b></span>
      </button>)}</div> : <div className="v20EmptyState"><span>{info.icon}</span><strong>{ar ? "ماكو محتوى هنا بعد" : "No content here yet"}</strong><p>{ar ? "أضف أول عنصر لهذا القسم، وبعدها تقدر تعدّل كل تفاصيله من هنا." : "Add the first item to this section, then manage every detail here."}</p><button className="v20PrimaryButton" onClick={onAdd}>＋ {ar ? "إضافة محتوى" : "Add content"}</button></div>}
    </AdminPanelPage>
  </div>;
}

function AdminPanelPage({ title, description, onBack, lang, actions, children }: { title: string; description: string; onBack?: () => void; lang: Lang; actions?: ReactNode; children: ReactNode }) {
  return <section className="v20PanelPage">
    <div className="v20PageHeading"><div>{onBack && <button className="v20BackButton" onClick={onBack}>← {lang === "ar" ? "رجوع" : "Back"}</button>}<p className="v20Eyebrow">{lang === "ar" ? "إدارة محتوى الموقع" : "WEBSITE MANAGEMENT"}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="v20PageActions">{actions}</div>}</div>
    <div className="v20PanelCard">{children}</div>
  </section>;
}

function panelDescription(panel: Panel, lang: Lang, settings: PersonalSiteConfig, items: PortfolioItem[]) {
  const ar = lang === "ar";
  if (!panel) return "";
  if (panel.type === "section") return ar ? "تحكم بعناوين القسم وظهوره وخلفيته وتفاصيله." : "Control section titles, visibility, backgrounds, and details.";
  if (panel.type === "customSection") return ar ? "حرّر المحتوى والمظهر والروابط لهذا القسم المضاف." : "Edit the content, appearance, and links for this custom section.";
  if (panel.type === "sections") return ar ? "غيّر ترتيب الأقسام، أظهرها أو أخفها، وأضف أقساماً جديدة." : "Reorder, show or hide sections, and create new sections.";
  if (panel.type === "hero") return ar ? "عدّل الاسم والعناوين والأزرار والخلفيات التي تظهر في أول الموقع." : "Edit the name, copy, buttons, and backgrounds on the homepage.";
  if (panel.type === "brand") return ar ? "تحكم بالشعار واسم الموقع والقائمة العلوية." : "Manage the site logo, name, and top navigation.";
  if (panel.type === "theme") return ar ? "عدّل الألوان والخلفيات العامة للوضعين النهاري والليلي." : "Set the global colors and day or night backgrounds.";
  if (panel.type === "about") return ar ? "عدّل النبذة والخبرة والتعليم واللغات والمهارات وملف السيرة." : "Edit your bio, experience, education, languages, skills, and CV file.";
  if (panel.type === "contact") return ar ? "حدّث وسائل التواصل وروابطك ومظهر القسم." : "Update contact methods, links, and section appearance.";
  if (panel.type === "footer") return ar ? "تحكم بظهور التذييل ونص الحقوق باللغتين." : "Control footer visibility and copyright text in both languages.";
  return ar ? "أدر إعدادات وأعمال أقسام الموقع." : "Manage section settings and site content.";
}

function panelTitle(panel: Panel, t: any, isNew: boolean) {
  if (!panel) return "";
  if (panel.type === "item") return isNew ? t.newItem : t.item;
  if (panel.type === "customSection") return "Custom section / قسم مخصص";
  return t[panel.type] ?? t.section;
}

function Pair({ value, onChange, t, textarea = false }: { value: LocalizedText; onChange: (lang: Lang, value: string) => void; t: any; textarea?: boolean }) {
  const C: any = textarea ? "textarea" : "input";
  return <div className="v6Pair"><label>{t.english}<C dir="ltr" rows={textarea ? 4 : undefined} value={value.en} onChange={(e: any) => onChange("en", e.target.value)} /></label><label>{t.arabic}<C dir="rtl" rows={textarea ? 4 : undefined} value={value.ar} onChange={(e: any) => onChange("ar", e.target.value)} /></label></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="v6Toggle"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>;
}

function Upload({ label, accept, onChange }: { label: string; accept: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="v6Upload">{label}<input type="file" accept={accept} onChange={onChange} /></label>;
}

const visualBackgroundPresets = [
  ["none", "بدون مؤثر / None"],
  ["stars", "نجوم / Stars"],
  ["galaxy", "مجرة / Galaxy"],
  ["aurora", "شفق متدرج / Aurora"],
  ["neon", "نيون لامع / Neon"],
  ["sunset", "غروب زاهي / Sunset"],
  ["ocean", "أزرق محيطي / Ocean"],
  ["emerald", "زمردي / Emerald"],
  ["goldGlow", "ذهبي لامع / Gold Glow"],
  ["prism", "ألوان Prism / Prism"],
];

function VisualPresetPicker({ value, onChange, allowInherit = false }: { value: string; onChange: (value: string) => void; allowInherit?: boolean }) {
  const presets = allowInherit ? [["inherit", "نفس المظهر العام / Inherit"], ...visualBackgroundPresets] : visualBackgroundPresets;
  return <div className="v6PresetGrid">
    {presets.map(([key, label]) => <button key={key} type="button" className={value === key ? "active" : ""} data-preset={key} onClick={() => onChange(key)}><i />{label}</button>)}
  </div>;
}

function VisualColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#111111";
  return <label>{label}<div className="v6Color"><input type="color" value={safe} onChange={(event) => onChange(event.target.value)} /><input dir="ltr" value={value || ""} placeholder="اتركه فارغ للمظهر العام" onChange={(event) => onChange(event.target.value)} /></div></label>;
}

function SectionsPanel({ settings, patchSection, onEdit, onEditCustom, onAddCustom, t }: any) {
  const custom = [...(settings.customSections ?? [])].sort((a: any, b: any) => a.order - b.order);
  return <div className="v6Form">
    <button className="v17AddSectionButton" type="button" onClick={onAddCustom}>＋ إضافة قسم جديد / Add new section</button>
    {personalSectionKeys.filter((key) => key !== "about").sort((a, b) => settings.sections[a].order - settings.sections[b].order).map((key) => (
      <div className="v6ManagerRow" key={key}>
        <div><strong>{settings.sections[key].title.ar}</strong><small>{settings.sections[key].title.en}</small></div>
        <Toggle label={t.enabled} checked={settings.sections[key].enabled} onChange={(v) => patchSection(key, { enabled: v })} />
        <button onClick={() => onEdit(key)}>✎</button>
      </div>
    ))}
    {custom.length > 0 && <p className="v6Group">الأقسام المضافة / Custom sections</p>}
    {custom.map((section: any) => (
      <div className="v6ManagerRow v17CustomManagerRow" key={section.id}>
        <div><strong>{section.title.ar || section.nav.ar}</strong><small>{section.title.en || section.nav.en}</small></div>
        <span className="v17SectionState">{section.enabled ? "ON" : "OFF"}</span>
        <button onClick={() => onEditCustom(section.id)}>✎</button>
      </div>
    ))}
  </div>;
}

function CustomSectionPanel({ sectionId, settings, patchSection, patchLocalized, deleteSection, upload, t }: any) {
  const section = (settings.customSections ?? []).find((entry: any) => entry.id === sectionId);
  if (!section) return <div className="v6Form"><p>Section not found.</p></div>;
  const style = section.style ?? {
    backgroundPreset: "inherit", backgroundColor: "", backgroundUrl: "", textColor: "",
    accentColor: "", panelColor: "", buttonColor: "",
  };
  const patchStyle = (key: string, value: any) => patchSection(sectionId, { style: { ...style, [key]: value } });

  return <div className="v6Form">
    <Toggle label={t.enabled} checked={section.enabled} onChange={(v) => patchSection(sectionId, { enabled: v })} />
    <Toggle label={t.nav} checked={section.showInNav} onChange={(v) => patchSection(sectionId, { showInNav: v })} />
    <label>{t.order}<input type="number" value={section.order} onChange={(event) => patchSection(sectionId, { order: Number(event.target.value) })} /></label>

    <p className="v6Group">{t.navName}</p>
    <Pair value={section.nav} onChange={(l, v) => patchLocalized(sectionId, "nav", l, v)} t={t} />
    <p className="v6Group">{t.title}</p>
    <Pair value={section.title} onChange={(l, v) => patchLocalized(sectionId, "title", l, v)} t={t} />
    <p className="v6Group">{t.subtitle}</p>
    <Pair value={section.subtitle} onChange={(l, v) => patchLocalized(sectionId, "subtitle", l, v)} t={t} textarea />

    <p className="v6Group">محتوى القسم / Section content</p>
    <Pair value={section.body} onChange={(l, v) => patchLocalized(sectionId, "body", l, v)} t={t} textarea />
    <p className="v6Group">زر اختياري / Optional button</p>
    <Pair value={section.buttonLabel} onChange={(l, v) => patchLocalized(sectionId, "buttonLabel", l, v)} t={t} />
    <label>الرابط / URL<input dir="ltr" value={section.buttonUrl || ""} onChange={(event) => patchSection(sectionId, { buttonUrl: event.target.value })} /></label>

    <p className="v6Group">مظهر القسم / Section appearance</p>
    <VisualPresetPicker value={style.backgroundPreset || "inherit"} allowInherit onChange={(value) => patchStyle("backgroundPreset", value)} />
    <VisualColor label="لون الخلفية / Background color" value={style.backgroundColor || ""} onChange={(value) => patchStyle("backgroundColor", value)} />
    <VisualColor label="لون النص / Text color" value={style.textColor || ""} onChange={(value) => patchStyle("textColor", value)} />
    <VisualColor label="اللون المميز / Accent color" value={style.accentColor || ""} onChange={(value) => patchStyle("accentColor", value)} />
    <label>صورة الخلفية / Background image<input dir="ltr" value={style.backgroundUrl || ""} onChange={(event) => patchStyle("backgroundUrl", event.target.value)} /></label>
    <Upload label="رفع خلفية / Upload background" accept="image/*" onChange={(event) => upload(event, (url: string) => patchStyle("backgroundUrl", url))} />
    <label>الخلفية الليلية / Night background<input dir="ltr" value={style.nightBackgroundUrl || ""} onChange={(event) => patchStyle("nightBackgroundUrl", event.target.value)} /></label>
    <Upload label="رفع خلفية ليلية / Upload night background" accept="image/*" onChange={(event) => upload(event, (url: string) => patchStyle("nightBackgroundUrl", url))} />

    <button className="v17DeleteSectionButton" type="button" onClick={() => deleteSection(sectionId)}>حذف القسم / Delete section</button>
  </div>;
}

function SectionPanel({ sectionKey, settings, patchSection, patchLocalized, upload, t }: any) {
  const s = settings.sections[sectionKey];
  const style = s.style ?? {
    backgroundPreset: "inherit",
    backgroundColor: "",
    backgroundUrl: "",
    nightBackgroundUrl: "",
    textColor: "",
    accentColor: "",
    panelColor: "",
    buttonColor: "",
  };
  const patchStyle = (key: string, value: any) => patchSection(sectionKey, { style: { ...style, [key]: value } });

  return <div className="v6Form">
    <Toggle label={t.enabled} checked={s.enabled} onChange={(v) => patchSection(sectionKey, { enabled: v })} />
    <Toggle label={t.nav} checked={s.showInNav} onChange={(v) => patchSection(sectionKey, { showInNav: v })} />
    <label>{t.order}<input type="number" value={s.order} onChange={(event) => patchSection(sectionKey, { order: Number(event.target.value) })} /></label>

    <p className="v6Group">{t.navName}</p>
    <Pair value={s.nav} onChange={(l, v) => patchLocalized(sectionKey, "nav", l, v)} t={t} />
    <p className="v6Group">{t.title}</p>
    <Pair value={s.title} onChange={(l, v) => patchLocalized(sectionKey, "title", l, v)} t={t} />
    <p className="v6Group">{t.subtitle}</p>
    <Pair value={s.subtitle} onChange={(l, v) => patchLocalized(sectionKey, "subtitle", l, v)} t={t} textarea />

    <p className="v6Group">مظهر هذا القسم / Section appearance</p>
    <label>خلفية جاهزة / Background preset</label>
    <VisualPresetPicker value={style.backgroundPreset || "inherit"} allowInherit onChange={(value) => patchStyle("backgroundPreset", value)} />
    <VisualColor label="لون الخلفية / Background color" value={style.backgroundColor || ""} onChange={(value) => patchStyle("backgroundColor", value)} />
    <VisualColor label="لون النص / Text color" value={style.textColor || ""} onChange={(value) => patchStyle("textColor", value)} />
    <VisualColor label="اللون المميز / Accent color" value={style.accentColor || ""} onChange={(value) => patchStyle("accentColor", value)} />
    <VisualColor label="لون البطاقات / Card color" value={style.panelColor || ""} onChange={(value) => patchStyle("panelColor", value)} />
    <VisualColor label="لون الأزرار / Button color" value={style.buttonColor || ""} onChange={(value) => patchStyle("buttonColor", value)} />
    <label>صورة خلفية خاصة / Custom background image<input dir="ltr" value={style.backgroundUrl || ""} onChange={(event) => patchStyle("backgroundUrl", event.target.value)} /></label>
    <Upload label="رفع خلفية لهذا القسم" accept="image/*" onChange={(event) => upload(event, (url: string) => patchStyle("backgroundUrl", url))} />
    <label>صورة الخلفية الليلية / Night background image<input dir="ltr" value={style.nightBackgroundUrl || ""} onChange={(event) => patchStyle("nightBackgroundUrl", event.target.value)} /></label>
    <Upload label="رفع خلفية ليلية لهذا القسم" accept="image/*" onChange={(event) => upload(event, (url: string) => patchStyle("nightBackgroundUrl", url))} />
    <button type="button" onClick={() => patchSection(sectionKey, { style: { backgroundPreset: "inherit", backgroundColor: "", backgroundUrl: "", nightBackgroundUrl: "", textColor: "", accentColor: "", panelColor: "", buttonColor: "" } })}>إعادة مظهر القسم للوضع العام / Reset</button>
  </div>;
}

function BrandPanel({ settings, updateSettings, upload, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.brand[key] = value; updateSettings(n); };
  const patchHeader = (key: string, value: any) => { const n = structuredClone(settings); n.header[key] = value; updateSettings(n); };
  return <div className="v6Form"><label>{t.logoType}<select value={settings.brand.logoType} onChange={(e) => patch("logoType", e.target.value)}><option value="letter">{t.letter}</option><option value="image">{t.image}</option></select></label>{settings.brand.logoType === "letter" ? <label>{t.letter}<input value={settings.brand.letter} onChange={(e) => patch("letter", e.target.value)} /></label> : <><label>{t.logo}<input dir="ltr" value={settings.brand.logoUrl} onChange={(e) => patch("logoUrl", e.target.value)} /></label><Upload label={t.upload} accept="image/*" onChange={(e) => upload(e, (url: string) => patch("logoUrl", url))} /></>}<label>{t.favicon}<input dir="ltr" value={settings.brand.faviconUrl} onChange={(e) => patch("faviconUrl", e.target.value)} /></label><Upload label={t.favicon} accept="image/*" onChange={(e) => upload(e, (url: string) => patch("faviconUrl", url))} /><Toggle label={t.showName} checked={settings.brand.showName} onChange={(v) => patch("showName", v)} /><Toggle label={t.showAlias} checked={settings.brand.showAlias} onChange={(v) => patch("showAlias", v)} /><p className="v6Group">Navigation</p><Toggle label={t.showHeader} checked={settings.header.enabled} onChange={(v) => patchHeader("enabled", v)} /><Toggle label={t.sticky} checked={settings.header.sticky} onChange={(v) => patchHeader("sticky", v)} /><Toggle label={t.langSwitch} checked={settings.header.showLanguageSwitch} onChange={(v) => patchHeader("showLanguageSwitch", v)} /></div>;
}

function HeroPanel({ settings, updateSettings, patchLocalized, upload, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.hero[key] = value; updateSettings(n); };
  return <div className="v6Form">
    <Toggle label="إظهار الواجهة الرئيسية / Show homepage hero" checked={settings.hero.enabled} onChange={(value) => patch("enabled", value)} />
    <label>{t.name}<input value={settings.hero.name} onChange={(event) => patch("name", event.target.value)} /></label>
    <label>{t.alias}<input value={settings.hero.alias} onChange={(event) => patch("alias", event.target.value)} /></label>
    <label>{t.heading}<input value={settings.hero.heading} onChange={(event) => patch("heading", event.target.value)} /></label>
    <p className="v6Group">{t.home}</p><Pair value={settings.hero.homeNav} onChange={(l, v) => patchLocalized("hero.homeNav", l, v)} t={t} />
    <p className="v6Group">{t.kicker}</p><Pair value={settings.hero.kicker} onChange={(l, v) => patchLocalized("hero.kicker", l, v)} t={t} textarea />
    <p className="v6Group">{t.heroSub}</p><Pair value={settings.hero.subtitle} onChange={(l, v) => patchLocalized("hero.subtitle", l, v)} t={t} />
    <label>{t.heroBg}<input dir="ltr" value={settings.hero.backgroundUrl} onChange={(event) => patch("backgroundUrl", event.target.value)} /></label>
    <Upload label={t.heroBg} accept="image/*" onChange={(event) => upload(event, (url: string) => patch("backgroundUrl", url))} />
    <p className="v6Group">الخلفية الليلية / Night hero background</p>
    <label><input dir="ltr" value={settings.hero.nightBackgroundUrl || ""} onChange={(event) => patch("nightBackgroundUrl", event.target.value)} /></label>
    <Upload label="رفع خلفية ليلية للواجهة / Upload night hero" accept="image/*" onChange={(event) => upload(event, (url: string) => patch("nightBackgroundUrl", url))} />
  </div>;
}

function ThemePanel({ settings, updateSettings, upload, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.theme[key] = value; updateSettings(n); };
  const colors = [["accentColor", t.accent], ["backgroundColor", t.bg], ["alternateBackgroundColor", t.bg2], ["panelColor", t.panel], ["textColor", t.text], ["mutedColor", t.muted], ["lineColor", t.line]];
  return <div className="v6Form">
    <p className="v6Group">خلفية الموقع / Site background</p>
    <VisualPresetPicker value={settings.theme.backgroundPreset || "none"} onChange={(value) => patch("backgroundPreset", value)} />
    <label>صورة خلفية عامة / Custom site background<input dir="ltr" value={settings.theme.backgroundUrl || ""} onChange={(event) => patch("backgroundUrl", event.target.value)} /></label>
    <Upload label="رفع خلفية عامة" accept="image/*" onChange={(event) => upload(event, (url: string) => patch("backgroundUrl", url))} />
    <label>خلفية عامة ليلية / Night site background<input dir="ltr" value={settings.theme.nightBackgroundUrl || ""} onChange={(event) => patch("nightBackgroundUrl", event.target.value)} /></label>
    <Upload label="رفع خلفية عامة ليلية" accept="image/*" onChange={(event) => upload(event, (url: string) => patch("nightBackgroundUrl", url))} />
    <p className="v6Group">الألوان العامة / Global colors</p>
    {colors.map(([key, label]) => <label key={key}>{label}<div className="v6Color"><input type="color" value={settings.theme[key]} onChange={(event) => patch(key, event.target.value)} /><input value={settings.theme[key]} onChange={(event) => patch(key, event.target.value)} /></div></label>)}
    <label>{t.radius}<input type="number" min="0" max="40" value={settings.theme.radius} onChange={(event) => patch("radius", Number(event.target.value))} /></label>
  </div>;
}

function AboutPanel({ settings, updateSettings, patchLocalized, upload, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.about[key] = value; updateSettings(n); };
  const patchExtraLocalized = (key: string, language: Lang, value: string) => {
    const n = structuredClone(settings);
    const current = n.about[key] ?? { en: "", ar: "" };
    n.about[key] = { ...current, [language]: value };
    updateSettings(n);
  };
  const education = settings.about.resumeEducation ?? { en: "Karbala Vocational Secondary School for Tourism & Hospitality — Tourism and Hotel Studies.", ar: "إعدادية كربلاء للسياحة والفندقة المهنية — اختصاص السياحة والفندقة." };
  const languages = settings.about.resumeLanguages ?? { en: "Arabic • English • Persian", ar: "العربية • الإنكليزية • الفارسية" };
  const skills = settings.about.resumeSkills ?? { en: "Microsoft Excel\nMicrosoft Word\nComputer skills\nPromotion & sales\nBusiness management\nWorking under pressure", ar: "Microsoft Excel\nMicrosoft Word\nمهارات الحاسوب\nالترويج والمبيعات\nإدارة الأعمال\nالعمل تحت الضغط" };

  return <div className="v6Form">
    <p className="v6Group">اسم/توقيع قسم النبذة / About label</p>
    <Pair value={settings.about.eyebrow} onChange={(l, v) => patchLocalized("about.eyebrow", l, v)} t={t} />
    <p className="v6Group">{t.aboutPhoto}</p>
    <label><input dir="ltr" value={settings.about.imageUrl} onChange={(event) => patch("imageUrl", event.target.value)} /></label>
    <Upload label={t.aboutPhoto} accept="image/*" onChange={(event) => upload(event, (url: string) => patch("imageUrl", url))} />
    <p className="v6Group">{t.aboutText}</p><Pair value={settings.about.text} onChange={(l, v) => patchLocalized("about.text", l, v)} t={t} textarea />
    <p className="v6Group">{t.expTitle}</p><Pair value={settings.about.experienceTitle} onChange={(l, v) => patchLocalized("about.experienceTitle", l, v)} t={t} />
    <p className="v6Group">{t.expText}</p><Pair value={settings.about.experienceText} onChange={(l, v) => patchLocalized("about.experienceText", l, v)} t={t} textarea />
    <p className="v6Group">التعليم داخل السيرة / CV Education</p><Pair value={education} onChange={(l, v) => patchExtraLocalized("resumeEducation", l, v)} t={t} textarea />
    <p className="v6Group">اللغات داخل السيرة / CV Languages</p><Pair value={languages} onChange={(l, v) => patchExtraLocalized("resumeLanguages", l, v)} t={t} />
    <p className="v6Group">المهارات — كل مهارة بسطر / CV Skills</p><Pair value={skills} onChange={(l, v) => patchExtraLocalized("resumeSkills", l, v)} t={t} textarea />
    <p className="v6Group">نسخة PDF اختيارية / Optional CV PDF</p>
    <label><input dir="ltr" value={settings.about.resumeFileUrl || ""} onChange={(event) => patch("resumeFileUrl", event.target.value)} /></label>
    <Upload label="رفع ملف السيرة PDF" accept=".pdf,application/pdf" onChange={(event) => upload(event, (url: string) => patch("resumeFileUrl", url))} />
  </div>;
}

function ContactPanel({ settings, updateSettings, patchLocalized, upload, t }: any) {
  const patch = (key: string, value: any) => {
    const n = structuredClone(settings);
    n.contact[key] = value;
    updateSettings(n);
  };

  const setLink = (i: number, field: "url" | "label", value: any) => {
    const n = structuredClone(settings);
    if (field === "url") n.contact.customLinks[i].url = value;
    else n.contact.customLinks[i].label = value;
    updateSettings(n);
  };

  const contactSection = settings.sections.contact;
  const style = contactSection.style ?? {
    backgroundPreset: "inherit",
    backgroundColor: "",
    backgroundUrl: "",
    nightBackgroundUrl: "",
    textColor: "",
    accentColor: "",
    panelColor: "",
    buttonColor: "",
  };

  const patchContactStyle = (key: string, value: any) => {
    const n = structuredClone(settings);
    n.sections.contact.style = { ...style, [key]: value };
    updateSettings(n);
  };

  const resetContactStyle = () => {
    const n = structuredClone(settings);
    n.sections.contact.style = {
      backgroundPreset: "inherit",
      backgroundColor: "",
      backgroundUrl: "",
      nightBackgroundUrl: "",
      textColor: "",
      accentColor: "",
      panelColor: "",
      buttonColor: "",
    };
    updateSettings(n);
  };

  return <div className="v6Form">
    <p className="v6Group">عنوان قسم التواصل / Contact heading</p>
    <Pair value={settings.contact.eyebrow} onChange={(l: Lang, v: string) => patchLocalized("contact.eyebrow", l, v)} t={t} />
    <label>{t.email}<input dir="ltr" value={settings.contact.email} onChange={(e) => patch("email", e.target.value)} /></label>
    <label>{t.instagram}<input dir="ltr" value={settings.contact.instagram} onChange={(e) => patch("instagram", e.target.value)} /></label>
    <label>{t.youtube}<input dir="ltr" value={settings.contact.youtube} onChange={(e) => patch("youtube", e.target.value)} /></label>
    <label>{t.github}<input dir="ltr" value={settings.contact.github} onChange={(e) => patch("github", e.target.value)} /></label>

    <p className="v6Group">{t.links}</p>
    {settings.contact.customLinks.map((link: any, i: number) => <div className="v6Nested" key={i}>
      <Pair value={link.label} onChange={(l, v) => setLink(i, "label", { ...link.label, [l]: v })} t={t} />
      <label>{t.linkUrl}<input dir="ltr" value={link.url} onChange={(e) => setLink(i, "url", e.target.value)} /></label>
      <button className="danger" onClick={() => patch("customLinks", settings.contact.customLinks.filter((_: any, index: number) => index !== i))}>×</button>
    </div>)}
    <button onClick={() => patch("customLinks", [...settings.contact.customLinks, { label: { en: "Link", ar: "رابط" }, url: "" }])}>{t.addLink}</button>

    <p className="v6Group">مظهر قسم التواصل / Contact appearance</p>
    <label>خلفية جاهزة / Background preset</label>
    <VisualPresetPicker value={style.backgroundPreset || "inherit"} allowInherit onChange={(value) => patchContactStyle("backgroundPreset", value)} />
    <VisualColor label="لون الخلفية / Background color" value={style.backgroundColor || ""} onChange={(value) => patchContactStyle("backgroundColor", value)} />
    <VisualColor label="لون النص / Text color" value={style.textColor || ""} onChange={(value) => patchContactStyle("textColor", value)} />
    <VisualColor label="اللون المميز / Accent color" value={style.accentColor || ""} onChange={(value) => patchContactStyle("accentColor", value)} />
    <VisualColor label="لون البطاقات / Card color" value={style.panelColor || ""} onChange={(value) => patchContactStyle("panelColor", value)} />
    <VisualColor label="لون الأزرار / Button color" value={style.buttonColor || ""} onChange={(value) => patchContactStyle("buttonColor", value)} />

    <label>صورة خلفية خاصة / Custom background image
      <input dir="ltr" value={style.backgroundUrl || ""} onChange={(event) => patchContactStyle("backgroundUrl", event.target.value)} />
    </label>
    <Upload label="رفع خلفية قسم التواصل / Upload contact background" accept="image/*" onChange={(event) => upload(event, (url: string) => patchContactStyle("backgroundUrl", url))} />
    <label>خلفية التواصل الليلية / Night contact background
      <input dir="ltr" value={style.nightBackgroundUrl || ""} onChange={(event) => patchContactStyle("nightBackgroundUrl", event.target.value)} />
    </label>
    <Upload label="رفع خلفية تواصل ليلية / Upload night contact background" accept="image/*" onChange={(event) => upload(event, (url: string) => patchContactStyle("nightBackgroundUrl", url))} />

    {style.backgroundUrl && <div className="v17ContactBgPreview">
      <img src={style.backgroundUrl} alt="Contact background preview" />
    </div>}

    <button type="button" onClick={resetContactStyle}>إعادة مظهر التواصل للوضع العام / Reset contact appearance</button>
  </div>;
}

function FooterPanel({ settings, updateSettings, patchLocalized, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.footer[key] = value; updateSettings(n); };
  return <div className="v6Form"><Toggle label={t.footerEnabled} checked={settings.footer.enabled} onChange={(v) => patch("enabled", v)} /><Pair value={settings.footer.text} onChange={(l, v) => patchLocalized("footer.text", l, v)} t={t} /></div>;
}

function applyAutoMetadata(data: any, item: any, patchItem: any) {
  if (data.kind) patchItem("kind", data.kind);
  if (data.title) { patchItem("title", data.title); if (!item.title_ar) patchItem("title_ar", data.title); }
  if (data.subtitle) { patchItem("subtitle", data.subtitle); if (!item.subtitle_ar) patchItem("subtitle_ar", data.subtitle); }
  if (data.description) { patchItem("description", data.description); if (!item.description_ar) patchItem("description_ar", data.description); }
  if (data.platform) patchItem("category", data.platform);
  if (data.cover_url) patchItem("cover_url", data.cover_url);
  if (data.url) patchItem("external_url", data.url);
  if (data.year) patchItem("year", data.year);
  patchItem("source_rating_text", data.source_rating_text || "");
  patchItem("source_rating_label", data.source_rating_label || "");
}

function ItemPanel({ item, patchItem, saveItem, deleteItem, upload, busy, lang, t }: any) {
  const subtitleLabel = item.kind === "music" ? t.artist : item.kind === "game" ? t.platform : t.itemSubtitle;
  const externalLabel = item.kind === "movie" ? t.netflix : item.kind === "music" ? t.spotify : item.kind === "game" ? t.gameLink : t.external;
  const showMedia = item.kind === "video" || item.kind === "music";
  const autoImporter = ["movie", "music", "game"].includes(item.kind) ? <AutoMediaImporter item={item} lang={lang} onUrlChange={(url) => patchItem("external_url", url)} onApply={(data) => applyAutoMetadata(data, item, patchItem)} /> : null;
  return <div className="v6Form">
    {autoImporter}
    <div className="v6Pair">
      <label>{t.type}<select value={item.kind} onChange={(event) => patchItem("kind", event.target.value)}><option value="photo">{t.photo}</option><option value="video">{t.video}</option><option value="movie">{t.movie}</option><option value="music">{t.music}</option><option value="game">{t.game}</option></select></label>
      <label>{t.sort}<input type="number" value={item.sort_order ?? 0} onChange={(event) => patchItem("sort_order", Number(event.target.value))} /></label>
    </div>
    <p className="v6Group">{t.itemTitle}</p>
    <div className="v6Pair"><label>{t.english}<input dir="ltr" value={item.title ?? ""} onChange={(event) => patchItem("title", event.target.value)} /></label><label>{t.arabic}<input dir="rtl" value={item.title_ar ?? ""} onChange={(event) => patchItem("title_ar", event.target.value)} /></label></div>
    <p className="v6Group">{subtitleLabel}</p>
    <div className="v6Pair"><label>{t.english}<input dir="ltr" value={item.subtitle ?? ""} onChange={(event) => patchItem("subtitle", event.target.value)} /></label><label>{t.arabic}<input dir="rtl" value={item.subtitle_ar ?? ""} onChange={(event) => patchItem("subtitle_ar", event.target.value)} /></label></div>
    <p className="v6Group">{t.description}</p>
    <div className="v6Pair"><label>{t.english}<textarea rows={4} value={item.description ?? ""} onChange={(event) => patchItem("description", event.target.value)} /></label><label>{t.arabic}<textarea dir="rtl" rows={4} value={item.description_ar ?? ""} onChange={(event) => patchItem("description_ar", event.target.value)} /></label></div>
    <label>{item.kind === "photo" ? (lang === "ar" ? "الألبوم" : "Album") : item.kind === "game" || item.kind === "movie" ? t.platform : t.category}<input value={item.category ?? ""} onChange={(event) => patchItem("category", event.target.value)} /></label>
    <label>{t.tags}<input value={(item.tags ?? []).join(", ")} onChange={(event) => patchItem("tags", event.target.value.split(",").map((tag: string) => tag.trim()).filter(Boolean))} placeholder={lang === "ar" ? "افصل بين الوسوم بفاصلة" : "Separate tags with commas"} /></label>
    <div className="v6Pair"><label>{t.cover}<input dir="ltr" value={item.cover_url ?? ""} onChange={(event) => patchItem("cover_url", event.target.value)} /></label><Upload label={t.coverUpload} accept="image/*" onChange={(event) => upload(event, (url: string) => patchItem("cover_url", url))} /></div>
    {item.cover_url && <div className="v20CoverPreview"><img src={item.cover_url} alt={lang === "ar" ? "معاينة الغلاف" : "Cover preview"} /><span>{lang === "ar" ? "معاينة الغلاف" : "Cover preview"}</span></div>}
    {showMedia && <><label>{t.mediaUrl}<input dir="ltr" value={item.video_url ?? ""} onChange={(event) => patchItem("video_url", event.target.value)} /></label><Upload label={t.mediaUpload} accept={item.kind === "video" ? "video/*" : "audio/*"} onChange={(event) => upload(event, (url: string) => patchItem("video_url", url))} /></>}
    {item.kind !== "photo" && <label>{externalLabel}<input dir="ltr" value={item.external_url ?? ""} onChange={(event) => patchItem("external_url", event.target.value)} /></label>}
    <div className="v6Pair"><label>{t.year}<input value={item.year ?? ""} onChange={(event) => patchItem("year", event.target.value)} /></label><label>{t.duration}<input value={item.duration ?? ""} onChange={(event) => patchItem("duration", event.target.value)} /></label></div>
    {item.kind === "movie" && <><label>{t.rating}<input type="number" min="0" max="10" step="0.1" value={item.rating ?? ""} onChange={(event) => patchItem("rating", event.target.value === "" ? null : Number(event.target.value))} /></label><div className="v6Pair"><label>{lang === "ar" ? "نص التقييم الإضافي" : "Additional rating"}<input value={item.source_rating_text ?? ""} onChange={(event) => patchItem("source_rating_text", event.target.value)} /></label><label>{lang === "ar" ? "مصدر التقييم" : "Rating source"}<input value={item.source_rating_label ?? ""} onChange={(event) => patchItem("source_rating_label", event.target.value)} /></label></div></>}
    <Toggle label={t.published} checked={Boolean(item.is_published)} onChange={(value) => patchItem("is_published", value)} />
    <Toggle label={t.featured} checked={Boolean(item.is_featured)} onChange={(value) => patchItem("is_featured", value)} />
    <div className="v6ItemActions"><button className="save" onClick={saveItem} disabled={busy}>{busy ? t.saving : t.saveItem}</button><button className="danger" onClick={deleteItem} disabled={busy}>{t.deleteItem}</button></div>
  </div>;
}
