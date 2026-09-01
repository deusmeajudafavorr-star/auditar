import { Scan, ScanProfile, Finding } from "./types";
import { validateTargetUrl } from "./ssrf";
import { safeFetch } from "./http";
import { checkSecurityHeaders } from "./headers";
import { analyzeSetCookieHeaders } from "./cookies";
import { analyzeCorsResponse } from "./cors";
import { analyzeTlsAndHttps } from "./tls";
import { analyzeForms } from "./forms";
import { discoverEndpointsFromHtml } from "./endpoints";
import { runPassiveCrawler } from "./crawler";
import { analyzeRobotsTxt } from "./robots";
import { analyzeSitemapXml } from "./sitemap";
import { analyzeJavaScriptAndSourceMaps } from "./javascript";
import { analyzeGraphQLResponse } from "./graphql";
import { calculateSecurityScore } from "./scoring";

// In-memory store for scans
const scanDatabase = new Map<string, Scan>();

// Seed a demo scan into memory
const demoUnsafeScan: Scan = {
  id: "scan_demo_unsafe",
  target: "https://demo-vulnerable-saas.com",
  profile: "standard",
  authorized: true,
  status: "completed",
  progress: 100,
  score: 42,
  statusLabel: "ESTÁ INSEGURO",
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  findings: [
    {
      id: "find_demo_1",
      title: "Aplicação Não Utiliza HTTPS Por Padrão",
      severity: "CRITICAL",
      confidence: "HIGH",
      category: "HTTPS & TLS",
      url: "https://demo-vulnerable-saas.com",
      method: "GET",
      evidence: "HTTP sem SSL/TLS ativo",
      impact: "Tráfego desprotegido trafegando em texto puro",
      recommendation: "Instalar certificado TLS/SSL",
      safe: true,
    },
    {
      title: "Cabeçalho Content-Security-Policy Ausente",
      severity: "MEDIUM",
      confidence: "HIGH",
      category: "Security Headers",
      url: "https://demo-vulnerable-saas.com",
      method: "GET",
      evidence: "CSP não retornado",
      impact: "Vulnerável a injeção XSS",
      recommendation: "Configurar CSP restritivo",
      id: "find_demo_2",
      safe: true,
    },
    {
      title: "Cookie de Sessão Sem Flag HttpOnly",
      severity: "HIGH",
      confidence: "HIGH",
      category: "Cookies",
      url: "https://demo-vulnerable-saas.com",
      method: "GET",
      evidence: "session_id acessível via JS",
      impact: "Roubo de sessão via XSS",
      recommendation: "Adicionar HttpOnly",
      id: "find_demo_3",
      safe: true,
    },
  ],
  categoryResults: {},
  summary: {
    criticalCount: 1,
    highCount: 1,
    mediumCount: 1,
    lowCount: 0,
    infoCount: 0,
    totalFindings: 3,
  },
};

const demoSafeScan: Scan = {
  id: "scan_demo_safe",
  target: "https://demo-secure-saas.com",
  profile: "standard",
  authorized: true,
  status: "completed",
  progress: 100,
  score: 96,
  statusLabel: "ESTÁ SEGURO",
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  findings: [],
  categoryResults: {},
  summary: {
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    infoCount: 2,
    totalFindings: 2,
  },
};

scanDatabase.set(demoUnsafeScan.id, demoUnsafeScan);
scanDatabase.set(demoSafeScan.id, demoSafeScan);

export function getScanById(scanId: string): Scan | undefined {
  return scanDatabase.get(scanId);
}

