import { Finding } from "./types";
import { createFinding } from "./findings";

export function analyzeForms(targetUrl: string, htmlContent: string): Finding[] {
  const findings: Finding[] = [];
  if (!htmlContent) return findings;

  // Simple safe static analysis of forms
  const formMatches = htmlContent.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];

  let loginFormsCount = 0;
  let passwordInputWithoutHttps = false;
  let uploadFormsCount = 0;
  let formsWithoutCsrfToken = 0;

  const isCurrentHttps = targetUrl.startsWith("https://");

  for (const formHtml of formMatches) {
    const hasPassword = /type=["']password["']/i.test(formHtml);
    const hasUpload = /type=["']file["']/i.test(formHtml);
    const actionMatch = formHtml.match(/action=["']([^"']*)["']/i);
    const actionUrl = actionMatch ? actionMatch[1] : "";
    const methodMatch = formHtml.match(/method=["']([^"']*)["']/i);
    const method = methodMatch ? methodMatch[1].toUpperCase() : "GET";

    if (hasPassword) {
      loginFormsCount++;
      if (!isCurrentHttps || (actionUrl.startsWith("http://") && !actionUrl.startsWith("https://"))) {
        passwordInputWithoutHttps = true;
      }
    }

    if (hasUpload) {
      uploadFormsCount++;
    }

    // Check for POST/PUT/DELETE forms lacking common CSRF token fields
    if (method === "POST" || method === "PUT") {
      const hasCsrf = /csrf|token|_token|authenticity_token|xsrf/i.test(formHtml);
      if (!hasCsrf) {
        formsWithoutCsrfToken++;
      }
    }
  }

  if (passwordInputWithoutHttps) {
    findings.push(
      createFinding({
        title: "Formulário de Autenticação Transmitido em HTTP Inseguro",
        severity: "CRITICAL",
        confidence: "HIGH",
        category: "Forms & Auth",
        url: targetUrl,
        evidence: "Formulário contendo campo de senha com envio/ação em HTTP sem criptografia",
        impact: "Credenciais de login serão enviadas em texto claro pela rede, facilitando o roubo de contas.",
        recommendation: "Garanta que a página de login e o endpoint de destino do formulário utilizem exclusivamente o protocolo HTTPS.",
      })
    );
  }

  if (uploadFormsCount > 0) {
    findings.push(
      createFinding({
        title: "Formulário de Upload de Arquivos Detectado",
        severity: "INFO",
        confidence: "HIGH",
        category: "Forms & Upload",
        url: targetUrl,
        evidence: `Foram identificados ${uploadFormsCount} formulário(s) de upload de arquivo(s)`,
        impact: "Formulários de upload necessitam de validações rigorosas de tipo de arquivo, tamanho, renomeação de arquivo e armazenamento fora da raiz da aplicação.",
        recommendation: "Valide extensões no servidor, re-encodifique imagens e restrinja privilégios de execução no diretório de upload.",
      })
    );
  }

  if (formsWithoutCsrfToken > 0) {
    findings.push(
      createFinding({
        title: "Formulário POST sem Token CSRF Observável no HTML",
        severity: "LOW",
        confidence: "MEDIUM",
        category: "CSRF",
        url: targetUrl,
        evidence: `Foram detectados ${formsWithoutCsrfToken} formulário(s) sem campo hidden com nome de token CSRF padrão`,
        impact: "Caso o sistema dependa apenas de cookies de sessão e não utilize SameSite=Strict ou cabeçalhos Custom Header, pode ser vulnerável a CSRF.",
        recommendation: "Implemente verificação de tokens anti-CSRF por requisição ou utilize cabeçalhos customizados com cookies SameSite=Lax/Strict.",
      })
    );
  }

  return findings;
}
