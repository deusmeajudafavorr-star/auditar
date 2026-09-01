import net from "net";

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^localhost$/i,
];

export interface URLValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
  hostname?: string;
}

export function isPrivateOrReservedIP(ipOrHost: string): boolean {
  const host = ipOrHost.toLowerCase().trim();
  if (host === "localhost" || host === "0.0.0.0" || host === "::1") return true;

  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(host)) return true;
  }

  return false;
}

export function validateTargetUrl(rawUrl: string): URLValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL inválida ou ausente." };
  }

  let formatted = rawUrl.trim();
  if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
    formatted = "https://" + formatted;
  }

  try {
    const parsed = new URL(formatted);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Apenas esquemas HTTP e HTTPS são permitidos." };
    }

    const hostname = parsed.hostname;

    if (isPrivateOrReservedIP(hostname)) {
      return {
        valid: false,
        error: "Endereços IP privados, localhost ou redes internas não são permitidos por segurança (SSRF Protection).",
      };
    }

    // Check for weird auth in URL like http://user:pass@host
    if (parsed.username || parsed.password) {
      return { valid: false, error: "URLs com credenciais não são permitidas." };
    }

    return {
      valid: true,
      normalizedUrl: parsed.origin + parsed.pathname,
      hostname: parsed.hostname,
    };
  } catch {
    return { valid: false, error: "Formato de URL inválido. Exemplo: https://meusaas.com" };
  }
}
