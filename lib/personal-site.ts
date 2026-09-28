export type Lang = "en" | "ar";
export type LocalizedText = { en: string; ar: string };
export type PersonalSectionKey = "photos" | "videos" | "movies" | "music" | "games" | "about" | "contact";

export type SectionVisualStyle = {
  backgroundPreset?: string;
  backgroundColor?: string;
  backgroundUrl?: string;
  textColor?: string;
  accentColor?: string;
  panelColor?: string;
  buttonColor?: string;
};

export type SectionSettings = {
  enabled: boolean;
  showInNav: boolean;
  order: number;
  nav: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  style?: SectionVisualStyle;
};

export type CustomSectionSettings = SectionSettings & {
  id: string;
  body: LocalizedText;
  buttonLabel: LocalizedText;
  buttonUrl: string;
};

export type PersonalSiteConfig = {
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
    primaryButton: LocalizedText;
    secondaryButton: LocalizedText;
    primaryTarget: PersonalSectionKey;
    secondaryTarget: PersonalSectionKey;
    backgroundUrl: string;
  };
  sections: Record<PersonalSectionKey, SectionSettings>;
  customSections: CustomSectionSettings[];
  about: {
    eyebrow: LocalizedText;
    text: LocalizedText;
    imageUrl: string;
    experienceTitle: LocalizedText;
    experienceText: LocalizedText;
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
    radius: number;
  };
};

export const personalSectionKeys: PersonalSectionKey[] = ["photos", "videos", "movies", "music", "games", "about", "contact"];

export const defaultPersonalSiteConfig: PersonalSiteConfig = {
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
    kicker: {
      en: "I capture moments, build ideas, and share the things that define me.",
      ar: "أوثّق اللحظات، أبني الأفكار، وأشارك الأشياء التي تمثلني.",
    },
    subtitle: {
      en: "Photography • Video • Movies • Music • Games • Experience",
      ar: "تصوير • فيديو • أفلام • موسيقى • ألعاب • خبرة",
    },
    primaryButton: { en: "Explore My Work", ar: "استكشف أعمالي" },
    secondaryButton: { en: "About Me", ar: "تعرّف عليّ" },
    primaryTarget: "photos",
    secondaryTarget: "about",
    backgroundUrl: "",
  },
  sections: {
    photos: {
      enabled: true, showInNav: true, order: 1,
      nav: { en: "Photos", ar: "الصور" },
      title: { en: "Photography", ar: "الصور" },
      subtitle: { en: "Moments, places and stories through my lens.", ar: "لحظات وأماكن وقصص من خلال عدستي." },
    },
    videos: {
      enabled: true, showInNav: true, order: 2,
      nav: { en: "Videos", ar: "الفيديو" },
      title: { en: "Videos", ar: "الفيديو" },
      subtitle: { en: "Videos and visual stories I create and share.", ar: "فيديوهات وقصص بصرية أصنعها وأشاركها." },
    },
    movies: {
      enabled: true, showInNav: true, order: 3,
      nav: { en: "Movies", ar: "الأفلام" },
      title: { en: "Favorite Movies", ar: "أفلامي المفضلة" },
      subtitle: { en: "Movies I enjoy and recommend.", ar: "أفلام أحبها وأستمتع بمشاهدتها." },
    },
    music: {
      enabled: true, showInNav: true, order: 4,
      nav: { en: "Music", ar: "الأغاني" },
      title: { en: "Favorite Music", ar: "أغانيي المفضلة" },
      subtitle: { en: "Songs and artists I keep coming back to.", ar: "أغانٍ وفنانون أعود للاستماع إليهم دائماً." },
    },
    games: {
      enabled: true, showInNav: true, order: 5,
      nav: { en: "Games", ar: "الألعاب" },
      title: { en: "Favorite Games", ar: "ألعابي المفضلة" },
      subtitle: { en: "Games and worlds I enjoy spending time in.", ar: "ألعاب وعوالم أستمتع بقضاء وقتي فيها." },
    },
    about: {
      enabled: true, showInNav: true, order: 6,
      nav: { en: "About", ar: "عنّي" },
      title: { en: "About Me", ar: "نبذة عنّي" },
      subtitle: { en: "A little about who I am and what I have done.", ar: "نبذة بسيطة عني وعن خبرتي وما عملت عليه." },
    },
    contact: {
      enabled: true, showInNav: true, order: 7,
      nav: { en: "Contact", ar: "تواصل" },
      title: { en: "Let's Connect", ar: "تواصل معي" },
      subtitle: { en: "Open to job opportunities, collaborations, and new projects.", ar: "متاح لفرص العمل، التعاون والمشاريع الجديدة." },
    },
  },
  customSections: [],
  about: {
    eyebrow: { en: "ALI MOHAMMED (ROVER)", ar: "ALI MOHAMMED (ROVER)" },
    text: {
      en: "I'm Ali Mohammed, known as Rover. I enjoy photography, video, technology, games, movies, music, and creating useful digital ideas. This website is a place for my work, experience, and the things I like.",
      ar: "أنا علي محمد، المعروف باسم Rover. أحب التصوير والفيديو والتقنية والألعاب والأفلام والموسيقى وصناعة الأفكار الرقمية المفيدة. هذا الموقع يجمع أعمالي وخبرتي والأشياء التي أحبها.",
    },
    imageUrl: "",
    experienceTitle: { en: "Professional Experience", ar: "الخبرة المهنية" },
    experienceText: {
      en: "Baly — Sales Representative | 2021–2023, 2025–Present\nZain Iraq — Sales Representative | 2021–2023\nBaron Hotel — Hotel Management | 2023–2025\nFreelance work — Various independent and promotional projects",
      ar: "Baly — موظف مبيعات | 2021–2023، 2025–الآن\nZain Iraq — موظف مبيعات | 2021–2023\nفندق البارون — إدارة الفنادق | 2023–2025\nأعمال حرة — أعمال مستقلة وترويجية متنوعة",
    },
  },
  contact: {
    eyebrow: { en: "CONTACT", ar: "تواصل" },
    email: "aliscar00@gmail.com",
    instagram: "https://www.instagram.com/rover7z",
    youtube: "https://youtube.com/channel/UC0nlSslbWCjY3GtZm51TgxQ",
    github: "https://github.com/rover7z",
    customLinks: [],
  },
  footer: {
    enabled: true,
    text: { en: "© 2026 Rover. All rights reserved.", ar: "© 2026 Rover. جميع الحقوق محفوظة." },
  },
  theme: {
    accentColor: "#d8a54f",
    backgroundColor: "#070a0c",
    alternateBackgroundColor: "#050708",
    panelColor: "#10161a",
    textColor: "#f4f2ed",
    mutedColor: "#8d969c",
    lineColor: "#232a2f",
    radius: 10,
  },
};

