"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PortfolioClient, type VisualEditTarget } from "../../components/portfolio-client";
import { demoItems, type PortfolioItem, type PortfolioKind } from "../../lib/content";
import { sectionKeys, type CustomSection, type Lang, type LocalizedText, type SiteConfig, type SiteSectionKey } from "../../lib/site-settings";
import { createClient } from "../../lib/supabase/client";

type Panel = VisualEditTarget | { type: "item" } | { type: "sections-manager" } | { type: "items-manager" } | null;
type LocalItem = PortfolioItem & { _local?: boolean };

const labels = {
  ar: {
    editor: "محرر Rover المرئي", editMode: "وضع التحرير", sectionsMenu: "الأقسام", contentMenu: "الأعمال والمحتوى", visitorPreview: "معاينة كزائر", backToEdit: "الرجوع للتحرير", saveDesign: "حفظ تصميم الموقع", discardDesign: "تراجع", addSection: "إضافة قسم", openSite: "فتح الموقع", signOut: "تسجيل الخروج", unsaved: "تغييرات غير محفوظة", saved: "تم الحفظ", saving: "جاري الحفظ…",
    close: "إغلاق", brand: "الشعار والقائمة", theme: "المظهر والألوان", hero: "الواجهة الرئيسية", section: "إعدادات القسم", about: "قسم عني", contact: "قسم التواصل", footer: "التذييل", item: "تعديل العمل", newItem: "إضافة عمل",
    logoType: "نوع الشعار", letter: "حرف/رمز الشعار", image: "صورة", logoImage: "صورة الشعار", favicon: "أيقونة التبويب (Favicon)", upload: "رفع صورة", showName: "إظهار الاسم", showAlias: "إظهار Rover", headerVisible: "إظهار القائمة العلوية", sticky: "تثبيت القائمة", langSwitch: "إظهار زر اللغة", name: "الاسم", alias: "اللقب", heading: "العنوان الكبير", homeName: "اسم الرئيسية بالقائمة", kicker: "السطر الرئيسي", subtitle: "السطر الوصفي", stampTop: "النص الجانبي الأول", stampMiddle: "النص الجانبي الأوسط", stampBottom: "النص الجانبي الأخير", primaryButton: "الزر الأول", secondaryButton: "الزر الثاني", background: "خلفية الواجهة", target: "يروح إلى", visible: "ظاهر", inNav: "يظهر بالقائمة", order: "الترتيب", navName: "اسم القسم بالقائمة", sectionTitle: "عنوان القسم", sectionSubtitle: "وصف القسم", surface: "خلفية القسم", dark: "داكن", black: "أسود", accent: "لون مميز", moveUp: "فوق", moveDown: "جوه", deleteSection: "حذف القسم", sectionBody: "محتوى القسم", sectionImage: "صورة القسم", layout: "التخطيط", textOnly: "نص", mediaLeft: "الصورة يسار", mediaRight: "الصورة يمين",
    accentColor: "اللون الرئيسي", bgColor: "الخلفية الرئيسية", altBg: "الخلفية البديلة", panelColor: "لون البطاقات", textColor: "لون النص", mutedColor: "لون النص الثانوي", lineColor: "لون الحدود", font: "خط الموقع", headingFont: "خط العناوين", radius: "استدارة الزوايا", aboutEyebrow: "النص الصغير", aboutText: "نبذة عني", aboutImage: "صورتي/صورة قسم عني", stats: "المعلومات الصغيرة", contactEyebrow: "النص الصغير", email: "البريد", instagram: "Instagram", youtube: "YouTube", github: "GitHub", customLinks: "روابط إضافية", addLink: "إضافة رابط", linkName: "اسم الرابط", linkUrl: "الرابط", footerEnabled: "إظهار التذييل", footerText: "نص الحقوق",
    english: "إنكليزي", arabic: "عربي", type: "النوع", photo: "تصوير", film: "فيلم / وثائقي", application: "تطبيق / مشروع", creative: "عمل إبداعي", sort: "ترتيب العمل", enTitle: "العنوان الإنكليزي", arTitle: "العنوان العربي", itemSubtitle: "النوع/العنوان الفرعي", category: "التصنيف", year: "السنة", duration: "المدة", description: "الوصف", tags: "الوسوم", cover: "الصورة/الغلاف", video: "رابط الفيديو", external: "رابط المشروع", published: "منشور", featured: "مميز", saveItem: "حفظ هذا العمل", deleteItem: "حذف العمل", cancelItem: "إلغاء التغييرات", addItemHint: "تقدر تعدل العمل وتشوفه بالموقع قبل الحفظ.", empty: "ماكو أعمال محفوظة حالياً؛ الموقع العام يعرض محتوى تجريبي إلى أن تضيف أول عمل.",
  },
  en: {
    editor: "Rover Visual Editor", editMode: "Edit mode", sectionsMenu: "Sections", contentMenu: "Content", visitorPreview: "Visitor preview", backToEdit: "Back to editing", saveDesign: "Save site design", discardDesign: "Discard", addSection: "Add section", openSite: "Open website", signOut: "Sign out", unsaved: "Unsaved changes", saved: "Saved", saving: "Saving…",
    close: "Close", brand: "Brand & navigation", theme: "Theme & colors", hero: "Hero", section: "Section settings", about: "About section", contact: "Contact section", footer: "Footer", item: "Edit item", newItem: "Add item",
    logoType: "Logo type", letter: "Logo letter/symbol", image: "Image", logoImage: "Logo image", favicon: "Browser icon (favicon)", upload: "Upload image", showName: "Show name", showAlias: "Show Rover", headerVisible: "Show header", sticky: "Sticky header", langSwitch: "Show language switch", name: "Name", alias: "Alias", heading: "Big heading", homeName: "Home nav label", kicker: "Hero headline", subtitle: "Hero subtitle", stampTop: "Stamp top", stampMiddle: "Stamp middle", stampBottom: "Stamp bottom", primaryButton: "Primary button", secondaryButton: "Secondary button", background: "Hero background", target: "Target", visible: "Visible", inNav: "Show in navigation", order: "Order", navName: "Navigation name", sectionTitle: "Section title", sectionSubtitle: "Section subtitle", surface: "Section background", dark: "Dark", black: "Black", accent: "Accent", moveUp: "Move up", moveDown: "Move down", deleteSection: "Delete section", sectionBody: "Section content", sectionImage: "Section image", layout: "Layout", textOnly: "Text", mediaLeft: "Image left", mediaRight: "Image right",
    accentColor: "Accent color", bgColor: "Main background", altBg: "Alternate background", panelColor: "Cards color", textColor: "Text color", mutedColor: "Muted text", lineColor: "Borders color", font: "Site font", headingFont: "Heading font", radius: "Corner radius", aboutEyebrow: "Small heading", aboutText: "About text", aboutImage: "About image", stats: "Stats", contactEyebrow: "Small heading", email: "Email", instagram: "Instagram", youtube: "YouTube", github: "GitHub", customLinks: "Custom links", addLink: "Add link", linkName: "Link name", linkUrl: "URL", footerEnabled: "Show footer", footerText: "Copyright text",
    english: "English", arabic: "Arabic", type: "Type", photo: "Photography", film: "Film / Documentary", application: "Application / Project", creative: "Creative work", sort: "Sort order", enTitle: "English title", arTitle: "Arabic title", itemSubtitle: "Subtitle / project type", category: "Category", year: "Year", duration: "Duration", description: "Description", tags: "Tags", cover: "Cover / media", video: "Video URL", external: "Project URL", published: "Published", featured: "Featured", saveItem: "Save this item", deleteItem: "Delete item", cancelItem: "Discard item changes", addItemHint: "Edit the item and see it live before saving.", empty: "No saved content yet; the public site keeps demo content until you save your first item.",
  },
} as const;

