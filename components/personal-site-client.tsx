"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
  const lang = forcedLang ?? localLang;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const byKind = (kind: PortfolioKind) => items.filter((item) => item.kind === kind && item.is_published !== false);
  const photos = byKind("photo");
  const videos = byKind("video");
  const movies = byKind("movie");
  const music = byKind("music");
  const games = byKind("game");

  const ordered = useMemo(
    () => personalSectionKeys
      .filter((key) => settings.sections[key].enabled)
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
        <div className="v6PhotoGrid">
          {photos.map((item, i) => (
            <article className={`v6PhotoCard v6Photo${i % 5}`} key={item.id ?? `${item.title}-${i}`}>
              {editItem(item)}
              {item.cover_url ? <a href={item.cover_url} target="_blank" rel="noreferrer"><img src={item.cover_url} alt={titleFor(item)} /></a> : <div className="v6Placeholder">PHOTO</div>}
              <div className="v6CardCaption"><strong>{titleFor(item)}</strong>{item.category && <span>{item.category}</span>}</div>
            </article>
          ))}
        </div>
        {add("photo", "إضافة صورة", "Add photo")}
        {!photos.length && <Empty lang={lang} textAr="أضف صورك من هنا." textEn="Add your photos here." />}
      </section>
    ),
    videos: (
      <section id="videos" className="v6Section v6Black" key="videos">
        {sectionTitle("videos")}
        <div className="v6VideoGrid">
          {videos.map((item, i) => (
            <article className="v6VideoCard" key={item.id ?? `${item.title}-${i}`}>
              {editItem(item)}
              <VideoPlayer item={item} title={titleFor(item)} />
              <div className="v6Info"><h3>{titleFor(item)}</h3>{descriptionFor(item) && <p>{descriptionFor(item)}</p>}</div>
            </article>
          ))}
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
              <div className="v6PosterBody">{item.category && <small>{item.category}</small>}{item.rating !== null {item.rating !== null && item.rating !== undefined && <span className="v6Rating">★ Rover {Number(item.rating).toFixed(1)}/10</span>{item.source_rating_text ? <span className="v6Rating">★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span> : null}}{item.rating !== null && item.rating !== undefined && <span className="v6Rating">★ Rover {Number(item.rating).toFixed(1)}/10</span>{item.source_rating_text ? <span className="v6Rating">★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span> : null}} item.rating !== undefined {item.rating !== null && item.rating !== undefined && <span className="v6Rating">★ Rover {Number(item.rating).toFixed(1)}/10</span>{item.source_rating_text ? <span className="v6Rating">★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span> : null}}{item.rating !== null && item.rating !== undefined && <span className="v6Rating">★ Rover {Number(item.rating).toFixed(1)}/10</span>{item.source_rating_text ? <span className="v6Rating">★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span> : null}} <span className="v6Rating">★ Rover {Number(item.rating).toFixed(1)}/10</span>}{item.source_rating_text ? <span className="v6Rating">★ {item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span> : null}<h3>{titleFor(item)}</h3>{descriptionFor(item) && <p>{descriptionFor(item)}</p>}{item.external_url && <a className="v6External" href={item.external_url} target="_blank" rel="noreferrer">{item.category ? (lang === "ar" ? `افتح على ${item.category}` : `Open on ${item.category}`) : (lang === "ar" ? "فتح رابط الفيلم" : "Open movie link")} ↗</a>}</div>
            </article>
          ))}
        </div>
        {add("movie", "إضافة فيلم", "Add movie")}
        {!movies.length && <Empty lang={lang} textAr="أضف أفلامك المفضلة وصور الأغلفة وروابط أي منصة تختارها." textEn="Add favorite movies, posters, and links to any platform you choose." />}
      </section>
    ),
    music: (
      <section id="music" className="v6Section v6Black" key="music">
        {sectionTitle("music")}
        <div className="v6MusicGrid">
          {music.map((item, i) => {
            const embed = musicEmbed(item.external_url ?? "");
            return <article className="v6MusicCard" key={item.id ?? `${item.title}-${i}`}>
              {editItem(item)}
              <div className="v6MusicTop">{item.cover_url ? <img src={item.cover_url} alt={titleFor(item)} /> : <div className="v6Placeholder">♪</div>}<div><h3>{titleFor(item)}</h3>{subtitleFor(item) && <p>{subtitleFor(item)}</p>}</div></div>
              {embed ? <iframe className="v6Spotify" src={embed} width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title={titleFor(item)} /> : item.video_url ? <audio controls preload="none" src={item.video_url} /> : null}
              {item.external_url && <a className="v6External" href={item.external_url} target="_blank" rel="noreferrer">{lang === "ar" ? "زيارة المنصة" : "Visit platform"} ↗</a>}
            </article>;
          })}
        </div>
        {add("music", "إضافة أغنية", "Add song")}
        {!music.length && <Empty lang={lang} textAr="أضف أغانيك وروابط Spotify، وتشتغل من داخل الموقع." textEn="Add songs and Spotify links for in-site playback." />}
      </section>
    ),
    games: (
      <section id="games" className="v6Section v6Dark" key="games">
        {sectionTitle("games")}
        <div className="v6GameGrid">
          {games.map((item, i) => (
            <article className="v6GameCard" key={item.id ?? `${item.title}-${i}`}>
              {editItem(item)}
              {item.cover_url ? <img src={item.cover_url} alt={titleFor(item)} /> : <div className="v6Placeholder">GAME</div>}
              <div className="v6GameShade" />
              <div className="v6GameBody"><div>{item.category && <span>{item.category}</span>}{item.source_rating_text ? <span>{item.source_rating_label ? `${item.source_rating_label} ` : ""}{item.source_rating_text}</span> : null}<h3>{titleFor(item)}</h3>{descriptionFor(item) && <p>{descriptionFor(item)}</p>}</div>{item.external_url && <a className="v6External" href={item.external_url} target="_blank" rel="noreferrer">{lang === "ar" ? "افتح اللعبة" : "Open game"} ↗</a>}</div>
            </article>
          ))}
        </div>
        {add("game", "إضافة لعبة", "Add game")}
        {!games.length && <Empty lang={lang} textAr="أضف ألعابك وصورها وروابط Steam أو PlayStation أو Google Play وغيرها." textEn="Add games with images and Steam, PlayStation, Google Play, or other links." />}
      </section>
    ),
    about: (
      <section id="about" className="v6About v6Black" key="about">
        {edit(lang === "ar" ? "تعديل نبذة عني" : "Edit About", { type: "about" })}
        <div className="v6AboutPhoto">{settings.about.imageUrl ? <img src={settings.about.imageUrl} alt={settings.hero.name} /> : <div className="v6AboutLetter">{settings.brand.letter || "R"}</div>}</div>
        <div className="v6AboutText"><span>{settings.about.eyebrow[lang]}</span><h2>{settings.sections.about.title[lang]}</h2><p>{settings.about.text[lang]}</p><div className="v6Experience"><h3>{settings.about.experienceTitle[lang]}</h3>{settings.about.experienceText[lang].split("\n").map((line, i) => <p key={i}>{line}</p>)}</div></div>
      </section>
    ),
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

    {settings.hero.enabled && <section id="home" className="v6Hero" style={settings.hero.backgroundUrl ? { backgroundImage: `url('${settings.hero.backgroundUrl}')` } : undefined}>
      {edit(lang === "ar" ? "تعديل الواجهة" : "Edit hero", { type: "hero" })}
      <div className="v6HeroOverlay" />
      <div className="v6HeroCopy"><span>{settings.hero.name.toUpperCase()}</span><h1>{settings.hero.heading}</h1><h2>{settings.hero.kicker[lang]}</h2><p>{settings.hero.subtitle[lang]}</p><div className="v6HeroActions"><a className="primary" href={`#${settings.hero.primaryTarget}`}>{settings.hero.primaryButton[lang]}</a><a href={`#${settings.hero.secondaryTarget}`}>{settings.hero.secondaryButton[lang]}</a></div></div>
    </section>}

    {ordered.map((key) => nodes[key])}

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

