import { PortfolioClient } from "../components/portfolio-client";
import { loadPortfolioItems } from "../lib/load-content";

export default async function Home() {
  const items = await loadPortfolioItems();
  return <PortfolioClient items={items} />;
}