function localized(value: unknown, fallback: LocalizedText): LocalizedText {
  if (!value || typeof value !== "object") return { ...fallback };
  const v = value as Partial<LocalizedText>;
  return {
    en: typeof v.en === "string" ? v.en : fallback.en,
    ar: typeof v.ar === "string" ? v.ar : fallback.ar,
  };
}

function section(value: unknown, fallback: SectionSettings): SectionSettings {
  if (!value || typeof value !== "object") return structuredClone(fallback);
  const v = value as Partial<SectionSettings>;
  return {
    ...fallback,
    ...v,
    nav: localized(v.nav, fallback.nav),
    title: localized(v.title, fallback.title),
    subtitle: localized(v.subtitle, fallback.subtitle),
  };
}

export function mergePersonalSiteConfig(value: unknown): PersonalSiteConfig {
  const result = structuredClone(defaultPersonalSiteConfig);
  if (!value || typeof value !== "object") return result;
  const raw = value as Partial<PersonalSiteConfig>;

  if (raw.brand && typeof raw.brand === "object") result.brand = { ...result.brand, ...raw.brand };
  if (raw.header && typeof raw.header === "object") result.header = { ...result.header, ...raw.header };
  if (raw.hero && typeof raw.hero === "object") {
    result.hero = { ...result.hero, ...raw.hero } as PersonalSiteConfig["hero"];
    result.hero.homeNav = localized(raw.hero.homeNav, defaultPersonalSiteConfig.hero.homeNav);
    result.hero.kicker = localized(raw.hero.kicker, defaultPersonalSiteConfig.hero.kicker);
    result.hero.subtitle = localized(raw.hero.subtitle, defaultPersonalSiteConfig.hero.subtitle);
    result.hero.primaryButton = localized(raw.hero.primaryButton, defaultPersonalSiteConfig.hero.primaryButton);
    result.hero.secondaryButton = localized(raw.hero.secondaryButton, defaultPersonalSiteConfig.hero.secondaryButton);
  }
  if (raw.sections && typeof raw.sections === "object") {
    for (const key of personalSectionKeys) result.sections[key] = section(raw.sections[key], defaultPersonalSiteConfig.sections[key]);
  }
  if (Array.isArray(raw.customSections)) {
    result.customSections = raw.customSections.map((entry, index) => {
      const source = entry && typeof entry === "object" ? entry as Partial<CustomSectionSettings> : {};
      const base = section(source, {
        enabled: true,
        showInNav: true,
        order: 20 + index,
        nav: { en: "Section", ar: "قسم" },
        title: { en: "New Section", ar: "قسم جديد" },
        subtitle: { en: "Add a description for this section.", ar: "أضف وصفاً لهذا القسم." },
      });
      return {
        ...base,
        id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : `custom-${index + 1}`,
        body: localized(source.body, { en: "", ar: "" }),
        buttonLabel: localized(source.buttonLabel, { en: "", ar: "" }),
        buttonUrl: typeof source.buttonUrl === "string" ? source.buttonUrl : "",
      };
    });
  }
  if (raw.about && typeof raw.about === "object") {
    result.about = { ...result.about, ...raw.about } as PersonalSiteConfig["about"];
    result.about.eyebrow = localized(raw.about.eyebrow, defaultPersonalSiteConfig.about.eyebrow);
    result.about.text = localized(raw.about.text, defaultPersonalSiteConfig.about.text);
    result.about.experienceTitle = localized(raw.about.experienceTitle, defaultPersonalSiteConfig.about.experienceTitle);
    result.about.experienceText = localized(raw.about.experienceText, defaultPersonalSiteConfig.about.experienceText);
  }
  if (raw.contact && typeof raw.contact === "object") {
    result.contact = { ...result.contact, ...raw.contact } as PersonalSiteConfig["contact"];
    result.contact.eyebrow = localized(raw.contact.eyebrow, defaultPersonalSiteConfig.contact.eyebrow);
    if (Array.isArray(raw.contact.customLinks)) {
      result.contact.customLinks = raw.contact.customLinks.map((link) => ({
        label: localized(link?.label, { en: "Link", ar: "رابط" }),
        url: typeof link?.url === "string" ? link.url : "",
      }));
    }
  }
  if (raw.footer && typeof raw.footer === "object") {
    result.footer = { ...result.footer, ...raw.footer } as PersonalSiteConfig["footer"];
    result.footer.text = localized(raw.footer.text, defaultPersonalSiteConfig.footer.text);
  }
  if (raw.theme && typeof raw.theme === "object") result.theme = { ...result.theme, ...raw.theme };
  return result;
}
