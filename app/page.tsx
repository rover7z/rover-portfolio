import { PortfolioClient } from "../components/portfolio-client";
import { loadPortfolioItems, loadSiteConfig } from "../lib/load-content";

export default async function Home() {
  const [items, settings] = await Promise.all([loadPortfolioItems(), loadSiteConfig()]);
  return <PortfolioClient items={items} settings={settings} />;
}
