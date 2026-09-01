import { Finding } from "./types";
import { createFinding } from "./findings";
import { maskSensitiveValue } from "./secrets";

export function analyzeSetCookieHeaders(targetUrl: string, setCookieHeaders: string[]): Finding[] {
  const findings: Finding[] = [];

  if (!setCookieHeaders || setCookieHeaders.length === 0) {
    return findings;
  }

  for (const cookieStr of setCookieHeaders) {
    const parts = cookieStr.split(";").map((p) => p.trim());
    const nameVal = parts[0] || "";
    const eqIdx = nameVal.indexOf("=");
    const cookieName = eqIdx > 0 ? nameVal.substring(0, eqIdx) : nameVal;

    const lowerStr = cookieStr.toLowerCase();
    const hasSecure = lowerStr.includes("secure");
    const hasHttpOnly = lowerStr.includes("httponly");
    const hasSameSite = lowerStr.includes("samesite=");
    const domainPart = parts.find((p) => p.toLowerCase().startsWith("domain="));

    const isSessionCookie = /sess|auth|token|jwt|sid|id/i.test(cookieName);

    if (isSessionCookie && !hasSecure) {
      findings.push(
        createFinding({
          title: `Cookie de Sessão Sem Flag 'Secure' (${cookieName})`,
          severity: "HIGH",
          confidence: "HIGH",
          category: "Cookies",
          url: targetUrl,
          evidence: `Cookie '${cookieName}' definido sem o atributo Secure`,
          impact: "O cookie de autenticação pode ser transmitido via conexões HTTP não criptografadas, suscetível a interceptação de sessão.",
          recommendation: "Adicione a flag 'Secure' a todos os cookies de sessão ou sensíveis.",
        })
      );
    } else if (!hasSecure) {
      findings.push(
        createFinding({
          title: `Cookie Sem Flag 'Secure' (${cookieName})`,
          severity: "LOW",
          confidence: "HIGH",
          category: "Cookies",
          url: targetUrl,
          evidence: `Cookie '${cookieName}' sem atributo Secure`,
          impact: "O cookie pode ser exposto caso o usuário acesse o domínio via porta HTTP não segura.",
          recommendation: "Exija a flag 'Secure' para garantir que os cookies trafeguem apenas em HTTPS.",
        })
      );
    }

    if (isSessionCookie && !hasHttpOnly) {
      findings.push(
        createFinding({
          title: `Cookie de Sessão Sem Flag 'HttpOnly' (${cookieName})`,
          severity: "HIGH",
          confidence: "HIGH",
          category: "Cookies",
          url: targetUrl,
          evidence: `Cookie '${cookieName}' acessível via JavaScript (falta HttpOnly)`,
          impact: "Caso o sistema seja afetado por XSS, scripts maliciosos poderão ler este cookie e roubar a sessão do usuário.",
          recommendation: "Configure o atributo 'HttpOnly' em todos os cookies de sessão.",
        })
      );
    }

    if (!hasSameSite) {
      findings.push(
        createFinding({
          title: `Cookie Sem Atributo 'SameSite' (${cookieName})`,
          severity: "LOW",
          confidence: "HIGH",
          category: "Cookies",
          url: targetUrl,
          evidence: `Cookie '${cookieName}' sem SameSite definido`,
          impact: "A ausência de SameSite pode permitir o envio automático do cookie em requisições cross-site, aumentando o risco de CSRF.",
          recommendation: "Defina 'SameSite=Lax' ou 'SameSite=Strict' em cookies da aplicação.",
        })
      );
    }

    if (domainPart) {
      const domainVal = domainPart.substring("domain=".length).trim();
      if (domainVal.startsWith(".") && domainVal.split(".").length <= 3) {
        findings.push(
          createFinding({
            title: `Domínio de Cookie Excessivamente Amplo (${cookieName})`,
            severity: "MEDIUM",
            confidence: "MEDIUM",
            category: "Cookies",
            url: targetUrl,
            evidence: `Atributo domain: ${domainVal}`,
            impact: "Permite que todos os subdomínios da organização leiam ou sobrescrevam o cookie de sessão.",
            recommendation: "Restrinja o escopo do cookie ao hostname exato omitindo a diretiva Domain ou especificando o subdomínio completo.",
          })
        );
      }
    }
  }

  return findings;
}
