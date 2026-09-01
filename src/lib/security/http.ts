import { isPrivateOrReservedIP } from "./ssrf";

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  setCookieHeaders: string[];
  body: string;
  finalUrl: string;
  isHttps: boolean;
  redirectsToHttps: boolean;
  corsHeaders: { allowOrigin?: string; allowCredentials?: string };
}

export async function safeFetch(url: string, options: { timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<HttpResponse | null> {
  const timeoutMs = options.timeoutMs || 10000;

  const tryFetch = async (targetUrl: string, customUserAgent?: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const parsed = new URL(targetUrl);
      if (isPrivateOrReservedIP(parsed.hostname)) {
        throw new Error("SSRF blocked: Restricted private IP or hostname.");
      }

      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": customUserAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          ...options.headers,
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timer);

      const headersObj: Record<string, string> = {};
      const setCookieHeaders: string[] = [];

      res.headers.forEach((val, key) => {
        headersObj[key.toLowerCase()] = val;
        if (key.toLowerCase() === "set-cookie") {
          setCookieHeaders.push(val);
        }
      });

      const body = await res.text().catch(() => "");
      const finalUrl = res.url || targetUrl;
      const isHttps = finalUrl.startsWith("https://");
      const redirectsToHttps = targetUrl.startsWith("http://") && isHttps;

      return {
        status: res.status,
        headers: headersObj,
        setCookieHeaders,
        body,
        finalUrl,
        isHttps,
        redirectsToHttps,
        corsHeaders: {
          allowOrigin: headersObj["access-control-allow-origin"],
          allowCredentials: headersObj["access-control-allow-credentials"],
        },
      };
    } catch (err) {
      clearTimeout(timer);
      return null;
    }
  };

  // Attempt 1: Direct URL
  let result = await tryFetch(url);

  // Attempt 2: Fallback to http:// if https:// failed, or vice versa
  if (!result) {
    if (url.startsWith("https://")) {
      const httpUrl = url.replace("https://", "http://");
      result = await tryFetch(httpUrl);
    } else if (url.startsWith("http://")) {
      const httpsUrl = url.replace("http://", "https://");
      result = await tryFetch(httpsUrl);
    }
  }

  return result;
}
