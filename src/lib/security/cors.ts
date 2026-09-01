import { Finding } from "./types";
import { createFinding } from "./findings";

export function analyzeCorsResponse(
  targetUrl: string,
  corsHeaders: { allowOrigin?: string; allowCredentials?: string }
): Finding[] {
  const findings: Finding[] = [];
  const allowOrigin = corsHeaders.allowOrigin?.trim();
  const allowCredentials = corsHeaders.allowCredentials?.trim().toLowerCase() === "true";

  if (allowOrigin === "*") {
    findings.push(
      createFinding({
        title: "Política CORS Permissiva (Access-Control-Allow-Origin: *)",
        severity: "LOW",
        confidence: "HIGH",
        category: "CORS",
        url: targetUrl,
        evidence: "Access-Control-Allow-Origin: *",
        impact: "Qualquer site externo pode realizar requisições de leitura de recursos públicos nesta aplicação via browser.",
        recommendation: "Caso o recurso não seja estritamente público, configure uma lista explícita de origens permitidas.",
      })
    );
  } else if (allowOrigin === "https://example.invalid" || allowOrigin === "null") {
    if (allowCredentials) {
      findings.push(
        createFinding({
          title: "CORS Criticamente Permissivo com Credenciais (Arbitrary Origin + Credentials)",
          severity: "HIGH",
          confidence: "HIGH",
          category: "CORS",
          url: targetUrl,
          evidence: `Origin enviado: https://example.invalid => ACAO: ${allowOrigin}, ACAC: true`,
          impact: "Um site malicioso pode forçar o navegador da vítima a realizar requisições autenticadas e ler dados privados da resposta.",
          recommendation: "Valide a origem contra uma lista restrita de domínios autorizados e recuse origens não reconhecidas.",
        })
      );
    } else {
      findings.push(
        createFinding({
          title: "CORS Reflete Origens Arbitrárias sem Validação",
          severity: "MEDIUM",
          confidence: "HIGH",
          category: "CORS",
          url: targetUrl,
          evidence: `Origin não confiável aceito: ${allowOrigin}`,
          impact: "Permite que domínios arbitrários leiam as respostas de API do SaaS.",
          recommendation: "Implemente um whitelist rigoroso de origens permitidas no servidor backend.",
        })
      );
    }
  }

  return findings;
}
