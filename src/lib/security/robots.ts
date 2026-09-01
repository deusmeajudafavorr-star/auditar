import { Finding } from "./types";
import { createFinding } from "./findings";

export function analyzeRobotsTxt(targetUrl: string, content: string | null): Finding[] {
  const findings: Finding[] = [];
  if (!content) return findings;

  const isSensitiveExposed = /Disallow:\s*\/(admin|backup|db|private|\.env|\.git|staging|internal)/i.test(content);

  if (isSensitiveExposed) {
    findings.push(
      createFinding({
        title: "Diretórios Sensíveis Listados no robots.txt",
        severity: "INFO",
        confidence: "HIGH",
        category: "Information Disclosure",
        url: `${targetUrl}/robots.txt`,
        evidence: "Regras 'Disallow' contêm referências a rotas internas/administrativas",
        impact: "Embora o robots.txt instrua buscadores legítimos a não indexar, ele expõe a localização de painéis internos para possíveis atacantes.",
        recommendation: "Não dependa de ocultação no robots.txt como controle de segurança. Proteja rotas com autenticação.",
      })
    );
  }

  return findings;
}
