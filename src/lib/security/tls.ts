import { Finding } from "./types";
import { createFinding } from "./findings";

export function analyzeTlsAndHttps(targetUrl: string, isHttps: boolean, redirectsToHttps: boolean): Finding[] {
  const findings: Finding[] = [];

  if (!isHttps) {
    findings.push(
      createFinding({
        title: "Aplicação Não Utiliza HTTPS Por Padrão",
        severity: "CRITICAL",
        confidence: "HIGH",
        category: "HTTPS & TLS",
        url: targetUrl,
        evidence: "Esquema da URL principal utiliza HTTP sem criptografia SSL/TLS",
        impact: "Todo o tráfego, incluindo senhas, tokens e dados sensíveis, transita em texto puro pela rede e pode ser interceptado por terceiros.",
        recommendation: "Instale um certificado SSL/TLS válido e force todo o tráfego HTTP a redirecionar para HTTPS.",
      })
    );
  } else if (!redirectsToHttps) {
    findings.push(
      createFinding({
        title: "Falta de Redirecionamento Automático HTTP para HTTPS",
        severity: "HIGH",
        confidence: "HIGH",
        category: "HTTPS & TLS",
        url: targetUrl,
        evidence: "Porta 80 (HTTP) não redireciona automaticamente para 443 (HTTPS)",
        impact: "Usuários que digitarem a URL sem especificar 'https://' acessarão uma versão insegura e desprotegida da plataforma.",
        recommendation: "Configure um redirecionamento 301 (Permanent Redirect) de HTTP para HTTPS em todo o servidor.",
      })
    );
  }

  return findings;
}
