export type Lang = "en" | "ar";
export type LocalizedText = { en: string; ar: string };
export type SiteSectionKey = "photography" | "films" | "applications" | "other" | "about" | "contact";
export type CustomSectionLayout = "text" | "media-left" | "media-right";
export type SectionSurface = "dark" | "black" | "accent";

export type SectionSettings = {
  enabled: boolean;
  showInNav: boolean;
  order: number;
  nav: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  surface?: SectionSurface;
};

export type CustomSection = SectionSettings & {
  id: string;
  body: LocalizedText;
  imageUrl: string;
  layout: CustomSectionLayout;
};

export type SiteConfig = {
  brand: {
    logoType: "letter" | "image";
    letter: string;
    logoUrl: string;
    faviconUrl: string;
    showName: boolean;
    showAlias: boolean;
  };
  header: {
    enabled: boolean;
    sticky: boolean;
    showLanguageSwitch: boolean;
  };
  hero: {
    enabled: boolean;
    name: string;
    alias: string;
    heading: string;
    homeNav: LocalizedText;
    kicker: LocalizedText;
    subtitle: LocalizedText;
    stampTop: LocalizedText;
    stampMiddle: LocalizedText;
    stampBottom: LocalizedText;
    primaryButton: LocalizedText;
    secondaryButton: LocalizedText;
    backgroundUrl: string;
    primaryTarget: string;
    secondaryTarget: string;
  };
  sections: Record<SiteSectionKey, SectionSettings>;
  customSections: CustomSection[];
  about: {
    eyebrow: string;
    text: LocalizedText;
    imageUrl: string;
    stats: Array<{ title: LocalizedText; subtitle: LocalizedText }>;
  };
  contact: {
    eyebrow: LocalizedText;
    email: string;
    instagram: string;
    youtube: string;
    github: string;
    customLinks: Array<{ label: LocalizedText; url: string }>;
  };
  footer: {
    enabled: boolean;
    text: LocalizedText;
  };
  theme: {
    accentColor: string;
    backgroundColor: string;
    alternateBackgroundColor: string;
    panelColor: string;
    textColor: string;
    mutedColor: string;
    lineColor: string;
    fontFamily: string;
    headingFontFamily: string;
    radius: number;
  };
};

export const sectionKeys: SiteSectionKey[] = ["photography", "films", "applications", "other", "about", "contact"];

const stat = (en: string, ar: string, subEn: string, subAr: string) => ({
  title: { en, ar },
  subtitle: { en: subEn, ar: subAr },
});

