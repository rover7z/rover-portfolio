import { PersonalSiteClient } from "../components/personal-site-client";
import { loadPersonalItems, loadPersonalSiteConfig } from "../lib/personal-data";

export default async function Home() {
  const [items, settings] = await Promise.all([loadPersonalItems(), loadPersonalSiteConfig()]);
  return <PersonalSiteClient items={items} settings={settings} />;
}
