"use client";

import { useMemo, useState } from "react";
import type { PortfolioItem } from "../lib/content";

type Lang = "en" | "ar";

const copy = {
  en: {
    nav: ["Home", "Photography", "Films", "Applications", "Other Works", "About", "Contact"],
    kicker: "Visual Stories. Digital Experiences.",
    subtitle: "Photography • Documentaries • Applications • Creative Projects",
    work: "View My Work",
    reel: "Watch Showreel",
    photography: "Photography",
    photoSub: "Moments. People. Places. Stories.",
    films: "Films & Documentaries",
    filmSub: "Real stories. Deeper perspectives.",
    apps: "Applications & Projects",
    appSub: "Ideas to real experiences.",
    other: "Other Creative Works",
    otherSub: "Designs, edits, AI art and more.",
    about: "About Me",
    aboutText: "I'm Ali Mohammed, known as Rover — a creative from Iraq working across photography, documentary filmmaking, application development and visual storytelling. I build digital experiences and document stories that deserve to be remembered.",
    contact: "Let's Work Together",
    contactSub: "Open for collaborations, freelance work and creative projects.",
    all: "All",
  },
  ar: {
    nav: ["الرئيسية", "التصوير", "الأفلام", "التطبيقات", "أعمال أخرى", "عني", "تواصل"],
    kicker: "قصص بصرية. تجارب رقمية.",
    subtitle: "تصوير • وثائقيات • تطبيقات • مشاريع إبداعية",
    work: "شاهد أعمالي",
    reel: "شاهد العرض",
    photography: "التصوير",
    photoSub: "لحظات. أشخاص. أماكن. حكايات.",
    films: "الأفلام والوثائقيات",
    filmSub: "قصص حقيقية. منظور أعمق.",
    apps: "التطبيقات والمشاريع",
    appSub: "من الفكرة إلى تجربة حقيقية.",
    other: "أعمال إبداعية أخرى",
    otherSub: "تصاميم، مونتاج، فن بالذكاء الاصطناعي وأكثر.",
    about: "عني",
    aboutText: "أنا علي محمد، المعروف باسم Rover — أعمل في التصوير وصناعة الوثائقيات وتطوير التطبيقات والسرد البصري. أحب بناء تجارب رقمية وتوثيق القصص التي تستحق أن تبقى.",
    contact: "خلّينا نشتغل سوا",
    contactSub: "متاح للتعاون، الأعمال الحرة والمشاريع الإبداعية.",
    all: "الكل",
  },
};