export const defaultSiteConfig: SiteConfig = {
  brand: {
    logoType: "letter",
    letter: "R",
    logoUrl: "",
    faviconUrl: "",
    showName: true,
    showAlias: true,
  },
  header: { enabled: true, sticky: true, showLanguageSwitch: true },
  hero: {
    enabled: true,
    name: "Ali Mohammed",
    alias: "Rover",
    heading: "ROVER",
    homeNav: { en: "Home", ar: "الرئيسية" },
    kicker: { en: "Visual Stories. Digital Experiences.", ar: "قصص بصرية. تجارب رقمية." },
    subtitle: { en: "Photography • Documentaries • Applications • Creative Projects", ar: "تصوير • وثائقيات • تطبيقات • مشاريع إبداعية" },
    stampTop: { en: "CREATIVE", ar: "إبداع" },
    stampMiddle: { en: "VISUAL STORYTELLER", ar: "سارد بصري" },
    stampBottom: { en: "BASED IN IRAQ", ar: "العراق" },
    primaryButton: { en: "View My Work", ar: "شاهد أعمالي" },
    secondaryButton: { en: "Watch Showreel", ar: "شاهد العرض" },
    backgroundUrl: "",
    primaryTarget: "photography",
    secondaryTarget: "films",
  },
  sections: {
    photography: { enabled: true, showInNav: true, order: 1, nav: { en: "Photography", ar: "التصوير" }, title: { en: "Photography", ar: "التصوير" }, subtitle: { en: "Moments. People. Places. Stories.", ar: "لحظات. أشخاص. أماكن. حكايات." }, surface: "dark" },
    films: { enabled: true, showInNav: true, order: 2, nav: { en: "Films", ar: "الأفلام" }, title: { en: "Films & Documentaries", ar: "الأفلام والوثائقيات" }, subtitle: { en: "Real stories. Deeper perspectives.", ar: "قصص حقيقية. منظور أعمق." }, surface: "black" },
    applications: { enabled: true, showInNav: true, order: 3, nav: { en: "Applications", ar: "التطبيقات" }, title: { en: "Applications & Projects", ar: "التطبيقات والمشاريع" }, subtitle: { en: "Ideas to real experiences.", ar: "من الفكرة إلى تجربة حقيقية." }, surface: "dark" },
    other: { enabled: true, showInNav: true, order: 4, nav: { en: "Other Works", ar: "أعمال أخرى" }, title: { en: "Other Creative Works", ar: "أعمال إبداعية أخرى" }, subtitle: { en: "Designs, edits, AI art and more.", ar: "تصاميم، مونتاج، فن بالذكاء الاصطناعي وأكثر." }, surface: "black" },
    about: { enabled: true, showInNav: true, order: 5, nav: { en: "About", ar: "عني" }, title: { en: "About Me", ar: "عني" }, subtitle: { en: "", ar: "" }, surface: "dark" },
    contact: { enabled: true, showInNav: true, order: 6, nav: { en: "Contact", ar: "تواصل" }, title: { en: "Let's Work Together", ar: "خلّينا نشتغل سوا" }, subtitle: { en: "Open for collaborations, freelance work and creative projects.", ar: "متاح للتعاون، الأعمال الحرة والمشاريع الإبداعية." }, surface: "accent" },
  },
  customSections: [],
  about: {
    eyebrow: "ALI MOHAMMED (ROVER)",
    text: {
      en: "I'm Ali Mohammed, known as Rover — a creative from Iraq working across photography, documentary filmmaking, application development and visual storytelling. I build digital experiences and document stories that deserve to be remembered.",
      ar: "أنا علي محمد، المعروف باسم Rover — أعمل في التصوير وصناعة الوثائقيات وتطوير التطبيقات والسرد البصري. أحب بناء تجارب رقمية وتوثيق القصص التي تستحق أن تبقى.",
    },
    imageUrl: "",
    stats: [
      stat("Photography", "التصوير", "Visual stories", "قصص بصرية"),
      stat("Film", "الأفلام", "Documentary", "وثائقي"),
      stat("Apps", "التطبيقات", "Digital products", "منتجات رقمية"),
    ],
  },
  contact: {
    eyebrow: { en: "CONTACT", ar: "تواصل" },
    email: "hello@example.com",
    instagram: "",
    youtube: "",
    github: "https://github.com/rover7z",
    customLinks: [],
  },
  footer: { enabled: true, text: { en: "© 2026 Rover. All rights reserved.", ar: "© 2026 Rover. جميع الحقوق محفوظة." } },
  theme: {
    accentColor: "#d8a54f",
    backgroundColor: "#070a0c",
    alternateBackgroundColor: "#050708",
    panelColor: "#10161a",
    textColor: "#f4f2ed",
    mutedColor: "#8d969c",
    lineColor: "#232a2f",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    headingFontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    radius: 6,
  },
};

function localized(value: unknown, fallback: LocalizedText): LocalizedText {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Partial<LocalizedText>;
  return { en: typeof v.en === "string" ? v.en : fallback.en, ar: typeof v.ar === "string" ? v.ar : fallback.ar };
}

function section(value: unknown, fallback: SectionSettings): SectionSettings {
  if (!value || typeof value !== "object") return { ...fallback };
  const v = value as Partial<SectionSettings>;
  return {
    ...fallback,
    ...v,
    nav: localized(v.nav, fallback.nav),
    title: localized(v.title, fallback.title),
    subtitle: localized(v.subtitle, fallback.subtitle),
  };
}

