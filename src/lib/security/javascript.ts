import { Finding } from "./types";
import { createFinding } from "./findings";
import { scanTextForSecrets } from "./secrets";

export function analyzeJavaScriptAndSourceMaps(
  targetUrl: string,
  jsFiles: { url: string; content: string }[],
  sourceMapFound: boolean
): Finding[] {
  const findings: Finding[] = [];

  for (const js of jsFiles) {
    const secretScan = scanTextForSecrets(js.content);
    if (secretScan.found) {
      for (const m of secretScan.matches) {
        findings.push(
          createFinding({
            title: `Possível Chave / Segredo Exposto em JavaScript Público (${m.type})`,
            severity: "HIGH",
            confidence: "MEDIUM",
            category: "JavaScript & Secrets",
            url: js.url,
            evidence: `Padrão identificado: ${m.snippet}`,
            impact: "Chaves de API privadas ou segredos expostos em bundles de frontend podem permitir acesso não autorizado a APIs e serviços de terceiros.",
            recommendation: "Mova chaves privadas para variáveis de ambiente no servidor backend e evite incluir segredos no código compilado do cliente.",
          })
        );
      }
    }
  }

  if (sourceMapFound) {
    findings.push(
      createFinding({
        title: "Arquivos de Source Map (.map) Expostos em Produção",
        severity: "LOW",
        confidence: "HIGH",
        category: "Information Disclosure",
        url: targetUrl,
        evidence: "Arquivos .js.map ou sourceMappingURL identificados em scripts estáticos público",
        impact: "Permite a reconstrução do código-fonte original em TypeScript/JavaScript, revelando estrutura de arquivos, comentários de desenvolvedores e rotas privadas.",
        recommendation: "Desative a geração de source maps em builds de produção ou restrinja o acesso publicamente no servidor web.",
      })
    );
  }

  return findings;
}