export function VisualEditor({ initialItems, initialSettings }: { initialItems: PortfolioItem[]; initialSettings: SiteConfig }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [adminLang, setAdminLang] = useState<Lang>("ar");
  const [siteLang, setSiteLang] = useState<Lang>("en");
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [items, setItems] = useState<LocalItem[]>(initialItems.length ? initialItems : demoItems.map((item, index) => ({ ...item, id: `demo-${index}`, _local: true })));
  const [panel, setPanel] = useState<Panel>(null);
  const [itemDraft, setItemDraft] = useState<LocalItem | null>(null);
  const [itemOriginal, setItemOriginal] = useState<LocalItem | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const t = labels[adminLang];

  function changeSettings(next: SiteConfig) { setSettings(next); setSettingsDirty(true); setMessage(""); }
  function patchSection(key: SiteSectionKey, patch: Partial<SiteConfig["sections"][SiteSectionKey]>) { changeSettings({ ...settings, sections: { ...settings.sections, [key]: { ...settings.sections[key], ...patch } } }); }
  function patchCustom(id: string, patch: Partial<CustomSection>) { changeSettings({ ...settings, customSections: settings.customSections.map((s) => s.id === id ? { ...s, ...patch } : s) }); }

  function edit(target: VisualEditTarget) { setPanel(target); setItemDraft(null); setItemOriginal(null); }
  function editItem(item: PortfolioItem) { const copy = { ...item } as LocalItem; setItemDraft(copy); setItemOriginal(copy); setPanel({ type: "item" }); }
  function addItem(kind: PortfolioKind) {
    const draft: LocalItem = { id: `local-${crypto.randomUUID()}`, _local: true, kind, title: adminLang === "ar" ? "عمل جديد" : "New item", title_ar: "", subtitle: "", description: "", category: "", cover_url: "", video_url: "", external_url: "", year: "", duration: "", tags: [], sort_order: items.filter((i) => i.kind === kind).length + 1, is_featured: false, is_published: true };
    setItems((current) => [...current, draft]); setItemDraft(draft); setItemOriginal(null); setPanel({ type: "item" });
  }
  function patchItem<K extends keyof PortfolioItem>(key: K, value: PortfolioItem[K]) {
    if (!itemDraft) return;
    const next = { ...itemDraft, [key]: value } as LocalItem; setItemDraft(next); setItems((current) => current.map((item) => item.id === next.id ? next : item));
  }
  function discardItem() {
    if (!itemDraft) return;
    if (itemOriginal) setItems((current) => current.map((item) => item.id === itemDraft.id ? itemOriginal : item));
    else setItems((current) => current.filter((item) => item.id !== itemDraft.id));
    setItemDraft(null); setItemOriginal(null); setPanel(null); setMessage("");
  }

  async function uploadMedia(file: File): Promise<string | null> {
    setBusy(true); setMessage(adminLang === "ar" ? "جاري رفع الصورة…" : "Uploading image…");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setMessage(adminLang === "ar" ? "انتهت الجلسة. سجل دخول من جديد." : "Session expired."); setBusy(false); return null; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio-media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { setMessage(error.message); setBusy(false); return null; }
    const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path);
    setBusy(false); setMessage(""); return data.publicUrl;
  }
  async function uploadInto(event: ChangeEvent<HTMLInputElement>, apply: (url: string) => void) { const file = event.target.files?.[0]; if (!file) return; const url = await uploadMedia(file); if (url) apply(url); event.target.value = ""; }

  async function saveDesign() {
    setBusy(true); setMessage("");
    const { error } = await supabase.from("site_settings").upsert({ key: "site_config", value: settings }, { onConflict: "key" });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setSavedSettings(structuredClone(settings)); setSettingsDirty(false); setMessage(t.saved); router.refresh();
  }

  async function saveItem() {
    if (!itemDraft || !itemDraft.title.trim()) return;
    setBusy(true); setMessage("");
    const payload = {
      kind: itemDraft.kind, title: itemDraft.title.trim(), title_ar: itemDraft.title_ar?.trim() || null, subtitle: itemDraft.subtitle?.trim() || null, description: itemDraft.description?.trim() || null, category: itemDraft.category?.trim() || null, cover_url: itemDraft.cover_url?.trim() || null, video_url: itemDraft.video_url?.trim() || null, external_url: itemDraft.external_url?.trim() || null, year: itemDraft.year?.trim() || null, duration: itemDraft.duration?.trim() || null, tags: itemDraft.tags ?? [], sort_order: Number(itemDraft.sort_order ?? 0), is_featured: Boolean(itemDraft.is_featured), is_published: Boolean(itemDraft.is_published),
    };
    const isLocal = itemDraft._local || itemDraft.id?.startsWith("local-") || !itemDraft.id;
    const result = isLocal ? await supabase.from("portfolio_items").insert(payload).select().single() : await supabase.from("portfolio_items").update(payload).eq("id", itemDraft.id!).select().single();
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    const saved = result.data as PortfolioItem;
    setItems((current) => initialItems.length ? current.map((item) => item.id === itemDraft.id ? saved : item) : [...current.filter((item) => !item._local), saved]); setItemDraft(saved); setItemOriginal(saved); setMessage(t.saved); router.refresh();
  }

  async function deleteItem() {
    if (!itemDraft) return;
    if (itemDraft._local || itemDraft.id?.startsWith("local-") || !itemDraft.id) { discardItem(); return; }
    if (!window.confirm(adminLang === "ar" ? "متأكد تريد حذف هذا العمل؟" : "Delete this item?")) return;
    setBusy(true); const { error } = await supabase.from("portfolio_items").delete().eq("id", itemDraft.id); setBusy(false);
    if (error) { setMessage(error.message); return; }
    setItems((current) => current.filter((item) => item.id !== itemDraft.id)); setItemDraft(null); setItemOriginal(null); setPanel(null); setMessage(t.saved); router.refresh();
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/admin/login"); router.refresh(); }

  function addCustomSection() {
    const maxOrder = Math.max(0, ...sectionKeys.map((key) => settings.sections[key].order), ...settings.customSections.map((s) => s.order));
    const section: CustomSection = { id: `section-${crypto.randomUUID().slice(0, 8)}`, enabled: true, showInNav: true, order: maxOrder + 1, nav: { en: "New section", ar: "قسم جديد" }, title: { en: "New section", ar: "قسم جديد" }, subtitle: { en: "", ar: "" }, body: { en: "Write your content here.", ar: "اكتب محتوى القسم هنا." }, imageUrl: "", layout: "text", surface: "dark" };
    changeSettings({ ...settings, customSections: [...settings.customSections, section] }); setPanel({ type: "custom-section", id: section.id });
    setTimeout(() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  return <div className={`visualAdmin ${previewOnly ? "previewOnly" : ""}`} dir={adminLang === "ar" ? "rtl" : "ltr"}>
    <div className="visualAdminBar">
      <div className="visualAdminTitle"><strong>{t.editor}</strong>{settingsDirty && <span className="dirtyDot">● {t.unsaved}</span>}</div>
      <div className="visualAdminBarActions">
        <button onClick={() => setSiteLang(siteLang === "en" ? "ar" : "en")}>{siteLang === "en" ? "عرض عربي" : "English view"}</button>
        <button onClick={() => setAdminLang(adminLang === "ar" ? "en" : "ar")}>{adminLang === "ar" ? "EN" : "عربي"}</button>
        <button onClick={() => setPreviewOnly(!previewOnly)}>{previewOnly ? `✎ ${t.backToEdit}` : `◉ ${t.visitorPreview}`}</button>
        {!previewOnly && <button onClick={() => setPanel({ type: "sections-manager" })}>☷ {t.sectionsMenu}</button>}
        {!previewOnly && <button onClick={() => setPanel({ type: "items-manager" })}>▦ {t.contentMenu}</button>}
        {!previewOnly && <button onClick={addCustomSection}>＋ {t.addSection}</button>}
        {!previewOnly && <button className="save" onClick={saveDesign} disabled={busy || !settingsDirty}>{busy ? t.saving : t.saveDesign}</button>}
        {!previewOnly && <button onClick={() => { setSettings(structuredClone(savedSettings)); setSettingsDirty(false); setMessage(""); }}>{t.discardDesign}</button>}
        <a href="/" target="_blank" rel="noreferrer">↗ {t.openSite}</a>
        <button onClick={signOut}>{t.signOut}</button>
      </div>
    </div>

    <div className="visualSiteFrame">
      <PortfolioClient items={items} settings={settings} forcedLang={siteLang} editor={{ enabled: true, controlsVisible: !previewOnly, onEdit: edit, onEditItem: editItem, onAddItem: addItem }} />
      {!initialItems.length && !previewOnly && <div className="demoNotice">{t.empty}</div>}
    </div>

    {!previewOnly && panel && <aside className="visualInspector">
      <div className="visualInspectorHead"><strong>{panelTitle(panel, t)}</strong><button onClick={() => { if (panel.type === "item" && itemDraft) discardItem(); else setPanel(null); }}>×</button></div>
      <div className="visualInspectorBody">
        {panel.type === "brand" && <BrandPanel settings={settings} changeSettings={changeSettings} uploadInto={uploadInto} t={t} />}
        {panel.type === "theme" && <ThemePanel settings={settings} changeSettings={changeSettings} t={t} />}
        {panel.type === "hero" && <HeroPanel settings={settings} changeSettings={changeSettings} uploadInto={uploadInto} t={t} />}
        {panel.type === "section" && <SectionPanel sectionKey={panel.key} settings={settings} patchSection={patchSection} t={t} />}
        {panel.type === "custom-section" && <CustomSectionPanel id={panel.id} settings={settings} patchCustom={patchCustom} changeSettings={changeSettings} uploadInto={uploadInto} t={t} />}
        {panel.type === "about" && <AboutPanel settings={settings} changeSettings={changeSettings} patchSection={patchSection} uploadInto={uploadInto} t={t} />}
        {panel.type === "contact" && <ContactPanel settings={settings} changeSettings={changeSettings} patchSection={patchSection} t={t} />}
        {panel.type === "footer" && <FooterPanel settings={settings} changeSettings={changeSettings} t={t} />}
        {panel.type === "sections-manager" && <SectionsManagerPanel settings={settings} patchSection={patchSection} patchCustom={patchCustom} onEdit={edit} addCustomSection={addCustomSection} t={t} />}
        {panel.type === "items-manager" && <ItemsManagerPanel items={items} onEditItem={editItem} onAddItem={addItem} t={t} />}
        {panel.type === "item" && itemDraft && <ItemPanel item={itemDraft} patchItem={patchItem} uploadInto={uploadInto} saveItem={saveItem} deleteItem={deleteItem} discardItem={discardItem} busy={busy} t={t} />}
        {message && <p className="visualMessage">{message}</p>}
      </div>
    </aside>}
  </div>;
}

function panelTitle(panel: Exclude<Panel, null>, t: typeof labels.ar | typeof labels.en) {
  if (panel.type === "brand") return t.brand; if (panel.type === "theme") return t.theme; if (panel.type === "hero") return t.hero; if (panel.type === "section" || panel.type === "custom-section") return t.section; if (panel.type === "about") return t.about; if (panel.type === "contact") return t.contact; if (panel.type === "footer") return t.footer; if (panel.type === "sections-manager") return t.sectionsMenu; if (panel.type === "items-manager") return t.contentMenu; return t.item;
}

function LocalizedFields({ label, value, onChange, t, textarea = false }: { label: string; value: LocalizedText; onChange: (v: LocalizedText) => void; t: typeof labels.ar | typeof labels.en; textarea?: boolean }) {
  const Control = textarea ? "textarea" : "input";
  return <div className="visualFieldPair"><label>{label} — {t.english}<Control dir="ltr" value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })}/></label><label>{label} — {t.arabic}<Control dir="rtl" value={value.ar} onChange={(e) => onChange({ ...value, ar: e.target.value })}/></label></div>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) { return <label className="visualToggle"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}/><span>{label}</span></label>; }
