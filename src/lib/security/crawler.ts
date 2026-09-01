import { safeFetch } from "./http";

export interface CrawlResult {
  pagesVisited: number;
  jsFiles: { url: string; content: string }[];
  robotsTxt: string | null;
  sitemapXml: string | null;
  securityTxt: string | null;
  sourceMapFound: boolean;
}

export async function runPassiveCrawler(targetUrl: string, maxPages: number = 5): Promise<CrawlResult> {
  const result: CrawlResult = {
    pagesVisited: 1,
    jsFiles: [],
    robotsTxt: null,
    sitemapXml: null,
    securityTxt: null,
    sourceMapFound: false,
  };

  try {
    const parsed = new URL(targetUrl);
    const origin = parsed.origin;

    // Check robots.txt
    const robotsRes = await safeFetch(`${origin}/robots.txt`, { timeoutMs: 3000 });
    if (robotsRes && robotsRes.status === 200) {
      result.robotsTxt = robotsRes.body;
    }

    // Check sitemap.xml
    const sitemapRes = await safeFetch(`${origin}/sitemap.xml`, { timeoutMs: 3000 });
    if (sitemapRes && sitemapRes.status === 200) {
      result.sitemapXml = sitemapRes.body;
    }

    // Check security.txt
    const secRes = await safeFetch(`${origin}/.well-known/security.txt`, { timeoutMs: 3000 });
    if (secRes && secRes.status === 200) {
      result.securityTxt = secRes.body;
    }

    // Check source maps passive test
    const mapRes = await safeFetch(`${origin}/main.js.map`, { timeoutMs: 2000 });
    if (mapRes && mapRes.status === 200) {
      result.sourceMapFound = true;
    }
  } catch {
    // Graceful crawler fallback
  }

  return result;
}
