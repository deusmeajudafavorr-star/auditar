import { Finding } from "./types";
import { createFinding } from "./findings";

const SENSITIVE_PATHS = [
  "/api/",
  "/api/v1/",
  "/api/v2/",
  "/graphql",
  "/login",
  "/logout",
  "/register",
  "/admin",
  "/dashboard",
  "/account",
  "/settings",
  "/webhook",
  "/.env",
  "/.git/config",
  "/config.json",
  "/swagger",
  "/api-docs",
  "/actuator",
  "/server-status",
];

export function discoverEndpointsFromHtml(targetUrl: string, htmlContent: string): { endpoints: string[]; findings: Finding[] } {
  const discovered = new Set<string>();
  const findings: Finding[] = [];

  if (!htmlContent) return { endpoints: [], findings };

  // Regex match links and script endpoints
  const hrefMatches = htmlContent.match(/(?:href|src|action|url)\s*=\s*["']([^"']+)["']/gi) || [];

  for (const match of hrefMatches) {
    const rawPath = match.replace(/^(?:href|src|action|url)\s*=\s*["']/i, "").replace(/["']$/, "");
    if (rawPath.startsWith("/") || rawPath.includes("/api/") || rawPath.includes("/admin")) {
      discovered.add(rawPath);
    }
  }

  // Check for highly sensitive exposed files/paths referenced
  const sensitiveExposed: string[] = [];
  for (const path of SENSITIVE_PATHS) {
    if (htmlContent.includes(path)) {
      sensitiveExposed.push(path);
    }
  }

  if (htmlContent.includes("/.env") || htmlContent.includes("/.git/")) {
    findings.push(
      createFinding({
        title: "Referência a Arquivo de Configuração Sensível (.env / .git)",
        severity: "HIGH",
        confidence: "HIGH",
        category: "Information Disclosure",
        url: targetUrl,
        evidence: "Código HTML ou JS faz referência direta a rotas sensíveis como .env ou .git",
        impact: "Pode indicar a presença de repositórios ou arquivos de ambiente expostos no servidor web.",
        recommendation: "Bloqueie acesso externo a diretórios ocultos (.git, .env, .svn) no servidor web.",
      })
    );
  }

  if (sensitiveExposed.length > 0) {
    findings.push(
      createFinding({
        title: "Mapeamento de Rotas e Endpoints de API",
        severity: "INFO",
        confidence: "HIGH",
        category: "Endpoints Inventory",
        url: targetUrl,
        evidence: `Endpoints observados no código público: ${sensitiveExposed.slice(0, 5).join(", ")}`,
        impact: "Inventário defensivo das superfícies e rotas acessíveis na aplicação.",
        recommendation: "Garanta que endpoints administrativos e de API apliquem controle de acesso (RBAC) e autenticação adequados.",
      })
    );
  }

  return { endpoints: Array.from(discovered), findings };
}