function Upload({ label, onChange }: { label: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) { return <label className="visualUpload">＋ {label}<input type="file" accept="image/*" onChange={onChange}/></label>; }
function SurfaceSelect({ value, onChange, t }: { value?: string; onChange: (v: "dark" | "black" | "accent") => void; t: typeof labels.ar | typeof labels.en }) { return <label>{t.surface}<select value={value ?? "dark"} onChange={(e) => onChange(e.target.value as "dark" | "black" | "accent")}><option value="dark">{t.dark}</option><option value="black">{t.black}</option><option value="accent">{t.accent}</option></select></label>; }

function BrandPanel({ settings, changeSettings, uploadInto, t }: any) { return <div className="visualForm">
  <label>{t.logoType}<select value={settings.brand.logoType} onChange={(e) => changeSettings({ ...settings, brand: { ...settings.brand, logoType: e.target.value } })}><option value="letter">{t.letter}</option><option value="image">{t.image}</option></select></label>
  <label>{t.letter}<input value={settings.brand.letter} onChange={(e) => changeSettings({ ...settings, brand: { ...settings.brand, letter: e.target.value.slice(0, 3) } })}/></label>
  <label>{t.logoImage}<input dir="ltr" value={settings.brand.logoUrl} onChange={(e) => changeSettings({ ...settings, brand: { ...settings.brand, logoUrl: e.target.value } })}/></label><Upload label={t.upload} onChange={(e) => uploadInto(e, (url: string) => changeSettings({ ...settings, brand: { ...settings.brand, logoUrl: url, logoType: "image" } }))}/>
  <label>{t.favicon}<input dir="ltr" value={settings.brand.faviconUrl} onChange={(e) => changeSettings({ ...settings, brand: { ...settings.brand, faviconUrl: e.target.value } })}/></label><Upload label={t.upload} onChange={(e) => uploadInto(e, (url: string) => changeSettings({ ...settings, brand: { ...settings.brand, faviconUrl: url } }))}/>
  <Toggle label={t.showName} checked={settings.brand.showName} onChange={(v) => changeSettings({ ...settings, brand: { ...settings.brand, showName: v } })}/><Toggle label={t.showAlias} checked={settings.brand.showAlias} onChange={(v) => changeSettings({ ...settings, brand: { ...settings.brand, showAlias: v } })}/>
  <Toggle label={t.headerVisible} checked={settings.header.enabled} onChange={(v) => changeSettings({ ...settings, header: { ...settings.header, enabled: v } })}/><Toggle label={t.sticky} checked={settings.header.sticky} onChange={(v) => changeSettings({ ...settings, header: { ...settings.header, sticky: v } })}/><Toggle label={t.langSwitch} checked={settings.header.showLanguageSwitch} onChange={(v) => changeSettings({ ...settings, header: { ...settings.header, showLanguageSwitch: v } })}/>
  <LocalizedFields label={t.homeName} value={settings.hero.homeNav} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, homeNav: v } })} t={t}/>