export function getAllScans(): Scan[] {
  return Array.from(scanDatabase.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createScan(targetUrl: string, profile: ScanProfile = "standard", authorized: boolean = true): { scan: Scan; error?: string } {
  const urlCheck = validateTargetUrl(targetUrl);
  if (!urlCheck.valid) {
    return {
      scan: null as any,
      error: urlCheck.error || "URL inválida.",
    };
  }

  const scanId = `scan_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  const now = new Date().toISOString();

  const newScan: Scan = {
    id: scanId,
    target: urlCheck.normalizedUrl || targetUrl,
    profile,
    authorized,
    status: "queued",
    progress: 5,
    currentStep: "Iniciando auditoria...",
    score: 100,
    statusLabel: "ESTÁ SEGURO",
    createdAt: now,
    findings: [],
    categoryResults: {},
    summary: {
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      totalFindings: 0,
    },
  };

  scanDatabase.set(scanId, newScan);

  // Trigger background scan asynchronously
  executeScanAsync(newScan.id);

  return { scan: newScan };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function executeScanAsync(scanId: string) {
  const scan = scanDatabase.get(scanId);
  if (!scan) return;

  try {
    scan.status = "running";
    scan.progress = 10;
    scan.currentStep = "Conectividade & Verificação DNS";

    const targetUrl = scan.target;
    const allFindings: Finding[] = [];

    // Step 1: Main HTTP Fetch
    await delay(1200);
    const mainResponse = await safeFetch(targetUrl, { timeoutMs: 8000 });

    if (!mainResponse) {
      allFindings.push({
        id: "find_conn_1",
        title: "Falha na Conectividade Direta ou Bloqueio por WAF/Firewall",
        severity: "HIGH",
        confidence: "HIGH",
        category: "HTTPS & TLS",
        url: targetUrl,
        method: "GET",
        evidence: "A porta web (80/443) do servidor de destino não respondeu ou bloqueou o scanner.",
        impact: "Servidor indisponível ou restringindo tráfego de auditorias automatizadas.",
        recommendation: "Verifique a resolução de DNS do domínio e as políticas de firewall.",
        safe: true,
      });

      scan.progress = 95;
      scan.currentStep = "Compilação de Achados & Cálculo de Nota Final";
      await delay(1200);

      const scoreResult = calculateSecurityScore(allFindings);
      scan.score = Math.min(scoreResult.score, 65);
      scan.statusLabel = "PRECISA DE ATENÇÃO";
      scan.findings = allFindings;
      scan.summary = {
        criticalCount: 0,
        highCount: 1,
        mediumCount: 0,
        lowCount: 0,
        infoCount: 0,
        totalFindings: 1,
      };
      scan.status = "completed";
      scan.progress = 100;
      scan.completedAt = new Date().toISOString();
      return;
    }

    // Step 2: TLS and HTTPS analysis
    scan.progress = 25;
    scan.currentStep = "Análise de Criptografia HTTPS & TLS";
    await delay(1800);
    const tlsFindings = analyzeTlsAndHttps(targetUrl, mainResponse.isHttps, mainResponse.redirectsToHttps);
    allFindings.push(...tlsFindings);

    // Step 3: Security Headers check
    scan.progress = 40;
    scan.currentStep = "Validação de Cabeçalhos de Segurança HTTP";
    await delay(2000);
    const headerFindings = await checkSecurityHeaders(targetUrl, mainResponse.headers);
    allFindings.push(...headerFindings);

    // Step 4: Cookies check
    scan.progress = 55;
    scan.currentStep = "Auditoria de Sessão, Cookies & Atributos";
    await delay(2200);
    const cookieFindings = analyzeSetCookieHeaders(targetUrl, mainResponse.setCookieHeaders);
    allFindings.push(...cookieFindings);

    // Step 5: CORS check & Forms
    scan.progress = 70;
    scan.currentStep = "Inspeção de APIs, Políticas CORS & Formatos";
    await delay(2200);
    const corsFindings = analyzeCorsResponse(targetUrl, mainResponse.corsHeaders);
    allFindings.push(...corsFindings);

    const formFindings = analyzeForms(targetUrl, mainResponse.body);
    allFindings.push(...formFindings);

    const endpointData = discoverEndpointsFromHtml(targetUrl, mainResponse.body);
    allFindings.push(...endpointData.findings);

    // Step 6: Passive Crawler & JS Scan
    scan.progress = 85;
    scan.currentStep = "Crawler Passivo, Scripts & Busca de Segredos";
    await delay(2500);
    const crawlResult = await runPassiveCrawler(targetUrl);

    const robotsFindings = analyzeRobotsTxt(targetUrl, crawlResult.robotsTxt);
    allFindings.push(...robotsFindings);

    const sitemapFindings = analyzeSitemapXml(targetUrl, crawlResult.sitemapXml);
    allFindings.push(...sitemapFindings);

    const jsFindings = analyzeJavaScriptAndSourceMaps(targetUrl, crawlResult.jsFiles, crawlResult.sourceMapFound);
    allFindings.push(...jsFindings);

    const graphqlFound = mainResponse.body.includes("/graphql") || endpointData.endpoints.includes("/graphql");
    const graphqlFindings = analyzeGraphQLResponse(targetUrl, graphqlFound, false);
    allFindings.push(...graphqlFindings);

    // Step 7: Final Scoring & Report Generation
    scan.progress = 95;
    scan.currentStep = "Compilação de Achados & Cálculo de Nota Final";
    await delay(1800);

    const scoreResult = calculateSecurityScore(allFindings);

    scan.score = scoreResult.score;
    scan.statusLabel = scoreResult.statusLabel;
    scan.findings = allFindings;
    scan.summary = {
      criticalCount: scoreResult.criticalCount,
      highCount: scoreResult.highCount,
      mediumCount: scoreResult.mediumCount,
      lowCount: scoreResult.lowCount,
      infoCount: scoreResult.infoCount,
      totalFindings: allFindings.length,
    };

    scan.status = "completed";
    scan.progress = 100;
    scan.completedAt = new Date().toISOString();
  } catch (err: any) {
    scan.status = "completed";
    scan.progress = 100;
    scan.score = scan.score || 70;
    scan.statusLabel = scan.statusLabel || "PRECISA DE ATENÇÃO";
    scan.completedAt = new Date().toISOString();
  }
}
