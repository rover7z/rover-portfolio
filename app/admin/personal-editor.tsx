"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonalSiteClient, type PersonalEditTarget } from "../../components/personal-site-client";
import type { PortfolioItem, PortfolioKind } from "../../lib/content";
import { personalSectionKeys, type Lang, type LocalizedText, type PersonalSectionKey, type PersonalSiteConfig } from "../../lib/personal-site";
import { createClient } from "../../lib/supabase/client";

type Panel = PersonalEditTarget | { type: "item" } | null;
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
    type: "النوع", photo: "صورة", video: "فيديو", movie: "فيلم", music: "أغنية", game: "لعبة", itemTitle: "الاسم / العنوان", itemSubtitle: "العنوان الفرعي", artist: "الفنان", platform: "المنصة", description: "الوصف", category: "التصنيف", year: "السنة", duration: "المدة", cover: "صورة الغلاف", mediaUrl: "رابط الفيديو/الصوت", external: "الرابط الخارجي", netflix: "رابط الفيلم / المنصة", spotify: "رابط Spotify", gameLink: "رابط اللعبة / المتجر", coverUpload: "رفع صورة الغلاف", mediaUpload: "رفع فيديو أو صوت", published: "منشور", featured: "مميز", sort: "ترتيب العنصر", saveItem: "حفظ المحتوى", deleteItem: "حذف", cancel: "إلغاء",
  },
  en: {
    editor: "Rover Visual Editor", preview: "Visitor preview", edit: "Back to editing", sections: "Sections", save: "Save website", saving: "Saving…", saved: "Saved", unsaved: "Unsaved changes", signout: "Sign out", close: "Close",
    brand: "Brand & navigation", theme: "Theme & colors", hero: "Hero", about: "About me", contact: "Contact", footer: "Footer", section: "Section settings", item: "Edit content", newItem: "Add content",
    enabled: "Show section", nav: "Show in navigation", order: "Order", navName: "Navigation name", title: "Section title", subtitle: "Section description", english: "English", arabic: "Arabic",
    logoType: "Logo type", letter: "Letter / symbol", image: "Image", logo: "Logo image", favicon: "Browser favicon", upload: "Upload image", showName: "Show name", showAlias: "Show Rover", showHeader: "Show header", sticky: "Sticky header", langSwitch: "Language switch",
    name: "Name", alias: "Alias", heading: "Big heading", home: "Home label", kicker: "Main description", heroSub: "Small line", firstButton: "Primary button", secondButton: "Secondary button", firstTarget: "Primary target", secondTarget: "Secondary target", heroBg: "Hero background",
    aboutText: "About description", aboutPhoto: "My photo", expTitle: "Experience title", expText: "Jobs & experience", email: "Email", instagram: "Instagram", youtube: "YouTube", github: "GitHub", links: "Extra links", addLink: "Add link", linkName: "Link name", linkUrl: "URL",
    accent: "Accent color", bg: "Background", bg2: "Alternate background", panel: "Card color", text: "Text color", muted: "Muted text", line: "Borders", radius: "Corner radius", footerText: "Copyright text", footerEnabled: "Show footer",
    type: "Type", photo: "Photo", video: "Video", movie: "Movie", music: "Song", game: "Game", itemTitle: "Name / title", itemSubtitle: "Subtitle", artist: "Artist", platform: "Platform", description: "Description", category: "Category", year: "Year", duration: "Duration", cover: "Cover image", mediaUrl: "Video / audio URL", external: "External link", netflix: "Movie / Platform URL", spotify: "Spotify URL", gameLink: "Game / store URL", coverUpload: "Upload cover", mediaUpload: "Upload video or audio", published: "Published", featured: "Featured", sort: "Item order", saveItem: "Save content", deleteItem: "Delete", cancel: "Cancel",
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
  const t = labels[lang];

  function updateSettings(next: PersonalSiteConfig) {
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

  async function saveSettings() {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("site_settings").upsert({ key: "site_config_v6", value: settings }, { onConflict: "key" });
    setBusy(false);
    if (error) return setMessage(error.message);
    setSavedSettings(structuredClone(settings));
    setDirty(false);
    setMessage(t.saved);
    router.refresh();
  }

  function discardSettings() {
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
    if (!window.confirm(lang === "ar" ? `حذف “${selectedItem.title}”؟` : `Delete “${selectedItem.title}”?`)) return;
    setBusy(true);
    const { error } = await supabase.from("portfolio_items").delete().eq("id", selectedItem.id);
    setBusy(false);
    if (error) return setMessage(error.message);
    setItems((current) => current.filter((x) => x.id !== selectedItem.id));
    setSelectedItem(null);
    setPanel(null);
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

  const bridge = {
    enabled: true,
    controlsVisible: !preview,
    onEdit: (target: PersonalEditTarget) => { setPanel(target); setPreview(false); },
    onEditItem: startEditItem,
    onAddItem: startAdd,
  };

  return <div className={`v6Admin ${preview ? "preview" : ""}`} dir={lang === "ar" ? "rtl" : "ltr"}>
    <div className="v6AdminBar">
      <div className="v6AdminTitle"><strong>{t.editor}</strong>{dirty && <span>● {t.unsaved}</span>}</div>
      <div className="v6AdminActions">
        <button onClick={() => setPreview((x) => !x)}>{preview ? t.edit : t.preview}</button>
        <button onClick={() => { setPanel({ type: "sections" }); setPreview(false); }}>{t.sections}</button>
        <button onClick={() => { setPanel({ type: "brand" }); setPreview(false); }}>{t.brand}</button>
        <button onClick={() => { setPanel({ type: "theme" }); setPreview(false); }}>{t.theme}</button>
        <button onClick={() => setLang((x) => x === "ar" ? "en" : "ar")}>{lang === "ar" ? "EN" : "عربي"}</button>
        {dirty && <button onClick={discardSettings}>{lang === "ar" ? "تراجع" : "Discard"}</button>}
        <button className="save" disabled={busy || !dirty} onClick={saveSettings}>{busy ? t.saving : t.save}</button>
        <button onClick={signOut}>{t.signout}</button>
      </div>
    </div>

    <div className="v6AdminSite"><PersonalSiteClient items={items} settings={settings} editor={bridge} forcedLang={lang} /></div>

    {panel && !preview && <aside className="v6Inspector">
      <div className="v6InspectorHead"><strong>{panelTitle(panel, t, Boolean(selectedItem?._local))}</strong><button onClick={() => setPanel(null)}>×</button></div>
      <div className="v6InspectorBody">
        {panel.type === "sections" && <SectionsPanel settings={settings} patchSection={patchSection} onEdit={(key: PersonalSectionKey) => setPanel({ type: "section", key })} t={t} />}
        {panel.type === "section" && <SectionPanel sectionKey={panel.key} settings={settings} patchSection={patchSection} patchLocalized={patchSectionLocalized} t={t} />}
        {panel.type === "brand" && <BrandPanel settings={settings} updateSettings={updateSettings} upload={upload} t={t} />}
        {panel.type === "hero" && <HeroPanel settings={settings} updateSettings={updateSettings} patchLocalized={patchLocalized} upload={upload} t={t} />}
        {panel.type === "theme" && <ThemePanel settings={settings} updateSettings={updateSettings} t={t} />}
        {panel.type === "about" && <AboutPanel settings={settings} updateSettings={updateSettings} patchLocalized={patchLocalized} upload={upload} t={t} />}
        {panel.type === "contact" && <ContactPanel settings={settings} updateSettings={updateSettings} t={t} />}
        {panel.type === "footer" && <FooterPanel settings={settings} updateSettings={updateSettings} patchLocalized={patchLocalized} t={t} />}
        {panel.type === "item" && selectedItem && <ItemPanel item={selectedItem} patchItem={patchItem} saveItem={saveItem} deleteItem={deleteItem} upload={upload} busy={busy} lang={lang} t={t} />}
        {message && <p className="v6AdminMessage">{message}</p>}
      </div>
    </aside>}
  </div>;
}

function panelTitle(panel: Panel, t: any, isNew: boolean) {
  if (!panel) return "";
  if (panel.type === "item") return isNew ? t.newItem : t.item;
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

function SectionsPanel({ settings, patchSection, onEdit, t }: any) {
  return <div className="v6Form">{personalSectionKeys.sort((a, b) => settings.sections[a].order - settings.sections[b].order).map((key) => <div className="v6ManagerRow" key={key}><div><strong>{settings.sections[key].title.ar}</strong><small>{settings.sections[key].title.en}</small></div><Toggle label={t.enabled} checked={settings.sections[key].enabled} onChange={(v) => patchSection(key, { enabled: v })} /><button onClick={() => onEdit(key)}>✎</button></div>)}</div>;
}

function SectionPanel({ sectionKey, settings, patchSection, patchLocalized, t }: any) {
  const s = settings.sections[sectionKey];
  return <div className="v6Form"><Toggle label={t.enabled} checked={s.enabled} onChange={(v) => patchSection(sectionKey, { enabled: v })} /><Toggle label={t.nav} checked={s.showInNav} onChange={(v) => patchSection(sectionKey, { showInNav: v })} /><label>{t.order}<input type="number" value={s.order} onChange={(e) => patchSection(sectionKey, { order: Number(e.target.value) })} /></label><p className="v6Group">{t.navName}</p><Pair value={s.nav} onChange={(l, v) => patchLocalized(sectionKey, "nav", l, v)} t={t} /><p className="v6Group">{t.title}</p><Pair value={s.title} onChange={(l, v) => patchLocalized(sectionKey, "title", l, v)} t={t} /><p className="v6Group">{t.subtitle}</p><Pair value={s.subtitle} onChange={(l, v) => patchLocalized(sectionKey, "subtitle", l, v)} t={t} textarea /></div>;
}

function BrandPanel({ settings, updateSettings, upload, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.brand[key] = value; updateSettings(n); };
  const patchHeader = (key: string, value: any) => { const n = structuredClone(settings); n.header[key] = value; updateSettings(n); };
  return <div className="v6Form"><label>{t.logoType}<select value={settings.brand.logoType} onChange={(e) => patch("logoType", e.target.value)}><option value="letter">{t.letter}</option><option value="image">{t.image}</option></select></label>{settings.brand.logoType === "letter" ? <label>{t.letter}<input value={settings.brand.letter} onChange={(e) => patch("letter", e.target.value)} /></label> : <><label>{t.logo}<input dir="ltr" value={settings.brand.logoUrl} onChange={(e) => patch("logoUrl", e.target.value)} /></label><Upload label={t.upload} accept="image/*" onChange={(e) => upload(e, (url: string) => patch("logoUrl", url))} /></>}<label>{t.favicon}<input dir="ltr" value={settings.brand.faviconUrl} onChange={(e) => patch("faviconUrl", e.target.value)} /></label><Upload label={t.favicon} accept="image/*" onChange={(e) => upload(e, (url: string) => patch("faviconUrl", url))} /><Toggle label={t.showName} checked={settings.brand.showName} onChange={(v) => patch("showName", v)} /><Toggle label={t.showAlias} checked={settings.brand.showAlias} onChange={(v) => patch("showAlias", v)} /><p className="v6Group">Navigation</p><Toggle label={t.showHeader} checked={settings.header.enabled} onChange={(v) => patchHeader("enabled", v)} /><Toggle label={t.sticky} checked={settings.header.sticky} onChange={(v) => patchHeader("sticky", v)} /><Toggle label={t.langSwitch} checked={settings.header.showLanguageSwitch} onChange={(v) => patchHeader("showLanguageSwitch", v)} /></div>;
}

function HeroPanel({ settings, updateSettings, patchLocalized, upload, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.hero[key] = value; updateSettings(n); };
  const targetOptions = personalSectionKeys.map((key) => <option key={key} value={key}>{settings.sections[key].title.en}</option>);
  return <div className="v6Form"><label>{t.name}<input value={settings.hero.name} onChange={(e) => patch("name", e.target.value)} /></label><label>{t.alias}<input value={settings.hero.alias} onChange={(e) => patch("alias", e.target.value)} /></label><label>{t.heading}<input value={settings.hero.heading} onChange={(e) => patch("heading", e.target.value)} /></label><p className="v6Group">{t.home}</p><Pair value={settings.hero.homeNav} onChange={(l, v) => patchLocalized("hero.homeNav", l, v)} t={t} /><p className="v6Group">{t.kicker}</p><Pair value={settings.hero.kicker} onChange={(l, v) => patchLocalized("hero.kicker", l, v)} t={t} textarea /><p className="v6Group">{t.heroSub}</p><Pair value={settings.hero.subtitle} onChange={(l, v) => patchLocalized("hero.subtitle", l, v)} t={t} /><p className="v6Group">{t.firstButton}</p><Pair value={settings.hero.primaryButton} onChange={(l, v) => patchLocalized("hero.primaryButton", l, v)} t={t} /><label>{t.firstTarget}<select value={settings.hero.primaryTarget} onChange={(e) => patch("primaryTarget", e.target.value)}>{targetOptions}</select></label><p className="v6Group">{t.secondButton}</p><Pair value={settings.hero.secondaryButton} onChange={(l, v) => patchLocalized("hero.secondaryButton", l, v)} t={t} /><label>{t.secondTarget}<select value={settings.hero.secondaryTarget} onChange={(e) => patch("secondaryTarget", e.target.value)}>{targetOptions}</select></label><label>{t.heroBg}<input dir="ltr" value={settings.hero.backgroundUrl} onChange={(e) => patch("backgroundUrl", e.target.value)} /></label><Upload label={t.heroBg} accept="image/*" onChange={(e) => upload(e, (url: string) => patch("backgroundUrl", url))} /></div>;
}

function ThemePanel({ settings, updateSettings, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.theme[key] = value; updateSettings(n); };
  const colors = [["accentColor", t.accent], ["backgroundColor", t.bg], ["alternateBackgroundColor", t.bg2], ["panelColor", t.panel], ["textColor", t.text], ["mutedColor", t.muted], ["lineColor", t.line]];
  return <div className="v6Form">{colors.map(([key, label]) => <label key={key}>{label}<div className="v6Color"><input type="color" value={settings.theme[key]} onChange={(e) => patch(key, e.target.value)} /><input value={settings.theme[key]} onChange={(e) => patch(key, e.target.value)} /></div></label>)}<label>{t.radius}<input type="number" min="0" max="40" value={settings.theme.radius} onChange={(e) => patch("radius", Number(e.target.value))} /></label></div>;
}

function AboutPanel({ settings, updateSettings, patchLocalized, upload, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.about[key] = value; updateSettings(n); };
  return <div className="v6Form"><p className="v6Group">{t.aboutPhoto}</p><label><input dir="ltr" value={settings.about.imageUrl} onChange={(e) => patch("imageUrl", e.target.value)} /></label><Upload label={t.aboutPhoto} accept="image/*" onChange={(e) => upload(e, (url: string) => patch("imageUrl", url))} /><p className="v6Group">{t.aboutText}</p><Pair value={settings.about.text} onChange={(l, v) => patchLocalized("about.text", l, v)} t={t} textarea /><p className="v6Group">{t.expTitle}</p><Pair value={settings.about.experienceTitle} onChange={(l, v) => patchLocalized("about.experienceTitle", l, v)} t={t} /><p className="v6Group">{t.expText}</p><Pair value={settings.about.experienceText} onChange={(l, v) => patchLocalized("about.experienceText", l, v)} t={t} textarea /></div>;
}

function ContactPanel({ settings, updateSettings, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.contact[key] = value; updateSettings(n); };
  const setLink = (i: number, field: "url" | "label", value: any) => { const n = structuredClone(settings); if (field === "url") n.contact.customLinks[i].url = value; else n.contact.customLinks[i].label = value; updateSettings(n); };
  return <div className="v6Form"><label>{t.email}<input dir="ltr" value={settings.contact.email} onChange={(e) => patch("email", e.target.value)} /></label><label>{t.instagram}<input dir="ltr" value={settings.contact.instagram} onChange={(e) => patch("instagram", e.target.value)} /></label><label>{t.youtube}<input dir="ltr" value={settings.contact.youtube} onChange={(e) => patch("youtube", e.target.value)} /></label><label>{t.github}<input dir="ltr" value={settings.contact.github} onChange={(e) => patch("github", e.target.value)} /></label><p className="v6Group">{t.links}</p>{settings.contact.customLinks.map((link: any, i: number) => <div className="v6Nested" key={i}><Pair value={link.label} onChange={(l, v) => setLink(i, "label", { ...link.label, [l]: v })} t={t} /><label>{t.linkUrl}<input dir="ltr" value={link.url} onChange={(e) => setLink(i, "url", e.target.value)} /></label><button className="danger" onClick={() => patch("customLinks", settings.contact.customLinks.filter((_: any, index: number) => index !== i))}>×</button></div>)}<button onClick={() => patch("customLinks", [...settings.contact.customLinks, { label: { en: "Link", ar: "رابط" }, url: "" }])}>{t.addLink}</button></div>;
}

function FooterPanel({ settings, updateSettings, patchLocalized, t }: any) {
  const patch = (key: string, value: any) => { const n = structuredClone(settings); n.footer[key] = value; updateSettings(n); };
  return <div className="v6Form"><Toggle label={t.footerEnabled} checked={settings.footer.enabled} onChange={(v) => patch("enabled", v)} /><Pair value={settings.footer.text} onChange={(l, v) => patchLocalized("footer.text", l, v)} t={t} /></div>;
}

function ItemPanel({ item, patchItem, saveItem, deleteItem, upload, busy, lang, t }: any) {
  const subtitleLabel = item.kind === "music" ? t.artist : item.kind === "game" ? t.platform : t.itemSubtitle;
  const externalLabel = item.kind === "movie" ? t.netflix : item.kind === "music" ? t.spotify : item.kind === "game" ? t.gameLink : t.external;
  const showMedia = item.kind === "video" || item.kind === "music";
  return <div className="v6Form"><label>{t.type}<select value={item.kind} onChange={(e) => patchItem("kind", e.target.value)}><option value="photo">{t.photo}</option><option value="video">{t.video}</option><option value="movie">{t.movie}</option><option value="music">{t.music}</option><option value="game">{t.game}</option></select></label><label>{t.sort}<input type="number" value={item.sort_order ?? 0} onChange={(e) => patchItem("sort_order", Number(e.target.value))} /></label><p className="v6Group">{t.itemTitle}</p><div className="v6Pair"><label>{t.english}<input dir="ltr" value={item.title ?? ""} onChange={(e) => patchItem("title", e.target.value)} /></label><label>{t.arabic}<input dir="rtl" value={item.title_ar ?? ""} onChange={(e) => patchItem("title_ar", e.target.value)} /></label></div>{item.kind !== "photo" && <><p className="v6Group">{subtitleLabel}</p><div className="v6Pair"><label>{t.english}<input dir="ltr" value={item.subtitle ?? ""} onChange={(e) => patchItem("subtitle", e.target.value)} /></label><label>{t.arabic}<input dir="rtl" value={item.subtitle_ar ?? ""} onChange={(e) => patchItem("subtitle_ar", e.target.value)} /></label></div></>}{(item.kind === "movie" || item.kind === "video" || item.kind === "game") && <><p className="v6Group">{t.description}</p><div className="v6Pair"><label>{t.english}<textarea rows={4} value={item.description ?? ""} onChange={(e) => patchItem("description", e.target.value)} /></label><label>{t.arabic}<textarea dir="rtl" rows={4} value={item.description_ar ?? ""} onChange={(e) => patchItem("description_ar", e.target.value)} /></label></div></>}<label>{item.kind === "game" || item.kind === "movie" ? t.platform : t.category}<input value={item.category ?? ""} onChange={(e) => patchItem("category", e.target.value)} /></label><label>{t.cover}<input dir="ltr" value={item.cover_url ?? ""} onChange={(e) => patchItem("cover_url", e.target.value)} /></label><Upload label={t.coverUpload} accept="image/*" onChange={(e) => upload(e, (url: string) => patchItem("cover_url", url))} />{showMedia && <><label>{t.mediaUrl}<input dir="ltr" value={item.video_url ?? ""} onChange={(e) => patchItem("video_url", e.target.value)} /></label><Upload label={t.mediaUpload} accept={item.kind === "video" ? "video/*" : "audio/*"} onChange={(e) => upload(e, (url: string) => patchItem("video_url", url))} /></>} {item.kind !== "photo" && <label>{externalLabel}<input dir="ltr" value={item.external_url ?? ""} onChange={(e) => patchItem("external_url", e.target.value)} /></label>}<div className="v6Pair"><label>{t.year}<input value={item.year ?? ""} onChange={(e) => patchItem("year", e.target.value)} /></label><label>{t.duration}<input value={item.duration ?? ""} onChange={(e) => patchItem("duration", e.target.value)} /></label></div><Toggle label={t.published} checked={Boolean(item.is_published)} onChange={(v) => patchItem("is_published", v)} /><Toggle label={t.featured} checked={Boolean(item.is_featured)} onChange={(v) => patchItem("is_featured", v)} /><div className="v6ItemActions"><button className="save" onClick={saveItem} disabled={busy}>{t.saveItem}</button><button className="danger" onClick={deleteItem}>{t.deleteItem}</button></div></div>;
}