</div>; }

function ThemePanel({ settings, changeSettings, t }: any) { const color = (label: string, key: string) => <label>{label}<div className="visualColor"><input type="color" value={settings.theme[key]} onChange={(e) => changeSettings({ ...settings, theme: { ...settings.theme, [key]: e.target.value } })}/><input dir="ltr" value={settings.theme[key]} onChange={(e) => changeSettings({ ...settings, theme: { ...settings.theme, [key]: e.target.value } })}/></div></label>; return <div className="visualForm">{color(t.accentColor, "accentColor")}{color(t.bgColor, "backgroundColor")}{color(t.altBg, "alternateBackgroundColor")}{color(t.panelColor, "panelColor")}{color(t.textColor, "textColor")}{color(t.mutedColor, "mutedColor")}{color(t.lineColor, "lineColor")}<label>{t.font}<input dir="ltr" value={settings.theme.fontFamily} onChange={(e) => changeSettings({ ...settings, theme: { ...settings.theme, fontFamily: e.target.value } })}/></label><label>{t.headingFont}<input dir="ltr" value={settings.theme.headingFontFamily} onChange={(e) => changeSettings({ ...settings, theme: { ...settings.theme, headingFontFamily: e.target.value } })}/></label><label>{t.radius}<input type="range" min="0" max="28" value={settings.theme.radius} onChange={(e) => changeSettings({ ...settings, theme: { ...settings.theme, radius: Number(e.target.value) } })}/><span>{settings.theme.radius}px</span></label></div>; }

