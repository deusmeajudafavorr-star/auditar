import { Finding } from "./types";
import { createFinding } from "./findings";

export function analyzeSitemapXml(targetUrl: string, content: string | null): Finding[] {
  const findings: Finding[] = [];
  if (!content) return findings;

  if (content.includes("<urlset") || content.includes("<sitemapindex")) {
    findings.push(
      createFinding({
        title: "Arquivo Sitemap XML Identificado",
        severity: "INFO",
        confidence: "HIGH",
        category: "Sitemap",
        url: `${targetUrl}/sitemap.xml`,
        evidence: "Sitemap válido encontrado no servidor",
        impact: "Facilita a navegação de motores de busca e mapeamento defensivo de URLs públicas.",
        recommendation: "Assegure-se de que URLs de áreas restritas ou staging não estejam incluídas no sitemap público.",
      })
    );
  }

  return findings;
}