function VideoPlayer({ item, title }: { item: PortfolioItem; title: string }) {
  const youtube = youtubeEmbed(item.video_url ?? "");
  if (youtube) return <iframe className="v6VideoPlayer" src={youtube} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  if (item.video_url) return <video className="v6VideoPlayer" controls preload="metadata" poster={item.cover_url ?? undefined} src={item.video_url} />;
  if (item.cover_url) return <img className="v6VideoPlayer" src={item.cover_url} alt={title} />;
  return <div className="v6VideoPlayer v6Placeholder">VIDEO</div>;
}

function youtubeEmbed(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

function spotifyEmbed(url: string) {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/);
  return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0` : "";
}

function musicEmbed(url: string) {
  const spotify = spotifyEmbed(url);
  if (spotify) return spotify;
  const youtube = youtubeEmbed(url);
  if (youtube) return youtube;
  if (/soundcloud\.com/i.test(url)) return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false`;
  if (/music\.apple\.com/i.test(url)) return url.replace(/^https?:\/\/music\.apple\.com/i, "https://embed.music.apple.com");
  const deezer = url.match(/deezer\.com\/(?:[a-z]{2}\/)?track\/(\d+)/i);
  if (deezer) return `https://widget.deezer.com/widget/dark/track/${deezer[1]}`;
  return "";
}