function HeroPanel({ settings, changeSettings, uploadInto, t }: any) { const targets = [...sectionKeys.map((key) => ({ id: key, label: settings.sections[key].title.en })), ...settings.customSections.map((s: CustomSection) => ({ id: s.id, label: s.title.en }))]; return <div className="visualForm"><Toggle label={t.visible} checked={settings.hero.enabled} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, enabled: v } })}/><label>{t.name}<input value={settings.hero.name} onChange={(e) => changeSettings({ ...settings, hero: { ...settings.hero, name: e.target.value } })}/></label><label>{t.alias}<input value={settings.hero.alias} onChange={(e) => changeSettings({ ...settings, hero: { ...settings.hero, alias: e.target.value } })}/></label><label>{t.heading}<input value={settings.hero.heading} onChange={(e) => changeSettings({ ...settings, hero: { ...settings.hero, heading: e.target.value } })}/></label><LocalizedFields label={t.kicker} value={settings.hero.kicker} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, kicker: v } })} t={t}/><LocalizedFields label={t.subtitle} value={settings.hero.subtitle} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, subtitle: v } })} t={t}/><LocalizedFields label={t.stampTop} value={settings.hero.stampTop} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, stampTop: v } })} t={t}/><LocalizedFields label={t.stampMiddle} value={settings.hero.stampMiddle} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, stampMiddle: v } })} t={t}/><LocalizedFields label={t.stampBottom} value={settings.hero.stampBottom} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, stampBottom: v } })} t={t}/><LocalizedFields label={t.primaryButton} value={settings.hero.primaryButton} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, primaryButton: v } })} t={t}/><label>{t.primaryButton} — {t.target}<select value={settings.hero.primaryTarget} onChange={(e) => changeSettings({ ...settings, hero: { ...settings.hero, primaryTarget: e.target.value } })}>{targets.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label><LocalizedFields label={t.secondaryButton} value={settings.hero.secondaryButton} onChange={(v) => changeSettings({ ...settings, hero: { ...settings.hero, secondaryButton: v } })} t={t}/><label>{t.secondaryButton} — {t.target}<select value={settings.hero.secondaryTarget} onChange={(e) => changeSettings({ ...settings, hero: { ...settings.hero, secondaryTarget: e.target.value } })}>{targets.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label><label>{t.background}<input dir="ltr" value={settings.hero.backgroundUrl} onChange={(e) => changeSettings({ ...settings, hero: { ...settings.hero, backgroundUrl: e.target.value } })}/></label><Upload label={t.upload} onChange={(e) => uploadInto(e, (url: string) => changeSettings({ ...settings, hero: { ...settings.hero, backgroundUrl: url } }))}/></div>; }

function SectionPanel({ sectionKey, settings, patchSection, t }: { sectionKey: SiteSectionKey; settings: SiteConfig; patchSection: (k: SiteSectionKey, p: any) => void; t: any }) { const s = settings.sections[sectionKey]; return <div className="visualForm"><Toggle label={t.visible} checked={s.enabled} onChange={(v) => patchSection(sectionKey, { enabled: v })}/><Toggle label={t.inNav} checked={s.showInNav} onChange={(v) => patchSection(sectionKey, { showInNav: v })}/><label>{t.order}<input type="number" value={s.order} onChange={(e) => patchSection(sectionKey, { order: Number(e.target.value) })}/></label><div className="visualMove"><button onClick={() => patchSection(sectionKey, { order: s.order - 1 })}>↑ {t.moveUp}</button><button onClick={() => patchSection(sectionKey, { order: s.order + 1 })}>↓ {t.moveDown}</button></div><LocalizedFields label={t.navName} value={s.nav} onChange={(v) => patchSection(sectionKey, { nav: v })} t={t}/><LocalizedFields label={t.sectionTitle} value={s.title} onChange={(v) => patchSection(sectionKey, { title: v })} t={t}/><LocalizedFields label={t.sectionSubtitle} value={s.subtitle} onChange={(v) => patchSection(sectionKey, { subtitle: v })} t={t}/><SurfaceSelect value={s.surface} onChange={(v) => patchSection(sectionKey, { surface: v })} t={t}/></div>; }

function CustomSectionPanel({ id, settings, patchCustom, changeSettings, uploadInto, t }: any) { const s = settings.customSections.find((x: CustomSection) => x.id === id); if (!s) return null; return <div className="visualForm"><Toggle label={t.visible} checked={s.enabled} onChange={(v) => patchCustom(id, { enabled: v })}/><Toggle label={t.inNav} checked={s.showInNav} onChange={(v) => patchCustom(id, { showInNav: v })}/><label>{t.order}<input type="number" value={s.order} onChange={(e) => patchCustom(id, { order: Number(e.target.value) })}/></label><LocalizedFields label={t.navName} value={s.nav} onChange={(v) => patchCustom(id, { nav: v })} t={t}/><LocalizedFields label={t.sectionTitle} value={s.title} onChange={(v) => patchCustom(id, { title: v })} t={t}/><LocalizedFields label={t.sectionSubtitle} value={s.subtitle} onChange={(v) => patchCustom(id, { subtitle: v })} t={t}/><LocalizedFields label={t.sectionBody} value={s.body} onChange={(v) => patchCustom(id, { body: v })} t={t} textarea/><label>{t.sectionImage}<input dir="ltr" value={s.imageUrl} onChange={(e) => patchCustom(id, { imageUrl: e.target.value })}/></label><Upload label={t.upload} onChange={(e) => uploadInto(e, (url: string) => patchCustom(id, { imageUrl: url }))}/><label>{t.layout}<select value={s.layout} onChange={(e) => patchCustom(id, { layout: e.target.value })}><option value="text">{t.textOnly}</option><option value="media-left">{t.mediaLeft}</option><option value="media-right">{t.mediaRight}</option></select></label><SurfaceSelect value={s.surface} onChange={(v) => patchCustom(id, { surface: v })} t={t}/><button className="visualDanger" onClick={() => { if (window.confirm(t.deleteSection + "؟")) changeSettings({ ...settings, customSections: settings.customSections.filter((x: CustomSection) => x.id !== id) }); }}>{t.deleteSection}</button></div>; }

function AboutPanel({ settings, changeSettings, patchSection, uploadInto, t }: any) { const s = settings.sections.about; return <div className="visualForm"><Toggle label={t.visible} checked={s.enabled} onChange={(v) => patchSection("about", { enabled: v })}/><Toggle label={t.inNav} checked={s.showInNav} onChange={(v) => patchSection("about", { showInNav: v })}/><LocalizedFields label={t.navName} value={s.nav} onChange={(v) => patchSection("about", { nav: v })} t={t}/><LocalizedFields label={t.sectionTitle} value={s.title} onChange={(v) => patchSection("about", { title: v })} t={t}/><label>{t.aboutEyebrow}<input value={settings.about.eyebrow} onChange={(e) => changeSettings({ ...settings, about: { ...settings.about, eyebrow: e.target.value } })}/></label><LocalizedFields label={t.aboutText} value={settings.about.text} onChange={(v) => changeSettings({ ...settings, about: { ...settings.about, text: v } })} t={t} textarea/><label>{t.aboutImage}<input dir="ltr" value={settings.about.imageUrl} onChange={(e) => changeSettings({ ...settings, about: { ...settings.about, imageUrl: e.target.value } })}/></label><Upload label={t.upload} onChange={(e) => uploadInto(e, (url: string) => changeSettings({ ...settings, about: { ...settings.about, imageUrl: url } }))}/><p className="visualGroupLabel">{t.stats}</p>{settings.about.stats.map((stat: any, index: number) => <div className="visualNested" key={index}><LocalizedFields label={`${index + 1}`} value={stat.title} onChange={(v) => { const stats = [...settings.about.stats]; stats[index] = { ...stats[index], title: v }; changeSettings({ ...settings, about: { ...settings.about, stats } }); }} t={t}/><LocalizedFields label={t.subtitle} value={stat.subtitle} onChange={(v) => { const stats = [...settings.about.stats]; stats[index] = { ...stats[index], subtitle: v }; changeSettings({ ...settings, about: { ...settings.about, stats } }); }} t={t}/></div>)}</div>; }

function ContactPanel({ settings, changeSettings, patchSection, t }: any) { const s = settings.sections.contact; return <div className="visualForm"><Toggle label={t.visible} checked={s.enabled} onChange={(v) => patchSection("contact", { enabled: v })}/><Toggle label={t.inNav} checked={s.showInNav} onChange={(v) => patchSection("contact", { showInNav: v })}/><LocalizedFields label={t.navName} value={s.nav} onChange={(v) => patchSection("contact", { nav: v })} t={t}/><LocalizedFields label={t.sectionTitle} value={s.title} onChange={(v) => patchSection("contact", { title: v })} t={t}/><LocalizedFields label={t.sectionSubtitle} value={s.subtitle} onChange={(v) => patchSection("contact", { subtitle: v })} t={t}/><LocalizedFields label={t.contactEyebrow} value={settings.contact.eyebrow} onChange={(v) => changeSettings({ ...settings, contact: { ...settings.contact, eyebrow: v } })} t={t}/><label>{t.email}<input dir="ltr" value={settings.contact.email} onChange={(e) => changeSettings({ ...settings, contact: { ...settings.contact, email: e.target.value } })}/></label><label>{t.instagram}<input dir="ltr" value={settings.contact.instagram} onChange={(e) => changeSettings({ ...settings, contact: { ...settings.contact, instagram: e.target.value } })}/></label><label>{t.youtube}<input dir="ltr" value={settings.contact.youtube} onChange={(e) => changeSettings({ ...settings, contact: { ...settings.contact, youtube: e.target.value } })}/></label><label>{t.github}<input dir="ltr" value={settings.contact.github} onChange={(e) => changeSettings({ ...settings, contact: { ...settings.contact, github: e.target.value } })}/></label><p className="visualGroupLabel">{t.customLinks}</p>{settings.contact.customLinks.map((link: any, index: number) => <div className="visualNested" key={index}><LocalizedFields label={t.linkName} value={link.label} onChange={(v) => { const customLinks = [...settings.contact.customLinks]; customLinks[index] = { ...customLinks[index], label: v }; changeSettings({ ...settings, contact: { ...settings.contact, customLinks } }); }} t={t}/><label>{t.linkUrl}<input dir="ltr" value={link.url} onChange={(e) => { const customLinks = [...settings.contact.customLinks]; customLinks[index] = { ...customLinks[index], url: e.target.value }; changeSettings({ ...settings, contact: { ...settings.contact, customLinks } }); }}/></label><button className="visualDanger small" onClick={() => changeSettings({ ...settings, contact: { ...settings.contact, customLinks: settings.contact.customLinks.filter((_: any, i: number) => i !== index) } })}>×</button></div>)}<button onClick={() => changeSettings({ ...settings, contact: { ...settings.contact, customLinks: [...settings.contact.customLinks, { label: { en: "New link", ar: "رابط جديد" }, url: "" }] } })}>＋ {t.addLink}</button></div>; }

function FooterPanel({ settings, changeSettings, t }: any) { return <div className="visualForm"><Toggle label={t.footerEnabled} checked={settings.footer.enabled} onChange={(v) => changeSettings({ ...settings, footer: { ...settings.footer, enabled: v } })}/><LocalizedFields label={t.footerText} value={settings.footer.text} onChange={(v) => changeSettings({ ...settings, footer: { ...settings.footer, text: v } })} t={t}/></div>; }

function SectionsManagerPanel({ settings, patchSection, patchCustom, onEdit, addCustomSection, t }: any) {
  const builtins = sectionKeys.map((key) => ({ id: key, name: settings.sections[key].title.ar || settings.sections[key].title.en, enabled: settings.sections[key].enabled, order: settings.sections[key].order, custom: false }));
  const custom = settings.customSections.map((s: CustomSection) => ({ id: s.id, name: s.title.ar || s.title.en, enabled: s.enabled, order: s.order, custom: true }));
  return <div className="visualForm"><p className="visualHint">{t.sectionsMenu}: {t.visible} / {t.order}</p>{[...builtins, ...custom].sort((a,b) => a.order-b.order).map((row) => <div className="visualManagerRow" key={row.id}><div><strong>{row.name}</strong><small>#{row.order}</small></div><Toggle label={t.visible} checked={row.enabled} onChange={(v) => row.custom ? patchCustom(row.id, { enabled: v }) : patchSection(row.id, { enabled: v })}/><button onClick={() => onEdit(row.custom ? { type: "custom-section", id: row.id } : { type: "section", key: row.id })}>✎</button></div>)}<button onClick={addCustomSection}>＋ {t.addSection}</button></div>;
}

function ItemsManagerPanel({ items, onEditItem, onAddItem, t }: any) {
  return <div className="visualForm"><div className="visualQuickAdd"><button onClick={() => onAddItem("photo")}>＋ {t.photo}</button><button onClick={() => onAddItem("film")}>＋ {t.film}</button><button onClick={() => onAddItem("application")}>＋ {t.application}</button><button onClick={() => onAddItem("creative")}>＋ {t.creative}</button></div>{items.map((item: LocalItem, index: number) => <button className="visualContentRow" key={item.id ?? index} onClick={() => onEditItem(item)}><span>{item.cover_url ? <img src={item.cover_url} alt=""/> : <b>{item.title.slice(0,1)}</b>}</span><div><strong>{item.title}</strong><small>{item.kind} · {item.is_published === false ? "Draft / مخفي" : "Published / منشور"}</small></div><i>✎</i></button>)}</div>;
}

function ItemPanel({ item, patchItem, uploadInto, saveItem, deleteItem, discardItem, busy, t }: any) { return <div className="visualForm"><p className="visualHint">{t.addItemHint}</p><label>{t.type}<select value={item.kind} onChange={(e) => patchItem("kind", e.target.value)}><option value="photo">{t.photo}</option><option value="film">{t.film}</option><option value="application">{t.application}</option><option value="creative">{t.creative}</option></select></label><label>{t.sort}<input type="number" value={item.sort_order ?? 0} onChange={(e) => patchItem("sort_order", Number(e.target.value))}/></label><label>{t.enTitle}<input dir="ltr" value={item.title} onChange={(e) => patchItem("title", e.target.value)}/></label><label>{t.arTitle}<input dir="rtl" value={item.title_ar ?? ""} onChange={(e) => patchItem("title_ar", e.target.value)}/></label><label>{t.itemSubtitle}<input value={item.subtitle ?? ""} onChange={(e) => patchItem("subtitle", e.target.value)}/></label><label>{t.category}<input value={item.category ?? ""} onChange={(e) => patchItem("category", e.target.value)}/></label><label>{t.year}<input value={item.year ?? ""} onChange={(e) => patchItem("year", e.target.value)}/></label><label>{t.duration}<input value={item.duration ?? ""} onChange={(e) => patchItem("duration", e.target.value)}/></label><label>{t.description}<textarea rows={5} value={item.description ?? ""} onChange={(e) => patchItem("description", e.target.value)}/></label><label>{t.tags}<input value={(item.tags ?? []).join(", ")} onChange={(e) => patchItem("tags", e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean))}/></label><label>{t.cover}<input dir="ltr" value={item.cover_url ?? ""} onChange={(e) => patchItem("cover_url", e.target.value)}/></label><Upload label={t.upload} onChange={(e) => uploadInto(e, (url: string) => patchItem("cover_url", url))}/><label>{t.video}<input dir="ltr" value={item.video_url ?? ""} onChange={(e) => patchItem("video_url", e.target.value)}/></label><label>{t.external}<input dir="ltr" value={item.external_url ?? ""} onChange={(e) => patchItem("external_url", e.target.value)}/></label><Toggle label={t.published} checked={Boolean(item.is_published)} onChange={(v) => patchItem("is_published", v)}/><Toggle label={t.featured} checked={Boolean(item.is_featured)} onChange={(v) => patchItem("is_featured", v)}/><div className="visualItemActions"><button className="save" onClick={saveItem} disabled={busy}>{t.saveItem}</button><button onClick={discardItem}>{t.cancelItem}</button><button className="visualDanger" onClick={deleteItem}>{t.deleteItem}</button></div></div>; }
