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
  const timeoutMs = options.timeoutMs || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const parsed = new URL(url);
    if (isPrivateOrReservedIP(parsed.hostname)) {
      throw new Error("SSRF blocked: Attempted request to restricted private IP or hostname.");
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "SaaS-Security-Auditor/1.0 (Defensive Compliance Scanner; +https://saas-security-auditor.local)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

    const body = await res.text();
    const finalUrl = res.url || url;
    const isHttps = finalUrl.startsWith("https://");
    const redirectsToHttps = url.startsWith("http://") && isHttps;

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
  } catch (err: any) {
    clearTimeout(timer);
    return null;
  }
}
