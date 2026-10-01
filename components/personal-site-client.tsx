"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PortfolioItem, PortfolioKind } from "../lib/content";
import { personalSectionKeys, type CustomSectionSettings, type Lang, type PersonalSectionKey, type PersonalSiteConfig } from "../lib/personal-site";

type SiteMode = "day" | "night";

export type PersonalEditTarget =
  | { type: "brand" }
  | { type: "theme" }
  | { type: "hero" }
  | { type: "sections" }
  | { type: "section"; key: PersonalSectionKey }
  | { type: "customSection"; id: string }
  | { type: "about" }
  | { type: "contact" }
  | { type: "footer" };

export type PersonalEditorBridge = {
  enabled: boolean;
  controlsVisible: boolean;
  onEdit: (target: PersonalEditTarget) => void;
  onEditItem: (item: PortfolioItem) => void;
  onAddItem: (kind: PortfolioKind) => void;
};

export function PersonalSiteClient({
  items,
  settings,
  editor,
  forcedLang,
}: {
  items: PortfolioItem[];
  settings: PersonalSiteConfig;
  editor?: PersonalEditorBridge;
  forcedLang?: Lang;
}) {
  const [localLang, setLocalLang] = useState<Lang>(forcedLang ?? "en");
  const [siteMode, setSiteMode] = useState<SiteMode>("day");
  const [openMusic, setOpenMusic] = useState<string | null>(null);
  const [spotifyFallbackKey, setSpotifyFallbackKey] = useState<string | null>(null);
  const spotifyControllersRef = useRef<Map<string, any>>(new Map());
  const spotifyPendingPlayRef = useRef<string | null>(null);
  const spotifyPlayingRef = useRef<string | null>(null);
  const spotifyAttemptRef = useRef(0);
  const [activeAlbumKey, setActiveAlbumKey] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<PortfolioItem | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<PersonalSectionKey | null>(null);
  const [expandedCustomSection, setExpandedCustomSection] = useState<string | null>(null);
  const lang = forcedLang ?? localLang;
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rover-site-mode");
      if (saved === "day" || saved === "night") setSiteMode(saved);
    } catch {}
  }, []);

  const toggleSiteMode = () => {
    setSiteMode((current) => {
      const next: SiteMode = current === "day" ? "night" : "day";
      try { window.localStorage.setItem("rover-site-mode", next); } catch {}
      return next;
    });
  };

  const pauseSpotifyControllers = (exceptKey?: string) => {
    spotifyControllersRef.current.forEach((controller, key) => {
      if (key === exceptKey) return;
      try { controller?.pause?.(); } catch {}
    });
  };

  const registerSpotifyController = (key: string, controller: any | null) => {
    if (!controller) {
      spotifyControllersRef.current.delete(key);
      return;
    }
    spotifyControllersRef.current.set(key, controller);
    if (spotifyPendingPlayRef.current === key) {
      spotifyPendingPlayRef.current = null;
      try { controller.play?.(); } catch { setSpotifyFallbackKey(key); }
    }
  };

  const markSpotifyStarted = (key: string) => {
    spotifyPlayingRef.current = key;
    setSpotifyFallbackKey((current) => current === key ? null : current);
    setOpenMusic(key);
  };

  const toggleSpotifyPlayback = (key: string) => {
    const isActive = openMusic === key;
    const attempt = ++spotifyAttemptRef.current;
    const controller = spotifyControllersRef.current.get(key);

    if (isActive) {
      spotifyPendingPlayRef.current = null;
      spotifyPlayingRef.current = null;
      try { controller?.pause?.(); } catch {}
      setSpotifyFallbackKey(null);
      setOpenMusic(null);
      return;
    }

    pauseSpotifyControllers(key);
    spotifyPlayingRef.current = null;
    spotifyPendingPlayRef.current = controller ? null : key;
    setSpotifyFallbackKey(null);
    setOpenMusic(key);

    if (controller) {
      try { controller.play?.(); } catch { setSpotifyFallbackKey(key); }
    }

    window.setTimeout(() => {
      if (spotifyAttemptRef.current === attempt && spotifyPlayingRef.current !== key) {
        setSpotifyFallbackKey(key);
      }
    }, 1500);
  };

  const byKind = (kind: PortfolioKind) => items.filter((item) => item.kind === kind && item.is_published !== false);
  const photos = byKind("photo");
  const videos = byKind("video");
  const movies = byKind("movie");
  const music = byKind("music");
  const games = byKind("game");
  const photoAlbums = groupPhotoAlbums(photos, lang);
  const activeAlbum = photoAlbums.find((album) => album.key === activeAlbumKey) ?? null;
  const customSections = settings.customSections ?? [];

  const ordered = useMemo(
    () => personalSectionKeys
      .filter((key) => key !== "about" && settings.sections[key].enabled)
      .sort((a, b) => settings.sections[a].order - settings.sections[b].order),
    [settings.sections],
  );

  const nav = [
    ...ordered
      .filter((key) => settings.sections[key].showInNav)
      .map((key) => ({ id: key, label: settings.sections[key].nav[lang], order: settings.sections[key].order })),
    ...customSections
      .filter((section) => section.enabled && section.showInNav)
      .map((section) => ({ id: section.id, label: section.nav[lang], order: section.order })),
  ].sort((a, b) => a.order - b.order);
  const activeSiteBackground = siteMode === "night"
    ? ((settings.theme as any).nightBackgroundUrl || (settings.theme as any).backgroundUrl || "")
    : ((settings.theme as any).backgroundUrl || "");

  const style = {
    "--v6-accent": settings.theme.accentColor,
    "--v6-bg": settings.theme.backgroundColor,
    "--v6-bg2": settings.theme.alternateBackgroundColor,
    "--v6-panel": settings.theme.panelColor,
    "--v6-text": settings.theme.textColor,
    "--v6-muted": settings.theme.mutedColor,
    "--v6-line": settings.theme.lineColor,
    "--v6-radius": `${settings.theme.radius}px`,
    "--v6-site-bg-url": activeSiteBackground ? `url("${activeSiteBackground}")` : "none",
  } as CSSProperties;

  const sectionVisual = (key: PersonalSectionKey) => ((settings.sections[key] as any).style ?? {}) as any;
  const sectionPreset = (key: PersonalSectionKey) => sectionVisual(key).backgroundPreset || "inherit";
  const fallbackSectionBackground = (key: PersonalSectionKey) => {
    if (key === "photos") return photoAlbums[0]?.items[0]?.cover_url || "";
    if (key === "videos") return videos[0] ? videoPoster(videos[0]) : "";
    if (key === "movies") return movies[0]?.cover_url || "";
    if (key === "music") return music[0]?.cover_url || "";
    if (key === "games") return games[0]?.cover_url || "";
    return "";
  };

  const sectionStyle = (key: PersonalSectionKey) => {
    const visual = sectionVisual(key);
    const backgroundUrl = siteMode === "night"
      ? (visual.nightBackgroundUrl || visual.backgroundUrl || fallbackSectionBackground(key))
      : (visual.backgroundUrl || fallbackSectionBackground(key));
    return {
      ...(visual.backgroundColor ? { backgroundColor: visual.backgroundColor } : {}),
      ...(backgroundUrl ? { backgroundImage: `url("${backgroundUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
      ...(visual.textColor ? { "--v6-text": visual.textColor } : {}),
      ...(visual.accentColor ? { "--v6-accent": visual.accentColor } : {}),
      ...(visual.panelColor ? { "--v6-panel": visual.panelColor } : {}),
      ...(visual.buttonColor ? { "--v6-button": visual.buttonColor } : {}),
    } as CSSProperties;
  };
  const customSectionStyle = (section: CustomSectionSettings) => {
    const visual = section.style ?? {};
    return {
      ...(visual.backgroundColor ? { backgroundColor: visual.backgroundColor } : {}),
      ...((siteMode === "night" ? (visual.nightBackgroundUrl || visual.backgroundUrl) : visual.backgroundUrl)
        ? { backgroundImage: `url("${siteMode === "night" ? (visual.nightBackgroundUrl || visual.backgroundUrl) : visual.backgroundUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
        : {}),
      ...(visual.textColor ? { "--v6-text": visual.textColor } : {}),
      ...(visual.accentColor ? { "--v6-accent": visual.accentColor } : {}),
      ...(visual.panelColor ? { "--v6-panel": visual.panelColor } : {}),
      ...(visual.buttonColor ? { "--v6-button": visual.buttonColor } : {}),
    } as CSSProperties;
  };


  const edit = (label: string, target: PersonalEditTarget) => editor?.enabled && editor.controlsVisible ? (
    <button className="v6Edit" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.onEdit(target); }}>✎ {label}</button>
  ) : null;

  const editItem = (item: PortfolioItem) => editor?.enabled && editor.controlsVisible ? (
    <button className="v6EditItem" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.onEditItem(item); }}>✎</button>
  ) : null;

  const add = (kind: PortfolioKind, ar: string, en: string) => editor?.enabled && editor.controlsVisible ? (
    <button className="v6Add" type="button" onClick={() => editor.onAddItem(kind)}>＋ {lang === "ar" ? ar : en}</button>
  ) : null;

  const toggleMobileSection = (key: PersonalSectionKey, event: any) => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 720px)").matches) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select,iframe,audio,video,.v6AlbumCard,.v6VideoCompactCard,.v6PosterCard,.v6MusicCard,.v6GameCard")) return;

    setExpandedSection((current) => current === key ? null : key);
  };
  const toggleMobileCustomSection = (id: string, event: any) => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 720px)").matches) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select,iframe,audio,video")) return;
    setExpandedCustomSection((current) => current === id ? null : id);
  };


  const titleFor = (item: PortfolioItem) => lang === "ar" && item.title_ar ? item.title_ar : item.title;
  const subtitleFor = (item: PortfolioItem) => lang === "ar" && item.subtitle_ar ? item.subtitle_ar : item.subtitle;
  const descriptionFor = (item: PortfolioItem) => lang === "ar" && item.description_ar ? item.description_ar : item.description;

  const sectionNumber: Partial<Record<PersonalSectionKey, string>> = {
    photos: "01",
    videos: "02",
    movies: "03",
    music: "04",
    games: "05",
    contact: "06",
  };

  const sectionTitle = (key: PersonalSectionKey) => (
    <div className="v6SectionHead">
      <div>
        <span className="v15SectionNumber">{sectionNumber[key] || ""}</span>
        <span className="v15SectionEyebrow">ROVER / {settings.sections[key].nav[lang]}</span>
        <h2>{settings.sections[key].title[lang]}</h2>
        <p>{settings.sections[key].subtitle[lang]}</p>
      </div>
      {edit(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "section", key })}
    </div>
  );

  const customSectionNode = (section: CustomSectionSettings) => (
    <section
      id={section.id}
      key={section.id}
      className={`v6Section v6CustomSection ${expandedCustomSection === section.id ? "v15MobileExpanded" : ""}`}
      style={customSectionStyle(section)}
      onClick={(event) => toggleMobileCustomSection(section.id, event)}
    >
      <div className="v6SectionHead">
        <div>
          <span className="v15SectionNumber">{String(section.order).padStart(2, "0")}</span>
          <span className="v15SectionEyebrow">ROVER / {section.nav[lang]}</span>
          <h2>{section.title[lang]}</h2>
          <p>{section.subtitle[lang]}</p>
        </div>
        {edit(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "customSection", id: section.id })}
      </div>
      <div className="v6CustomSectionBody">
        {section.body[lang] && <p>{section.body[lang]}</p>}
        {section.buttonUrl && section.buttonLabel[lang] && <a href={section.buttonUrl} target="_blank" rel="noreferrer">{section.buttonLabel[lang]} ↗</a>}
      </div>
    </section>
  );

  const nodes: Record<PersonalSectionKey, ReactNode> = {
    photos: (
      <section id="photos" className={`v6Section v6Dark ${expandedSection === "photos" ? "v15MobileExpanded" : ""}`} key="photos" data-v6-bg={sectionPreset("photos")} style={sectionStyle("photos")} onClick={(event) => toggleMobileSection("photos", event)}>
        {sectionTitle("photos")}
        <div className="v6AlbumGrid">
          {photoAlbums.map((album) => {
            const cover = album.items[0];
            return <article
              className="v6AlbumCard"
              key={album.key}
              role="button"
              tabIndex={0}
              onClick={() => setActiveAlbumKey(album.key)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveAlbumKey(album.key); }}
            >
              {editItem(cover)}
              <div className="v6AlbumCover">
                {cover?.cover_url ? <img src={cover.cover_url} alt={album.title} /> : <div className="v6Placeholder">PHOTO</div>}
                <span className="v6OwnershipMark" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg><span>rover7z</span></span>
                <span className="v6AlbumCount">{album.items.length} {lang === "ar" ? (album.items.length === 1 ? "صورة" : "صور") : (album.items.length === 1 ? "photo" : "photos")}</span>
              </div>
              <div className="v6AlbumCaption">
                <div><strong>{album.title}</strong><small>{lang === "ar" ? "فتح الألبوم" : "Open album"}</small></div>
                <span>↗</span>
              </div>
            </article>;
          })}
        </div>
        {add("photo", "إضافة صورة", "Add photo")}
        {!photos.length && <Empty lang={lang} textAr="أضف صورك، واكتب نفس اسم الألبوم للصور التي تريد جمعها معاً." textEn="Add photos and use the same album name to group them together." />}
      </section>
    ),
    videos: (
      <section id="videos" className={`v6Section v6Black ${expandedSection === "videos" ? "v15MobileExpanded" : ""}`} key="videos" data-v6-bg={sectionPreset("videos")} style={sectionStyle("videos")} onClick={(event) => toggleMobileSection("videos", event)}>
        {sectionTitle("videos")}
        <div className="v6VideoCompactGrid">
          {videos.map((item, i) => {
            const thumb = videoPoster(item);
            return <article
              className="v6VideoCompactCard"
              key={item.id ?? `${item.title}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => setActiveVideo(item)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveVideo(item); }}
            >
              {editItem(item)}
              <div className="v6VideoThumb">
                {thumb ? <img src={thumb} alt={titleFor(item)} /> : <div className="v6Placeholder">VIDEO</div>}
                <span className="v6OwnershipMark" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg><span>rover7z</span></span>
                <span className="v6VideoPlay">▶</span>
                {item.duration && <small className="v6VideoDuration">{item.duration}</small>}
              </div>
              <div className="v6VideoCompactBody">
                <h3>{titleFor(item)}</h3>
                <div>{item.year && <span>{item.year}</span>}{item.category && <span>{item.category}</span>}</div>
              </div>
            </article>;
          })}
        </div>
        {add("video", "إضافة فيديو", "Add video")}
        {!videos.length && <Empty lang={lang} textAr="أضف فيديوهاتك من هنا." textEn="Add your videos here." />}
      </section>
    ),
    movies: (
      <section id="movies" className={`v6Section v6Dark ${expandedSection === "movies" ? "v15MobileExpanded" : ""}`} key="movies" data-v6-bg={sectionPreset("movies")} style={sectionStyle("movies")} onClick={(event) => toggleMobileSection("movies", event)}>
        {sectionTitle("movies")}
        <div className="v6PosterGrid">
          {movies.map((item, i) => (
            <article className="v6PosterCard" key={item.id ?? `${item.title}-${i}`}>
              {editItem(item)}
              <div className="v6PosterVisual">{item.cover_url ? <img src={item.cover_url} alt={titleFor(item)} /> : <div className="v6Placeholder">MOVIE</div>}</div>
              <div className="v6PosterBody">{item.category && <small>{item.category}</small>}{item.rating !== null && item.rating !== undefined && <span className="v6Rating">★ Rover {Number(item.rating).toFixed(1)}/10</span>}{item.source_rating_text ? <span className="v6Rating">★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span> : null}<h3>{titleFor(item)}</h3>{descriptionFor(item) && <p>{descriptionFor(item)}</p>}{item.external_url && <a className="v6External" href={item.external_url} target="_blank" rel="noreferrer">{item.category ? (lang === "ar" ? `افتح على ${item.category}` : `Open on ${item.category}`) : (lang === "ar" ? "فتح رابط الفيلم" : "Open movie link")} ↗</a>}</div>
            </article>
          ))}
        </div>
        {add("movie", "إضافة فيلم", "Add movie")}
        {!movies.length && <Empty lang={lang} textAr="أضف أفلامك المفضلة وصور الأغلفة وروابط Netflix." textEn="Add favorite movies, posters, and Netflix links." />}
      </section>
    ),
    music: (
      <section id="music" className={`v6Section v6Black ${expandedSection === "music" ? "v15MobileExpanded" : ""}`} key="music" data-v6-bg={sectionPreset("music")} style={sectionStyle("music")} onClick={(event) => toggleMobileSection("music", event)}>
        {sectionTitle("music")}
        <div className="v6MusicGrid">
          {music.map((item, i) => {
            const cardKey = item.id ?? `${item.title}-${i}`;
            const spotify = spotifyEmbed(item.external_url ?? "");
            const embed = musicEmbed(item.external_url ?? "", true);
            const isOpen = openMusic === cardKey;
            return <article className="v6MusicCard" key={cardKey}>
              {editItem(item)}
              <div className="v6MusicCover">
                {item.cover_url ? <img src={item.cover_url} alt={titleFor(item)} /> : <div className="v6Placeholder">♪</div>}
                {item.category && <span className="v6MusicPlatform">{item.category}</span>}
                {(spotify || embed || item.video_url) && <button
                  className="v6MusicPlay"
                  type="button"
                  aria-label={isOpen ? (lang === "ar" ? "إيقاف الأغنية مؤقتاً" : "Pause song") : (lang === "ar" ? "تشغيل الأغنية" : "Play song")}
                  onClick={() => {
                    if (spotify) {
                      toggleSpotifyPlayback(cardKey);
                      return;
                    }
                    spotifyAttemptRef.current += 1;
                    spotifyPendingPlayRef.current = null;
                    spotifyPlayingRef.current = null;
                    pauseSpotifyControllers();
                    setSpotifyFallbackKey(null);
                    setOpenMusic(isOpen ? null : cardKey);
                  }}
                >{isOpen ? "❚❚" : "▶"}</button>}
              </div>
              <div className="v6MusicBody">
                <h3>{titleFor(item)}</h3>
                {subtitleFor(item) && <p className="v6MusicArtist">{subtitleFor(item)}</p>}
                <div className="v6MusicMeta">
                  {item.year && <span>{item.year}</span>}
                  {item.source_rating_text && <span>★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span>}
                </div>
                {spotify && <SpotifyInlinePlayer
                  url={item.external_url ?? ""}
                  title={titleFor(item)}
                  playerKey={cardKey}
                  showFallback={isOpen && spotifyFallbackKey === cardKey}
                  onController={registerSpotifyController}
                  onStarted={markSpotifyStarted}
                />}
                {isOpen && !spotify && embed && <iframe className="v6MusicMiniPlayer" src={embed} width="100%" height="160" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title={titleFor(item)} />}
                {isOpen && !spotify && !embed && item.video_url && <audio className="v6MusicAudio" controls autoPlay preload="none" src={item.video_url} />}
                {item.external_url && <a className="v6External v6MusicVisit" href={item.external_url} target="_blank" rel="noreferrer">{lang === "ar" ? "زيارة المنصة" : "Visit platform"} ↗</a>}
              </div>
            </article>;
          })}
        </div>
        {add("music", "إضافة أغنية", "Add song")}
        {!music.length && <Empty lang={lang} textAr="أضف أغانيك وروابط المنصات، وشغّلها من داخل الموقع." textEn="Add songs and platform links with in-site playback." />}
      </section>
    ),
    games: (
      <section id="games" className={`v6Section v6Dark ${expandedSection === "games" ? "v15MobileExpanded" : ""}`} key="games" data-v6-bg={sectionPreset("games")} style={sectionStyle("games")} onClick={(event) => toggleMobileSection("games", event)}>
        {sectionTitle("games")}
        <div className="v6GameGrid">
          {games.map((item, i) => (
            <article className="v6GameCard" key={item.id ?? `${item.title}-${i}`}>
              {editItem(item)}
              <div className="v6GameVisual">
                {item.cover_url ? <img src={item.cover_url} alt={titleFor(item)} /> : <div className="v6Placeholder">GAME</div>}
                <div className="v6GameBadges">
                  {item.category && <span>{item.category}</span>}
                  {item.source_rating_text && <span>★ {item.source_rating_text}</span>}
                </div>
              </div>
              <div className="v6GameInfo">
                <h3>{titleFor(item)}</h3>
                {descriptionFor(item) && <p>{descriptionFor(item)}</p>}
                <div className="v6GameFooter">
                  {item.year && <small>{item.year}</small>}
                  {item.external_url && <a className="v6External" href={item.external_url} target="_blank" rel="noreferrer">{lang === "ar" ? "زيارة اللعبة" : "View game"} ↗</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
        {add("game", "إضافة لعبة", "Add game")}
        {!games.length && <Empty lang={lang} textAr="أضف ألعابك وصورها وروابط Steam أو PlayStation أو Google Play وغيرها." textEn="Add games with images and Steam, PlayStation, Google Play, or other links." />}
      </section>
    ),
    about: null,
    contact: (
      <section id="contact" className={`v6Contact ${expandedSection === "contact" ? "v15MobileExpanded" : ""}`} key="contact" data-v6-bg={sectionPreset("contact")} style={sectionStyle("contact")} onClick={(event) => toggleMobileSection("contact", event)}>
        {edit(lang === "ar" ? "تعديل التواصل" : "Edit contact", { type: "contact" })}
        <div><span>{settings.contact.eyebrow[lang]}</span><h2>{settings.sections.contact.title[lang]}</h2><p>{settings.sections.contact.subtitle[lang]}</p></div>
        <div className="v6ContactLinks">
          {settings.contact.email && <a href={`mailto:${settings.contact.email}`}>Email ↗</a>}
          {settings.contact.instagram && <a href={settings.contact.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}
          {settings.contact.youtube && <a href={settings.contact.youtube} target="_blank" rel="noreferrer">YouTube ↗</a>}
          {settings.contact.github && <a href={settings.contact.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
          {settings.contact.customLinks.filter((x) => x.url).map((x, i) => <a key={i} href={x.url} target="_blank" rel="noreferrer">{x.label[lang]} ↗</a>)}
        </div>
      </section>
    ),
  };

  const worldNodes = [
    ...ordered.map((key) => ({ id: key, order: settings.sections[key].order, node: nodes[key] })),
    ...customSections.filter((section) => section.enabled).map((section) => ({
      id: section.id,
      order: section.order,
      node: customSectionNode(section),
    })),
  ].sort((a, b) => a.order - b.order);

  const heroBackgroundUrl = siteMode === "night"
    ? ((settings.hero as any).nightBackgroundUrl || settings.hero.backgroundUrl)
    : settings.hero.backgroundUrl;

  return <main className={`v6Site ${editor?.enabled ? "v6Editing" : ""}`} dir={dir} style={style} data-v6-site-bg={(settings.theme as any).backgroundPreset || "none"} data-v18-theme={siteMode} onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()}>
    {settings.header.enabled && <header className={`v6Nav ${settings.header.sticky ? "sticky" : ""}`}>
      {edit(lang === "ar" ? "الشعار والقائمة" : "Brand & navigation", { type: "brand" })}
      <a className="v6Brand" href="#home"><Logo settings={settings} /><span>{settings.brand.showName && <strong>{settings.hero.name}</strong>}{settings.brand.showAlias && <small>{settings.hero.alias}</small>}</span></a>
      <nav><a href="#home">{settings.hero.homeNav[lang]}</a>{nav.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav>
      <div className="v18HeaderTools">
        {settings.header.showLanguageSwitch && <button className="v6Lang" onClick={() => !forcedLang && setLocalLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>}
        <button
          className="v18ThemeToggle"
          type="button"
          onClick={toggleSiteMode}
          aria-label={siteMode === "day" ? (lang === "ar" ? "تفعيل المظهر الليلي" : "Switch to night mode") : (lang === "ar" ? "تفعيل المظهر النهاري" : "Switch to day mode")}
          title={siteMode === "day" ? (lang === "ar" ? "المظهر الليلي" : "Night mode") : (lang === "ar" ? "المظهر النهاري" : "Day mode")}
        >
          <svg viewBox="0 0 28 28" aria-hidden="true">
            <circle className="v18OrbitRing" cx="14" cy="14" r="7.2" />
            <path className="v18OrbitShade" d="M14 6.8a7.2 7.2 0 0 1 0 14.4c2.15-2.3 3.15-4.7 3.15-7.2S16.15 9.1 14 6.8Z" />
            <ellipse className="v18OrbitPath" cx="14" cy="14" rx="11" ry="4.2" transform="rotate(-28 14 14)" />
          </svg>
          <span className="v18SrOnly">{siteMode === "day" ? "Night" : "Day"}</span>
        </button>
      </div>
    </header>}

    {settings.hero.enabled && <section id="home" className="v6Hero v6HeroProfile" style={heroBackgroundUrl ? { backgroundImage: `url('${heroBackgroundUrl}')` } : undefined}>
      {edit(lang === "ar" ? "تعديل الواجهة" : "Edit hero", { type: "hero" })}
      {edit(lang === "ar" ? "تعديل نبذة عني" : "Edit about", { type: "about" })}
      <div className="v6HeroOverlay" />
      <div className="v6HeroProfileGrid">
        <div className="v6HeroCopy">
          <span>{settings.hero.name.toUpperCase()}</span>
          <h1>{settings.hero.heading}</h1>
          <h2>{settings.hero.kicker[lang]}</h2>
          <p>{settings.hero.subtitle[lang]}</p>

          <div className="v15HeroMediaIcons">
            <a href="#photos" aria-label={settings.sections.photos.nav[lang]}>◉</a>
            <a href="#videos" aria-label={settings.sections.videos.nav[lang]}>▶</a>
            <a href="#movies" aria-label={settings.sections.movies.nav[lang]}>▣</a>
            <a href="#music" aria-label={settings.sections.music.nav[lang]}>♫</a>
            <a href="#games" aria-label={settings.sections.games.nav[lang]}>✦</a>
          </div>

          <div className="v15HeroActions">
            <button type="button" className="primary" onClick={() => { setAboutOpen(true); setResumeOpen(true); }}>
              <span>▣</span>{lang === "ar" ? "عرض سيرتي الذاتية" : "View My CV"}
            </button>
            <button type="button" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              <span>➤</span>{lang === "ar" ? "فتح التواصل" : "Open Contact"}
            </button>
          </div>
        </div>
        <aside
          className="v6HeroAboutCard v6HeroAboutCardClickable"
          role="button"
          tabIndex={0}
          aria-label={lang === "ar" ? "فتح النبذة والخبرة" : "Open about and experience"}
          onClick={() => { setAboutOpen(true); setResumeOpen(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setAboutOpen(true);
              setResumeOpen(false);
            }
          }}
        >
          <div className="v6HeroAboutPhoto">
            {settings.about.imageUrl ? <img src={settings.about.imageUrl} alt={settings.hero.name} /> : <div className="v6AboutLetter">{settings.brand.letter || "R"}</div>}
          </div>
          <div className="v6HeroAboutContent">
            <span>{settings.about.eyebrow[lang]}</span>
            <h3>{lang === "ar" ? "نبذة عني" : "About me"}</h3>
            <p>{settings.about.text[lang]}</p>
            {settings.about.experienceText[lang] && <div className="v6HeroExperience">
              <strong>{settings.about.experienceTitle[lang]}</strong>
              <p>{settings.about.experienceText[lang]}</p>
            </div>}
            <small className="v6AboutExpandHint">{lang === "ar" ? "اضغط للتكبير وقراءة التفاصيل" : "Tap to expand and read more"} ↗</small>
          </div>
        </aside>

        <button className="v15Availability" type="button" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <i />
          <span><strong>{lang === "ar" ? "متاح لفرص العمل" : "Available for Opportunities"}</strong><small>{lang === "ar" ? "متاح للعمل — اضغط للتواصل" : "Open to work — Let's connect"}</small></span>
          <b>›</b>
        </button>
      </div>
      <a className="v6ScrollCue" href="#photos" aria-label={lang === "ar" ? "انتقل للقسم التالي" : "Next section"}>
        <span>{lang === "ar" ? "اسحب للأسفل" : "Scroll down"}</span>
        <b>↓</b>
      </a>
    </section>}

    <div className="v14WorldGrid">{worldNodes.map((entry) => entry.node)}</div>

    {aboutOpen && <div className="v6MediaModal v6AboutModalBackdrop" onClick={() => { setAboutOpen(false); setResumeOpen(false); }}>
      <div className="v6MediaModalPanel v6AboutModalPanel" onClick={(e) => e.stopPropagation()}>
        <button className="v6ModalClose" type="button" onClick={() => { setAboutOpen(false); setResumeOpen(false); }}>×</button>
        <div className="v6AboutModalGrid">
          <div className="v6AboutModalPhoto">
            {settings.about.imageUrl ? <img src={settings.about.imageUrl} alt={settings.hero.name} /> : <div className="v6AboutLetter">{settings.brand.letter || "R"}</div>}
          </div>
          <div className="v6AboutModalContent">
            <span className="v6AboutModalEyebrow">{settings.about.eyebrow[lang]}</span>
            <h2>{lang === "ar" ? "نبذة عني" : "About me"}</h2>
            <p className="v6AboutModalBio">{settings.about.text[lang]}</p>

            {settings.about.experienceText[lang] && <section className="v6AboutModalExperience">
              <span>{settings.about.experienceTitle[lang]}</span>
              <p>{settings.about.experienceText[lang]}</p>
            </section>}

            <button className="v6ResumeToggle" type="button" onClick={() => setResumeOpen((value) => !value)}>
              <span>{lang === "ar" ? "السيرة الذاتية" : "Curriculum Vitae"}</span>
              <strong>{resumeOpen
                ? (lang === "ar" ? "إخفاء السيرة الذاتية" : "Hide CV")
                : (lang === "ar" ? "اضغط لعرض السيرة الذاتية" : "Tap to view my CV")}</strong>
              <b>{resumeOpen ? "−" : "+"}</b>
            </button>

            {resumeOpen && <div className="v6ResumeSheet">
              <header className="v6ResumeHeader">
                <div>
                  <span>ROVER / CV</span>
                  <h3>{settings.hero.name}</h3>
                  <p>{lang === "ar" ? "السياحة والفندقة • المبيعات • إدارة الأعمال" : "Tourism & Hospitality • Sales • Business Operations"}</p>
                </div>
                {settings.contact.email && <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>}
              </header>

              <section className="v6ResumeSection">
                <h4>{lang === "ar" ? "الملخص المهني" : "Professional Profile"}</h4>
                <p>{settings.about.text[lang]}</p>
              </section>

              <section className="v6ResumeSection">
                <h4>{lang === "ar" ? "الخبرة المهنية" : "Professional Experience"}</h4>
                <p className="v6ResumePre">{settings.about.experienceText[lang]}</p>
              </section>

              <section className="v6ResumeTwoCol">
                <div className="v6ResumeSection">
                  <h4>{lang === "ar" ? "التعليم" : "Education"}</h4>
                  <p>{((settings.about as any).resumeEducation?.[lang]) || (lang === "ar"
                    ? "إعدادية كربلاء للسياحة والفندقة المهنية — اختصاص السياحة والفندقة."
                    : "Karbala Vocational Secondary School for Tourism & Hospitality — Tourism and Hotel Studies.")}</p>
                </div>
                <div className="v6ResumeSection">
                  <h4>{lang === "ar" ? "اللغات" : "Languages"}</h4>
                  <p>{((settings.about as any).resumeLanguages?.[lang]) || (lang === "ar"
                    ? "العربية • الإنكليزية • الفارسية"
                    : "Arabic • English • Persian")}</p>
                </div>
              </section>

              <section className="v6ResumeSection">
                <h4>{lang === "ar" ? "المهارات" : "Skills"}</h4>
                <div className="v6ResumeSkills">
                  {((((settings.about as any).resumeSkills?.[lang]) || (lang === "ar"
                    ? "Microsoft Excel\nMicrosoft Word\nمهارات الحاسوب\nالترويج والمبيعات\nإدارة الأعمال\nالعمل تحت الضغط"
                    : "Microsoft Excel\nMicrosoft Word\nComputer skills\nPromotion & sales\nBusiness management\nWorking under pressure")) as string)
                    .split("\n").filter(Boolean).map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              </section>

              {(settings.about as any).resumeFileUrl && <a className="v6ResumePdf" href={(settings.about as any).resumeFileUrl} target="_blank" rel="noreferrer">
                {lang === "ar" ? "فتح نسخة PDF من السيرة الذاتية" : "Open PDF copy of my CV"} ↗
              </a>}

              <button className="v6HireCta" type="button" onClick={() => {
                setAboutOpen(false);
                setResumeOpen(false);
                window.setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
              }}>
                <span>{lang === "ar" ? "متاح للتوظيف" : "Available for work"}</span>
                <strong>{lang === "ar" ? "اضغط للتواصل" : "Tap to contact me"} →</strong>
              </button>
            </div>}
          </div>
        </div>
      </div>
    </div>}

    {activeAlbum && <div className="v6MediaModal" onClick={() => setActiveAlbumKey(null)}>
      <div className="v6MediaModalPanel v6AlbumModal" onClick={(e) => e.stopPropagation()}>
        <button className="v6ModalClose" type="button" onClick={() => setActiveAlbumKey(null)}>×</button>
        <div className="v6ModalHeading"><span>{lang === "ar" ? "ألبوم الصور" : "Photo album"}</span><h3>{activeAlbum.title}</h3><p>{activeAlbum.items.length} {lang === "ar" ? "صور" : "photos"}</p></div>
        <div className="v6AlbumGallery">
          {activeAlbum.items.map((item, i) => <div className="v6AlbumGalleryItem" key={item.id ?? `${item.title}-${i}`}>
            {editItem(item)}
            {item.cover_url ? <img src={item.cover_url} alt={titleFor(item)} draggable={false} /> : <div className="v6Placeholder">PHOTO</div>}
            <span className="v6OwnershipMark" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg><span>rover7z</span></span>
            <div><strong>{titleFor(item)}</strong></div>
          </div>)}
        </div>
      </div>
    </div>}

    {activeVideo && <div className="v6MediaModal" onClick={() => setActiveVideo(null)}>
      <div className="v6MediaModalPanel v6VideoModal" onClick={(e) => e.stopPropagation()}>
        <button className="v6ModalClose" type="button" onClick={() => setActiveVideo(null)}>×</button>
        <div className="v6VideoModalFrame"><VideoPlayer item={activeVideo} title={titleFor(activeVideo)} autoPlay /><span className="v6OwnershipMark" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg><span>rover7z</span></span></div>
        <div className="v6VideoModalInfo"><h3>{titleFor(activeVideo)}</h3>{descriptionFor(activeVideo) && <p>{descriptionFor(activeVideo)}</p>}</div>
      </div>
    </div>}

    {settings.footer.enabled && <footer className="v6Footer">{edit(lang === "ar" ? "تعديل الحقوق" : "Edit footer", { type: "footer" })}<Logo settings={settings} /><span>{settings.footer.text[lang]}</span></footer>}
    {editor?.enabled && editor.controlsVisible && <button className="v6ThemeButton" onClick={() => editor.onEdit({ type: "theme" })}>◐ {lang === "ar" ? "المظهر والألوان" : "Theme & colors"}</button>}
  </main>;
}

function Logo({ settings }: { settings: PersonalSiteConfig }) {
  if (settings.brand.logoType === "image" && settings.brand.logoUrl) return <span className="v6Logo"><img src={settings.brand.logoUrl} alt="Rover" /></span>;
  return <span className="v6Logo letter">{settings.brand.letter || "R"}</span>;
}

function Empty({ lang, textAr, textEn }: { lang: Lang; textAr: string; textEn: string }) {
  return <div className="v6Empty">{lang === "ar" ? textAr : textEn}</div>;
}

function VideoPlayer({ item, title, autoPlay = false }: { item: PortfolioItem; title: string; autoPlay?: boolean }) {
  const source = item.video_url || item.external_url || "";
  const youtube = youtubeEmbed(source, autoPlay);
  if (youtube) return <iframe className="v6VideoPlayer" src={youtube} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  if (source) return <video className="v6VideoPlayer" controls controlsList="nodownload noplaybackrate" disablePictureInPicture autoPlay={autoPlay} playsInline preload="metadata" poster={item.cover_url ?? undefined} src={source} onContextMenu={(event) => event.preventDefault()} />;
  if (item.cover_url) return <img className="v6VideoPlayer" src={item.cover_url} alt={title} />;
  return <div className="v6VideoPlayer v6Placeholder">VIDEO</div>;
}

function youtubeId(url: string) {
  return url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? "";
}

function youtubeEmbed(url: string, autoPlay = false) {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0${autoPlay ? "&autoplay=1" : ""}` : "";
}

function videoPoster(item: PortfolioItem) {
  if (item.cover_url) return item.cover_url;
  const id = youtubeId(item.video_url || item.external_url || "");
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function spotifyEmbed(url: string) {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/);
  return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0` : "";
}

function musicEmbed(url: string, autoPlay = false) {
  if (/open\.spotify\.com/i.test(url)) return "";
  const youtube = youtubeEmbed(url, autoPlay);
  if (youtube) return youtube;
  if (/soundcloud\.com/i.test(url)) return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=${autoPlay ? "true" : "false"}`;
  if (/music\.apple\.com/i.test(url)) return url.replace(/^https?:\/\/music\.apple\.com/i, "https://embed.music.apple.com");
  const deezer = url.match(/deezer\.com\/(?:[a-z]{2}\/)?track\/(\d+)/i);
  if (deezer) return `https://widget.deezer.com/widget/dark/track/${deezer[1]}`;
  return "";
}

let roverSpotifyApiPromise: Promise<any> | null = null;

function loadRoverSpotifyIframeApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("Spotify API requires a browser"));
  const roverWindow = window as any;

  if (roverWindow.__roverSpotifyIframeApi) {
    return Promise.resolve(roverWindow.__roverSpotifyIframeApi);
  }

  if (roverSpotifyApiPromise) return roverSpotifyApiPromise;

  roverSpotifyApiPromise = new Promise((resolve, reject) => {
    const previousReady = roverWindow.onSpotifyIframeApiReady;

    roverWindow.onSpotifyIframeApiReady = (IFrameAPI: any) => {
      roverWindow.__roverSpotifyIframeApi = IFrameAPI;
      try { previousReady?.(IFrameAPI); } catch {}
      resolve(IFrameAPI);
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-rover-spotify-iframe-api="1"]');
    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Spotify iframe API failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.dataset.roverSpotifyIframeApi = "1";
    script.addEventListener("error", () => reject(new Error("Spotify iframe API failed to load")), { once: true });
    document.body.appendChild(script);
  });

  return roverSpotifyApiPromise;
}

function SpotifyInlinePlayer({
  url,
  title,
  playerKey,
  showFallback,
  onController,
  onStarted,
}: {
  url: string;
  title: string;
  playerKey: string;
  showFallback: boolean;
  onController: (key: string, controller: any | null) => void;
  onStarted: (key: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<any | null>(null);
  const createdRef = useRef(false);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadRoverSpotifyIframeApi()
      .then((IFrameAPI) => {
        if (cancelled || createdRef.current || !hostRef.current) return;
        createdRef.current = true;

        IFrameAPI.createController(
          hostRef.current,
          { url, width: "100%", height: 152 },
          (controller: any) => {
            if (cancelled) {
              try { controller?.pause?.(); } catch {}
              return;
            }

            controllerRef.current = controller;
            onController(playerKey, controller);

            try {
              controller.addListener?.("playback_started", () => onStarted(playerKey));
              controller.addListener?.("playback_update", (event: any) => {
                const data = event?.data;
                if (data && data.isPaused === false && data.isBuffering === false) {
                  onStarted(playerKey);
                }
              });
            } catch {}
          },
        );
      })
      .catch(() => {
        if (!cancelled) setApiFailed(true);
      });

    return () => {
      cancelled = true;
      try { controllerRef.current?.pause?.(); } catch {}
      onController(playerKey, null);
    };
  }, [url, playerKey]);

  const src = spotifyEmbed(url);
  if (!src) return null;

  if (apiFailed && showFallback) {
    return <iframe
      className="v6MusicMiniPlayer v6SpotifyStablePlayer v22SpotifyFallbackFrame"
      src={src}
      width="100%"
      height="152"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="eager"
      title={title}
    />;
  }

  return <div
    className={`v22SpotifyEngine ${showFallback ? "v22SpotifyFallback" : ""}`}
    aria-hidden={showFallback ? undefined : true}
  >
    <div ref={hostRef} />
  </div>;
}

function groupPhotoAlbums(items: PortfolioItem[], lang: Lang) {
  const groups = new Map<string, PortfolioItem[]>();
  for (const item of items) {
    const raw = item.category?.trim();
    const key = raw || "__rover_default_album__";
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }
  return [...groups.entries()].map(([key, albumItems]) => ({
    key,
    title: key === "__rover_default_album__" ? (lang === "ar" ? "صوري" : "My Photos") : key,
    items: albumItems,
  }));
}
