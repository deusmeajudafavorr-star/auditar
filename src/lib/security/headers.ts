import { Finding } from "./types";
import { createFinding } from "./findings";

export async function checkSecurityHeaders(targetUrl: string, responseHeaders: Record<string, string>): Promise<Finding[]> {
  const findings: Finding[] = [];
  const lowerHeaders: Record<string, string> = {};

  for (const [k, v] of Object.entries(responseHeaders)) {
    lowerHeaders[k.toLowerCase()] = v;
  }

  // Content-Security-Policy
  if (!lowerHeaders["content-security-policy"]) {
    findings.push(
      createFinding({
        title: "Cabeçalho Content-Security-Policy (CSP) Ausente",
        severity: "MEDIUM",
        confidence: "HIGH",
        category: "Security Headers",
        url: targetUrl,
        evidence: "Header Content-Security-Policy não retornado",
        impact: "A ausência de CSP aumenta o risco de execução de scripts não autorizados (Cross-Site Scripting - XSS) e injeção de dados.",
        recommendation: "Defina um cabeçalho Content-Security-Policy restritivo especificando as fontes confiáveis de scripts e recursos.",
      })
    );
  }

  // Strict-Transport-Security (HSTS)
  if (!lowerHeaders["strict-transport-security"]) {
    findings.push(
      createFinding({
        title: "Cabeçalho HTTP Strict Transport Security (HSTS) Ausente",
        severity: "MEDIUM",
        confidence: "HIGH",
        category: "Security Headers",
        url: targetUrl,
        evidence: "Header Strict-Transport-Security não retornado",
        impact: "Os usuários podem ser suscetíveis a ataques de downgrade de protocolo (HTTP) e interceptação de tráfego (Man-in-the-Middle).",
        recommendation: "Configure o HSTS com 'max-age=31536000; includeSubDomains; preload'.",
      })
    );
  }

  // X-Content-Type-Options
  if (!lowerHeaders["x-content-type-options"] || lowerHeaders["x-content-type-options"].toLowerCase() !== "nosniff") {
    findings.push(
      createFinding({
        title: "X-Content-Type-Options Ausente ou Incorreto",
        severity: "LOW",
        confidence: "HIGH",
        category: "Security Headers",
        url: targetUrl,
        evidence: `Valor retornado: ${lowerHeaders["x-content-type-options"] || "Nenhum"}`,
        impact: "O navegador pode tentar adivinhar o tipo MIME dos arquivos (MIME sniffing), podendo interpretar arquivos de texto como scripts executáveis.",
        recommendation: "Adicione o cabeçalho 'X-Content-Type-Options: nosniff'.",
      })
    );
  }

  // X-Frame-Options & CSP frame-ancestors
  const csp = lowerHeaders["content-security-policy"] || "";
  const hasFrameAncestors = csp.includes("frame-ancestors");
  if (!lowerHeaders["x-frame-options"] && !hasFrameAncestors) {
    findings.push(
      createFinding({
        title: "Proteção contra Clickjacking Ausente (X-Frame-Options / frame-ancestors)",
        severity: "MEDIUM",
        confidence: "HIGH",
        category: "Clickjacking",
        url: targetUrl,
        evidence: "Nenhum cabeçalho X-Frame-Options ou diretiva frame-ancestors encontrada",
        impact: "A aplicação pode ser incorporada em <iframe> em sites maliciosos para induzir o usuário a realizar ações não intencionais (Clickjacking).",
        recommendation: "Defina 'X-Frame-Options: DENY' (ou SAMEORIGIN) e adicione a diretiva 'frame-ancestors' na CSP.",
      })
    );
  }

  // Referrer-Policy
  if (!lowerHeaders["referrer-policy"]) {
    findings.push(
      createFinding({
        title: "Referrer-Policy Ausente",
        severity: "LOW",
        confidence: "HIGH",
        category: "Security Headers",
        url: targetUrl,
        evidence: "Header Referrer-Policy não especificado",
        impact: "URLs contendo tokens ou dados sensíveis na query string podem ser vazadas para domínios de terceiros via cabeçalho Referer.",
        recommendation: "Defina 'Referrer-Policy: strict-origin-when-cross-origin' ou 'no-referrer'.",
      })
    );
  }

  // Server Banner Disclosure
  if (lowerHeaders["server"] || lowerHeaders["x-powered-by"] || lowerHeaders["via"]) {
    const banners = [
      lowerHeaders["server"] ? `Server: ${lowerHeaders["server"]}` : null,
      lowerHeaders["x-powered-by"] ? `X-Powered-By: ${lowerHeaders["x-powered-by"]}` : null,
      lowerHeaders["via"] ? `Via: ${lowerHeaders["via"]}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    findings.push(
      createFinding({
        title: "Divulgação de Tecnologia no Cabeçalho HTTP (Server / X-Powered-By)",
        severity: "INFO",
        confidence: "HIGH",
        category: "Information Disclosure",
        url: targetUrl,
        evidence: banners,
        impact: "Expor a versão e tecnologia do servidor backend facilita a identificação de vulnerabilidades conhecidas por atacantes.",
        recommendation: "Remova ou oculte os cabeçalhos 'Server' e 'X-Powered-By' nas configurações do servidor proxy/web.",
      })
    );
  }

  return findings;
}
