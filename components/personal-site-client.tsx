"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PortfolioItem, PortfolioKind } from "../lib/content";
import { personalSectionKeys, type Lang, type PersonalSectionKey, type PersonalSiteConfig } from "../lib/personal-site";

export type PersonalEditTarget =
  | { type: "brand" }
  | { type: "theme" }
  | { type: "hero" }
  | { type: "sections" }
  | { type: "section"; key: PersonalSectionKey }
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
  const [openMusic, setOpenMusic] = useState<string | null>(null);
  const [activeAlbumKey, setActiveAlbumKey] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<PortfolioItem | null>(null);
  const lang = forcedLang ?? localLang;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const byKind = (kind: PortfolioKind) => items.filter((item) => item.kind === kind && item.is_published !== false);
  const photos = byKind("photo");
  const videos = byKind("video");
  const movies = byKind("movie");
  const music = byKind("music");
  const games = byKind("game");
  const photoAlbums = groupPhotoAlbums(photos, lang);
  const activeAlbum = photoAlbums.find((album) => album.key === activeAlbumKey) ?? null;

  const ordered = useMemo(
    () => personalSectionKeys
      .filter((key) => key !== "about" && settings.sections[key].enabled)
      .sort((a, b) => settings.sections[a].order - settings.sections[b].order),
    [settings.sections],
  );

  const nav = ordered.filter((key) => settings.sections[key].showInNav);
  const style = {
    "--v6-accent": settings.theme.accentColor,
    "--v6-bg": settings.theme.backgroundColor,
    "--v6-bg2": settings.theme.alternateBackgroundColor,
    "--v6-panel": settings.theme.panelColor,
    "--v6-text": settings.theme.textColor,
    "--v6-muted": settings.theme.mutedColor,
    "--v6-line": settings.theme.lineColor,
    "--v6-radius": `${settings.theme.radius}px`,
  } as CSSProperties;

  const edit = (label: string, target: PersonalEditTarget) => editor?.enabled && editor.controlsVisible ? (
    <button className="v6Edit" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.onEdit(target); }}>✎ {label}</button>
  ) : null;

  const editItem = (item: PortfolioItem) => editor?.enabled && editor.controlsVisible ? (
    <button className="v6EditItem" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.onEditItem(item); }}>✎</button>
  ) : null;

  const add = (kind: PortfolioKind, ar: string, en: string) => editor?.enabled && editor.controlsVisible ? (
    <button className="v6Add" type="button" onClick={() => editor.onAddItem(kind)}>＋ {lang === "ar" ? ar : en}</button>
  ) : null;

  const titleFor = (item: PortfolioItem) => lang === "ar" && item.title_ar ? item.title_ar : item.title;
  const subtitleFor = (item: PortfolioItem) => lang === "ar" && item.subtitle_ar ? item.subtitle_ar : item.subtitle;
  const descriptionFor = (item: PortfolioItem) => lang === "ar" && item.description_ar ? item.description_ar : item.description;

  const sectionTitle = (key: PersonalSectionKey) => (
    <div className="v6SectionHead">
      <div><span>ROVER / {settings.sections[key].nav[lang]}</span><h2>{settings.sections[key].title[lang]}</h2><p>{settings.sections[key].subtitle[lang]}</p></div>
      {edit(lang === "ar" ? "تعديل القسم" : "Edit section", { type: "section", key })}
    </div>
  );

  const nodes: Record<PersonalSectionKey, ReactNode> = {
    photos: (
      <section id="photos" className="v6Section v6Dark" key="photos">
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
      <section id="videos" className="v6Section v6Black" key="videos">
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
      <section id="movies" className="v6Section v6Dark" key="movies">
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
      <section id="music" className="v6Section v6Black" key="music">
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
                {(spotify || embed || item.video_url) && <button className="v6MusicPlay" type="button" aria-label={lang === "ar" ? "تشغيل الأغنية" : "Play song"} onClick={() => setOpenMusic(isOpen ? null : cardKey)}>{isOpen ? "×" : "▶"}</button>}
              </div>
              <div className="v6MusicBody">
                <h3>{titleFor(item)}</h3>
                {subtitleFor(item) && <p className="v6MusicArtist">{subtitleFor(item)}</p>}
                <div className="v6MusicMeta">
                  {item.year && <span>{item.year}</span>}
                  {item.source_rating_text && <span>★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span>}
                </div>
                {isOpen && spotify && <SpotifyInlinePlayer url={item.external_url ?? ""} title={titleFor(item)} />}
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
      <section id="games" className="v6Section v6Dark" key="games">
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
      <section id="contact" className="v6Contact" key="contact">
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

  return <main className={`v6Site ${editor?.enabled ? "v6Editing" : ""}`} dir={dir} style={style}>
    {settings.header.enabled && <header className={`v6Nav ${settings.header.sticky ? "sticky" : ""}`}>
      {edit(lang === "ar" ? "الشعار والقائمة" : "Brand & navigation", { type: "brand" })}
      <a className="v6Brand" href="#home"><Logo settings={settings} /><span>{settings.brand.showName && <strong>{settings.hero.name}</strong>}{settings.brand.showAlias && <small>{settings.hero.alias}</small>}</span></a>
      <nav><a href="#home">{settings.hero.homeNav[lang]}</a>{nav.map((key) => <a key={key} href={`#${key}`}>{settings.sections[key].nav[lang]}</a>)}</nav>
      {settings.header.showLanguageSwitch && <button className="v6Lang" onClick={() => !forcedLang && setLocalLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>}
    </header>}

    {settings.hero.enabled && <section id="home" className="v6Hero v6HeroProfile" style={settings.hero.backgroundUrl ? { backgroundImage: `url('${settings.hero.backgroundUrl}')` } : undefined}>
      {edit(lang === "ar" ? "تعديل الواجهة" : "Edit hero", { type: "hero" })}
      {edit(lang === "ar" ? "تعديل نبذة عني" : "Edit about", { type: "about" })}
      <div className="v6HeroOverlay" />
      <div className="v6HeroProfileGrid">
        <div className="v6HeroCopy">
          <span>{settings.hero.name.toUpperCase()}</span>
          <h1>{settings.hero.heading}</h1>
          <h2>{settings.hero.kicker[lang]}</h2>
          <p>{settings.hero.subtitle[lang]}</p>
          <div className="v6HeroActions">
            <a className="primary" href={`#${settings.hero.primaryTarget}`}>{settings.hero.primaryButton[lang]}</a>
            <a href={`#${settings.hero.secondaryTarget}`}>{settings.hero.secondaryButton[lang]}</a>
          </div>
        </div>
        <aside className="v6HeroAboutCard">
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
          </div>
        </aside>
      </div>
      <a className="v6ScrollCue" href="#photos" aria-label={lang === "ar" ? "انتقل للقسم التالي" : "Next section"}>
        <span>{lang === "ar" ? "اسحب للأسفل" : "Scroll down"}</span>
        <b>↓</b>
      </a>
    </section>

    {ordered.map((key) => nodes[key])}

    {activeAlbum && <div className="v6MediaModal" onClick={() => setActiveAlbumKey(null)}>
      <div className="v6MediaModalPanel v6AlbumModal" onClick={(e) => e.stopPropagation()}>
        <button className="v6ModalClose" type="button" onClick={() => setActiveAlbumKey(null)}>×</button>
        <div className="v6ModalHeading"><span>{lang === "ar" ? "ألبوم الصور" : "Photo album"}</span><h3>{activeAlbum.title}</h3><p>{activeAlbum.items.length} {lang === "ar" ? "صور" : "photos"}</p></div>
        <div className="v6AlbumGallery">
          {activeAlbum.items.map((item, i) => <div className="v6AlbumGalleryItem" key={item.id ?? `${item.title}-${i}`}>
            {editItem(item)}
            {item.cover_url ? <a href={item.cover_url} target="_blank" rel="noreferrer"><img src={item.cover_url} alt={titleFor(item)} /></a> : <div className="v6Placeholder">PHOTO</div>}
            <div><strong>{titleFor(item)}</strong></div>
          </div>)}
        </div>
      </div>
    </div>}

    {activeVideo && <div className="v6MediaModal" onClick={() => setActiveVideo(null)}>
      <div className="v6MediaModalPanel v6VideoModal" onClick={(e) => e.stopPropagation()}>
        <button className="v6ModalClose" type="button" onClick={() => setActiveVideo(null)}>×</button>
        <div className="v6VideoModalFrame"><VideoPlayer item={activeVideo} title={titleFor(activeVideo)} autoPlay /></div>
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
  if (source) return <video className="v6VideoPlayer" controls autoPlay={autoPlay} playsInline preload="metadata" poster={item.cover_url ?? undefined} src={source} />;
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

function SpotifyInlinePlayer({ url, title }: { url: string; title: string }) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let controller: any = null;
    const win = window as any;

    const create = (api: any) => {
      if (disposed || !holder.current) return;
      holder.current.innerHTML = "";
      api.createController(holder.current, { url, width: "100%", height: 80 }, (next: any) => {
        if (disposed) {
          next?.destroy?.();
          return;
        }
        controller = next;
        const tryPlay = () => {
          try { controller?.play?.(); } catch {}
        };
        controller?.addListener?.("ready", tryPlay);
        tryPlay();
      });
    };

    if (win.__roverSpotifyIframeApi) {
      create(win.__roverSpotifyIframeApi);
    } else {
      const previous = win.onSpotifyIframeApiReady;
      win.onSpotifyIframeApiReady = (api: any) => {
        win.__roverSpotifyIframeApi = api;
        if (typeof previous === "function") previous(api);
        create(api);
      };
      if (!document.querySelector('script[data-rover-spotify-api="1"]')) {
        const script = document.createElement("script");
        script.src = "https://open.spotify.com/embed/iframe-api/v1";
        script.async = true;
        script.dataset.roverSpotifyApi = "1";
        document.body.appendChild(script);
      }
    }

    return () => {
      disposed = true;
      try { controller?.destroy?.(); } catch {}
    };
  }, [url]);

  return <div className="v6SpotifyApiPlayer" aria-label={title} ref={holder}><span>Spotify</span></div>;
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
