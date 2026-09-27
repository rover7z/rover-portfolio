"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { PortfolioItem, PortfolioKind } from "../lib/content";
import { sectionKeys, type CustomSection, type Lang, type SiteConfig, type SiteSectionKey } from "../lib/site-settings";

export type VisualEditTarget =
  | { type: "brand" }
  | { type: "theme" }
  | { type: "hero" }
  | { type: "section"; key: SiteSectionKey }
  | { type: "custom-section"; id: string }
  | { type: "about" }
  | { type: "contact" }
  | { type: "footer" };

export type PortfolioEditorBridge = {
  enabled: boolean;
  controlsVisible: boolean;
  onEdit: (target: VisualEditTarget) => void;
  onEditItem: (item: PortfolioItem) => void;
  onAddItem: (kind: PortfolioKind) => void;
};

export function PortfolioClient({ items, settings, editor, forcedLang }: { items: PortfolioItem[]; settings: SiteConfig; editor?: PortfolioEditorBridge; forcedLang?: Lang }) {
  const [localLang, setLocalLang] = useState<Lang>(forcedLang ?? "en");
  const [photoFilter, setPhotoFilter] = useState("All");
  const lang = forcedLang ?? localLang;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const photos = items.filter((item) => item.kind === "photo" && item.is_published !== false);
  const films = items.filter((item) => item.kind === "film" && item.is_published !== false);
  const projects = items.filter((item) => item.kind === "application" && item.is_published !== false);
  const creative = items.filter((item) => item.kind === "creative" && item.is_published !== false);
  const filters = ["All", ...Array.from(new Set(photos.map((p) => p.category).filter(Boolean) as string[]))];
  const filteredPhotos = useMemo(() => (photoFilter === "All" ? photos : photos.filter((p) => p.category === photoFilter)), [photos, photoFilter]);
  const featuredFilm = films.find((film) => film.is_featured) ?? films[0];

  const ordered = useMemo(() => {
    const builtins = sectionKeys.map((key) => ({ kind: "builtin" as const, id: key, order: settings.sections[key].order, enabled: settings.sections[key].enabled, showInNav: settings.sections[key].showInNav, nav: settings.sections[key].nav }));
    const custom = settings.customSections.map((section) => ({ kind: "custom" as const, id: section.id, order: section.order, enabled: section.enabled, showInNav: section.showInNav, nav: section.nav }));
    return [...builtins, ...custom].filter((entry) => entry.enabled).sort((a, b) => a.order - b.order);
  }, [settings]);

  const navSections = ordered.filter((entry) => entry.showInNav);
  const mainStyle = {
    "--gold": settings.theme.accentColor,
    "--site-bg": settings.theme.backgroundColor,
    "--site-bg2": settings.theme.alternateBackgroundColor,
    "--site-panel": settings.theme.panelColor,
    "--site-text": settings.theme.textColor,
    "--site-muted": settings.theme.mutedColor,
    "--site-line": settings.theme.lineColor,
    "--site-radius": `${settings.theme.radius}px`,
    "--site-font": settings.theme.fontFamily,
    "--site-heading-font": settings.theme.headingFontFamily,
  } as CSSProperties;

  const editButton = (label: string, target: VisualEditTarget) => editor?.enabled && editor.controlsVisible ? (
    <button className="visualEditButton" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); editor.onEdit(target); }}>✎ {label}</button>
  ) : null;

  const itemButton = (item: PortfolioItem) => editor?.enabled && editor.controlsVisible ? (
    <button className="visualItemEdit" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); editor.onEditItem(item); }}>✎</button>
  ) : null;

  const addButton = (kind: PortfolioKind, label: string) => editor?.enabled && editor.controlsVisible ? (
    <button className="visualAddItem" type="button" onClick={() => editor.onAddItem(kind)}>＋ {label}</button>
  ) : null;

  const sectionNodes: Record<SiteSectionKey, ReactNode> = {
    photography: (
      <section id="photography" className={`section ${surfaceClass(settings.sections.photography.surface)}`} key="photography">
        {editButton(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "section", key: "photography" })}
        <SectionTitle title={settings.sections.photography.title[lang]} subtitle={settings.sections.photography.subtitle[lang]} />
        <div className="filters">
          {filters.map((f) => <button key={f} onClick={() => setPhotoFilter(f)} className={photoFilter === f ? "active" : ""}>{f === "All" ? (lang === "ar" ? "الكل" : "All") : f}</button>)}
        </div>
        <div className="photoGrid">
          {filteredPhotos.map((p, i) => <article className={`photoCard photo${i % 3} visualEditableCard`} key={p.id ?? `${p.title}-${i}`} style={{ backgroundImage: `url('${p.cover_url ?? ""}')` }}>
            {itemButton(p)}<div className="cardShade" /><div className="cardText"><small>{p.category}</small><strong>{lang === "ar" && p.title_ar ? p.title_ar : p.title}</strong></div>
          </article>)}
        </div>
        {addButton("photo", lang === "ar" ? "إضافة صورة" : "Add photo")}
      </section>
    ),
    films: (
      <section id="films" className={`section ${surfaceClass(settings.sections.films.surface)}`} key="films">
        {editButton(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "section", key: "films" })}
        <SectionTitle title={settings.sections.films.title[lang]} subtitle={settings.sections.films.subtitle[lang]} />
        {featuredFilm && <article className="featuredFilm visualEditableCard" style={{ backgroundImage: `url('${featuredFilm.cover_url ?? ""}')` }}>
          {itemButton(featuredFilm)}<div className="filmShade" />
          {featuredFilm.video_url ? <a className="bigPlay linkPlay" href={featuredFilm.video_url} target="_blank" rel="noreferrer">▶</a> : <span className="bigPlay staticPlay">▶</span>}
          <div className="filmInfo"><h3>{lang === "ar" && featuredFilm.title_ar ? featuredFilm.title_ar : featuredFilm.title}</h3>{lang !== "ar" && featuredFilm.title_ar && <h4>{featuredFilm.title_ar}</h4>}<p>{featuredFilm.year} · {lang === "ar" ? "وثائقي" : "Documentary"} · {featuredFilm.duration}</p></div>
        </article>}
        <div className="filmRow">
          {films.filter((f) => f !== featuredFilm).map((f, i) => <article className="miniFilm visualEditableCard" key={f.id ?? `${f.title}-${i}`}>
            {itemButton(f)}{f.cover_url && <img src={f.cover_url} alt={f.title}/>}<div><strong>{lang === "ar" && f.title_ar ? f.title_ar : f.title}</strong><span>{f.year} · {f.duration}</span></div>
          </article>)}
        </div>
        {addButton("film", lang === "ar" ? "إضافة فيلم أو وثائقي" : "Add film / documentary")}
      </section>
    ),
    applications: (
      <section id="applications" className={`section ${surfaceClass(settings.sections.applications.surface)}`} key="applications">
        {editButton(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "section", key: "applications" })}
        <SectionTitle title={settings.sections.applications.title[lang]} subtitle={settings.sections.applications.subtitle[lang]} />
        <div className="projectGrid">
          {projects.map((p, i) => <article className="projectCard visualEditableCard" key={p.id ?? `${p.title}-${i}`}>
            {itemButton(p)}{p.cover_url ? <div className="projectVisual projectImage" style={{ backgroundImage: `url('${p.cover_url}')` }} /> : <div className={`projectVisual v${(i % 4) + 1}`}><span>{p.title.slice(0, 1)}</span></div>}
            <div className="projectBody"><div className="projectTop"><h3>{lang === "ar" && p.title_ar ? p.title_ar : p.title}</h3>{p.external_url ? <a href={p.external_url} target="_blank" rel="noreferrer">↗</a> : <span>↗</span>}</div><small>{p.subtitle}</small><p>{p.description}</p><div className="tags">{(p.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          </article>)}
        </div>
        {addButton("application", lang === "ar" ? "إضافة تطبيق أو مشروع" : "Add application / project")}
      </section>
    ),
    other: (
      <section id="other" className={`section ${surfaceClass(settings.sections.other.surface)}`} key="other">
        {editButton(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "section", key: "other" })}
        <SectionTitle title={settings.sections.other.title[lang]} subtitle={settings.sections.other.subtitle[lang]} />
        <div className="creativeStrip">
          {creative.map((item, i) => <article className="creativeTile visualEditableCard" key={item.id ?? `${item.title}-${i}`} style={{ backgroundImage: `url('${item.cover_url ?? ""}')` }}>{itemButton(item)}<span>{lang === "ar" && item.title_ar ? item.title_ar : item.title}</span></article>)}
        </div>
        {addButton("creative", lang === "ar" ? "إضافة عمل إبداعي" : "Add creative work")}
      </section>
    ),
    about: (
      <section id="about" className={`aboutSection ${surfaceClass(settings.sections.about.surface)}`} key="about">
        {editButton(lang === "ar" ? "تعديل عني" : "Edit About", { type: "about" })}
        <div className="aboutPortrait" style={settings.about.imageUrl ? { backgroundImage: `url('${settings.about.imageUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}><div className="portraitGlow"/>{!settings.about.imageUrl && <div className="portraitLetter">{settings.brand.letter || "R"}</div>}</div>
        <div className="aboutCopy"><p className="eyebrow">{settings.about.eyebrow}</p><h2>{settings.sections.about.title[lang]}</h2><p>{settings.about.text[lang]}</p><div className="stats">{settings.about.stats.map((stat, index) => <div key={index}><strong>{stat.title[lang]}</strong><span>{stat.subtitle[lang]}</span></div>)}</div></div>
      </section>
    ),
    contact: (
      <section id="contact" className={`contactSection ${surfaceClass(settings.sections.contact.surface)}`} key="contact">
        {editButton(lang === "ar" ? "تعديل التواصل" : "Edit Contact", { type: "contact" })}
        <div><p className="eyebrow">{settings.contact.eyebrow[lang]}</p><h2>{settings.sections.contact.title[lang]}</h2><p>{settings.sections.contact.subtitle[lang]}</p></div>
        <div className="contactGrid">
          {settings.contact.email && <a href={`mailto:${settings.contact.email}`}>Email <span>↗</span></a>}
          {settings.contact.instagram && <a href={settings.contact.instagram} target="_blank" rel="noreferrer">Instagram <span>↗</span></a>}
          {settings.contact.youtube && <a href={settings.contact.youtube} target="_blank" rel="noreferrer">YouTube <span>↗</span></a>}
          {settings.contact.github && <a href={settings.contact.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a>}
          {settings.contact.customLinks.filter((link) => link.url).map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer">{link.label[lang]} <span>↗</span></a>)}
        </div>
      </section>
    ),
  };

  return (
    <main dir={dir} style={mainStyle} className={editor?.enabled ? "visualEditorSite" : undefined}>
      {settings.header.enabled && <header className={`navShell ${settings.header.sticky ? "" : "navNotSticky"}`}>
        {editButton(lang === "ar" ? "الشعار والقائمة" : "Brand & navigation", { type: "brand" })}
        <a href="#home" className="brand"><BrandLogo settings={settings} /><span>{settings.brand.showName && <strong>{settings.hero.name}</strong>}{settings.brand.showAlias && <small>{settings.hero.alias}</small>}</span></a>
        <nav className="desktopNav">
          <a href="#home">{settings.hero.homeNav[lang]}</a>
          {navSections.map((entry) => <a key={entry.id} href={`#${entry.id}`}>{entry.nav[lang]}</a>)}
        </nav>
        {settings.header.showLanguageSwitch && <button className="langBtn" onClick={() => !forcedLang && setLocalLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>}
      </header>}

      {settings.hero.enabled && <section id="home" className="hero sectionDark" style={settings.hero.backgroundUrl ? { backgroundImage: `url('${settings.hero.backgroundUrl}')` } : undefined}>
        {editButton(lang === "ar" ? "تعديل الواجهة" : "Edit hero", { type: "hero" })}
        <div className="heroOverlay" />
        <div className="heroContent">
          <p className="eyebrow">{settings.hero.name.toUpperCase()}</p><h1>{settings.hero.heading}</h1><h2>{settings.hero.kicker[lang]}</h2><p className="heroMeta">{settings.hero.subtitle[lang]}</p>
          <div className="heroActions">
            {targetEnabled(settings, settings.hero.primaryTarget) && <a className="primaryBtn" href={`#${settings.hero.primaryTarget}`}>{settings.hero.primaryButton[lang]}</a>}
            {targetEnabled(settings, settings.hero.secondaryTarget) && <a className="ghostBtn" href={`#${settings.hero.secondaryTarget}`}><span className="play">▶</span>{settings.hero.secondaryButton[lang]}</a>}
          </div>
        </div>
        <div className="heroStamp"><span>{settings.hero.stampTop[lang]}</span><strong>{settings.hero.stampMiddle[lang]}</strong><span>{settings.hero.stampBottom[lang]}</span></div>
      </section>}

      {ordered.map((entry) => entry.kind === "builtin" ? sectionNodes[entry.id] : <CustomSectionNode key={entry.id} section={settings.customSections.find((s) => s.id === entry.id)!} lang={lang} editButton={editButton} />)}

      {settings.footer.enabled && <footer className="visualFooter">{editButton(lang === "ar" ? "تعديل التذييل" : "Edit footer", { type: "footer" })}<div className="brand"><BrandLogo settings={settings}/><span>{settings.brand.showName && <strong>{settings.hero.name}</strong>}{settings.brand.showAlias && <small>{settings.hero.alias}</small>}</span></div><span>{settings.footer.text[lang]}</span></footer>}
      {editor?.enabled && editor.controlsVisible && <button className="visualThemeButton" type="button" onClick={() => editor.onEdit({ type: "theme" })}>◐ {lang === "ar" ? "المظهر والألوان" : "Theme & colors"}</button>}
    </main>
  );
}

function BrandLogo({ settings }: { settings: SiteConfig }) {
  if (settings.brand.logoType === "image" && settings.brand.logoUrl) return <span className="brandImageWrap"><img src={settings.brand.logoUrl} alt="Logo" className="brandImage" /></span>;
  return <span className="brandMark">{settings.brand.letter || "R"}</span>;
}

function CustomSectionNode({ section, lang, editButton }: { section: CustomSection; lang: Lang; editButton: (label: string, target: VisualEditTarget) => ReactNode }) {
  return <section id={section.id} className={`section customContentSection ${surfaceClass(section.surface)}`}>
    {editButton(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "custom-section", id: section.id })}
    <SectionTitle title={section.title[lang]} subtitle={section.subtitle[lang]} />
    <div className={`customSectionBody ${section.layout}`}>
      {section.imageUrl && <img src={section.imageUrl} alt="" />}
      <div className="customSectionText">{section.body[lang].split("\n").map((line, index) => <p key={index}>{line || <>&nbsp;</>}</p>)}</div>
    </div>
  </section>;
}

function targetEnabled(settings: SiteConfig, id: string) {
  if (sectionKeys.includes(id as SiteSectionKey)) return settings.sections[id as SiteSectionKey].enabled;
  return settings.customSections.some((section) => section.id === id && section.enabled);
}

function surfaceClass(surface?: string) {
  if (surface === "accent") return "sectionAccent";
  return surface === "black" ? "sectionBlack" : "sectionDark";
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="sectionHead"><div><div className="sectionLine"/><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><span className="index">ROVER / PORTFOLIO</span></div>;
}