export function mergeSiteConfig(value: unknown): SiteConfig {
  if (!value || typeof value !== "object") return structuredClone(defaultSiteConfig);
  const raw = value as Partial<SiteConfig>;
  const result = structuredClone(defaultSiteConfig);

  if (raw.brand && typeof raw.brand === "object") result.brand = { ...result.brand, ...raw.brand };
  if (raw.header && typeof raw.header === "object") result.header = { ...result.header, ...raw.header };
  if (raw.hero && typeof raw.hero === "object") {
    result.hero = { ...result.hero, ...raw.hero } as SiteConfig["hero"];
    result.hero.homeNav = localized(raw.hero.homeNav, defaultSiteConfig.hero.homeNav);
    result.hero.kicker = localized(raw.hero.kicker, defaultSiteConfig.hero.kicker);
    result.hero.subtitle = localized(raw.hero.subtitle, defaultSiteConfig.hero.subtitle);
    result.hero.stampTop = localized(raw.hero.stampTop, defaultSiteConfig.hero.stampTop);
    result.hero.stampMiddle = localized(raw.hero.stampMiddle, defaultSiteConfig.hero.stampMiddle);
    result.hero.stampBottom = localized(raw.hero.stampBottom, defaultSiteConfig.hero.stampBottom);
    result.hero.primaryButton = localized(raw.hero.primaryButton, defaultSiteConfig.hero.primaryButton);
    result.hero.secondaryButton = localized(raw.hero.secondaryButton, defaultSiteConfig.hero.secondaryButton);
  }
  if (raw.sections && typeof raw.sections === "object") {
    for (const key of sectionKeys) result.sections[key] = section(raw.sections[key], defaultSiteConfig.sections[key]);
  }
  if (Array.isArray(raw.customSections)) {
    result.customSections = raw.customSections
      .filter((entry) => entry && typeof entry === "object" && typeof entry.id === "string")
      .map((entry) => {
        const e = entry as Partial<CustomSection> & { id: string };
        return {
          id: e.id,
          enabled: e.enabled ?? true,
          showInNav: e.showInNav ?? true,
          order: typeof e.order === "number" ? e.order : 50,
          nav: localized(e.nav, { en: "New section", ar: "قسم جديد" }),
          title: localized(e.title, { en: "New section", ar: "قسم جديد" }),
          subtitle: localized(e.subtitle, { en: "", ar: "" }),
          body: localized(e.body, { en: "", ar: "" }),
          imageUrl: typeof e.imageUrl === "string" ? e.imageUrl : "",
          layout: e.layout === "media-left" || e.layout === "media-right" ? e.layout : "text",
          surface: e.surface === "black" || e.surface === "accent" ? e.surface : "dark",
        };
      });
  }
  if (raw.about && typeof raw.about === "object") {
    result.about = { ...result.about, ...raw.about } as SiteConfig["about"];
    result.about.text = localized(raw.about.text, defaultSiteConfig.about.text);
    if (Array.isArray(raw.about.stats)) result.about.stats = raw.about.stats.map((s, i) => ({ title: localized(s?.title, defaultSiteConfig.about.stats[i]?.title ?? { en: "", ar: "" }), subtitle: localized(s?.subtitle, defaultSiteConfig.about.stats[i]?.subtitle ?? { en: "", ar: "" }) }));
  }
  if (raw.contact && typeof raw.contact === "object") {
    result.contact = { ...result.contact, ...raw.contact } as SiteConfig["contact"];
    result.contact.eyebrow = localized(raw.contact.eyebrow, defaultSiteConfig.contact.eyebrow);
    if (Array.isArray(raw.contact.customLinks)) result.contact.customLinks = raw.contact.customLinks.map((l) => ({ label: localized(l?.label, { en: "Link", ar: "رابط" }), url: typeof l?.url === "string" ? l.url : "" }));
  }
  if (raw.footer && typeof raw.footer === "object") {
    result.footer = { ...result.footer, ...raw.footer } as SiteConfig["footer"];
    result.footer.text = localized(raw.footer.text, defaultSiteConfig.footer.text);
  }
  if (raw.theme && typeof raw.theme === "object") result.theme = { ...result.theme, ...raw.theme };
  return result;
}