export function PortfolioClient({ items }: { items: PortfolioItem[] }) {
  const [lang, setLang] = useState<Lang>("en");
  const [photoFilter, setPhotoFilter] = useState("All");
  const t = copy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const photos = items.filter((item) => item.kind === "photo");
  const films = items.filter((item) => item.kind === "film");
  const projects = items.filter((item) => item.kind === "application");
  const creative = items.filter((item) => item.kind === "creative");
  const filters = ["All", ...Array.from(new Set(photos.map((p) => p.category).filter(Boolean) as string[]))];
  const filteredPhotos = useMemo(
    () => (photoFilter === "All" ? photos : photos.filter((p) => p.category === photoFilter)),
    [photos, photoFilter]
  );
  const featuredFilm = films.find((film) => film.is_featured) ?? films[0];

  return (
    <main dir={dir}>
      <header className="navShell">
        <a href="#home" className="brand"><span className="brandMark">R</span><span><strong>Ali Mohammed</strong><small>Rover</small></span></a>
        <nav className="desktopNav">
          {t.nav.map((item, i) => <a key={item} href={["#home", "#photography", "#films", "#applications", "#other", "#about", "#contact"][i]}>{item}</a>)}
        </nav>
        <button className="langBtn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
      </header>

      <section id="home" className="hero sectionDark">
        <div className="heroOverlay" />
        <div className="heroContent">
          <p className="eyebrow">ALI MOHAMMED</p>
          <h1>ROVER</h1>
          <h2>{t.kicker}</h2>
          <p className="heroMeta">{t.subtitle}</p>
          <div className="heroActions">
            <a className="primaryBtn" href="#photography">{t.work}</a>
            <a className="ghostBtn" href="#films"><span className="play">▶</span>{t.reel}</a>
          </div>
        </div>
        <div className="heroStamp"><span>CREATIVE</span><strong>VISUAL STORYTELLER</strong><span>BASED IN IRAQ</span></div>
      </section>

      <section id="photography" className="section sectionDark">
        <SectionTitle title={t.photography} subtitle={t.photoSub} />
        <div className="filters">
          {filters.map((f) => <button key={f} onClick={() => setPhotoFilter(f)} className={photoFilter === f ? "active" : ""}>{f === "All" ? t.all : f}</button>)}
        </div>
        <div className="photoGrid">
          {filteredPhotos.map((p, i) => <article className={`photoCard photo${i % 3}`} key={p.id ?? `${p.title}-${i}`} style={{ backgroundImage: `url('${p.cover_url ?? ""}')` }}>
            <div className="cardShade" /><div className="cardText"><small>{p.category}</small><strong>{lang === "ar" && p.title_ar ? p.title_ar : p.title}</strong></div>
          </article>)}
        </div>
      </section>

      <section id="films" className="section sectionBlack">
        <SectionTitle title={t.films} subtitle={t.filmSub} />
        {featuredFilm && <article className="featuredFilm" style={{ backgroundImage: `url('${featuredFilm.cover_url ?? ""}')` }}>
          <div className="filmShade" />
          {featuredFilm.video_url ? <a className="bigPlay linkPlay" href={featuredFilm.video_url} target="_blank" rel="noreferrer">▶</a> : <span className="bigPlay staticPlay">▶</span>}
          <div className="filmInfo"><h3>{lang === "ar" && featuredFilm.title_ar ? featuredFilm.title_ar : featuredFilm.title}</h3>{lang !== "ar" && featuredFilm.title_ar && <h4>{featuredFilm.title_ar}</h4>}<p>{featuredFilm.year} · Documentary · {featuredFilm.duration}</p></div>
        </article>}
        <div className="filmRow">
          {films.filter((f) => f !== featuredFilm).map((f, i) => <article className="miniFilm" key={f.id ?? `${f.title}-${i}`}>
            {f.cover_url && <img src={f.cover_url} alt={f.title}/>}<div><strong>{lang === "ar" && f.title_ar ? f.title_ar : f.title}</strong><span>{f.year} · {f.duration}</span></div>
          </article>)}
        </div>
      </section>

      <section id="applications" className="section sectionDark">
        <SectionTitle title={t.apps} subtitle={t.appSub} />
        <div className="projectGrid">
          {projects.map((p, i) => <article className="projectCard" key={p.id ?? `${p.title}-${i}`}>
            {p.cover_url ? <div className="projectVisual projectImage" style={{ backgroundImage: `url('${p.cover_url}')` }} /> : <div className={`projectVisual v${(i % 4) + 1}`}><span>{p.title.slice(0, 1)}</span></div>}
            <div className="projectBody"><div className="projectTop"><h3>{lang === "ar" && p.title_ar ? p.title_ar : p.title}</h3>{p.external_url ? <a href={p.external_url} target="_blank" rel="noreferrer">↗</a> : <span>↗</span>}</div><small>{p.subtitle}</small><p>{p.description}</p><div className="tags">{(p.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          </article>)}
        </div>
      </section>

      <section id="other" className="section sectionBlack">
        <SectionTitle title={t.other} subtitle={t.otherSub} />
        <div className="creativeStrip">
          {creative.map((item, i) => <article className="creativeTile" key={item.id ?? `${item.title}-${i}`} style={{ backgroundImage: `url('${item.cover_url ?? ""}')` }}><span>{lang === "ar" && item.title_ar ? item.title_ar : item.title}</span></article>)}
        </div>
      </section>

      <section id="about" className="aboutSection">
        <div className="aboutPortrait"><div className="portraitGlow"/><div className="portraitLetter">R</div></div>
        <div className="aboutCopy"><p className="eyebrow">ALI MOHAMMED (ROVER)</p><h2>{t.about}</h2><p>{t.aboutText}</p><div className="stats"><div><strong>Photography</strong><span>Visual stories</span></div><div><strong>Film</strong><span>Documentary</span></div><div><strong>Apps</strong><span>Digital products</span></div></div></div>
      </section>

      <section id="contact" className="contactSection">
        <div><p className="eyebrow">CONTACT</p><h2>{t.contact}</h2><p>{t.contactSub}</p></div>
        <div className="contactGrid"><a href="mailto:hello@example.com">Email <span>↗</span></a><a href="#">Instagram <span>↗</span></a><a href="#">YouTube <span>↗</span></a><a href="#">GitHub <span>↗</span></a></div>
      </section>

      <footer><div className="brand"><span className="brandMark">R</span><span><strong>Ali Mohammed</strong><small>Rover</small></span></div><span>© 2026 Rover. All rights reserved.</span></footer>
    </main>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="sectionHead"><div><div className="sectionLine"/><h2>{title}</h2><p>{subtitle}</p></div><span className="index">ROVER / PORTFOLIO</span></div>;
}
