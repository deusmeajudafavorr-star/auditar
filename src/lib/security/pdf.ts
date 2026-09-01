import { jsPDF } from "jspdf";
import { Scan } from "./types";

// Helper to sanitize text for jsPDF WinAnsi encoding (removes emojis, bullet points, em-dashes)
function safeText(str: string): string {
  if (!str) return "";
  return str
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/•/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[^\x00-\xFF]/g, "");
}

export function generatePdfReportBuffer(scan: Scan): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const addHeader = (title: string) => {
    doc.setFillColor(15, 23, 42); // Slate dark background header bar
    doc.rect(0, 0, pageWidth, 22, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(248, 250, 252);
    doc.text("SAAS SECURITY AUDITOR", margin, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(safeText(title), pageWidth - margin, 14, { align: "right" });

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(0, 22, pageWidth, 22);
  };

  const addFooter = (pageNum: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`SaaS Security Auditor - Relatorio Estritamente Confidencial - Pagina ${pageNum}`, margin, pageHeight - 10);
    doc.text(`Gerado em: ${new Date(scan.createdAt).toLocaleString("pt-BR")}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 30;
      addHeader("Relatório de Auditoria de Segurança");
      addFooter(doc.getNumberOfPages());
    }
  };

  // --- COVER PAGE ---
  doc.setFillColor(10, 14, 23); // Deep cyber dark cover
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Glowing subtle accent bar
  doc.setFillColor(239, 68, 68); // Red glow if unsafe
  if (scan.statusLabel === "ESTÁ SEGURO") doc.setFillColor(34, 197, 94);
  else if (scan.statusLabel === "PRECISA DE ATENÇÃO") doc.setFillColor(249, 115, 22);
  else if (scan.statusLabel === "BOAS PRÁTICAS A MELHORAR") doc.setFillColor(234, 179, 8);
  doc.rect(margin, 25, 4, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("SAAS SECURITY AUDITOR", margin + 10, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(148, 163, 184);
  doc.text("RELATÓRIO DE AUDITORIA DE SEGURANÇA", margin + 10, 50);

  // Metadata Card Box
  doc.setFillColor(23, 32, 51);
  doc.roundedRect(margin, 80, contentWidth, 55, 3, 3, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("TARGET (ALVO):", margin + 10, 93);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(safeText(scan.target), margin + 45, 93);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("DATA DO SCAN:", margin + 10, 105);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(new Date(scan.createdAt).toLocaleDateString("pt-BR") + " " + new Date(scan.createdAt).toLocaleTimeString("pt-BR"), margin + 45, 105);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("PERFIL AUDITADO:", margin + 10, 117);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(safeText(scan.profile.toUpperCase()), margin + 45, 117);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("ID DA AUDITORIA:", margin + 10, 129);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(safeText(scan.id), margin + 45, 129);

  // Big Result Banner Box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, 150, contentWidth, 75, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.text("RESULTADO DA AUDITORIA", margin + 15, 165);

  doc.setFontSize(22);
  let statusColor = [239, 68, 68]; // Red
  if (scan.statusLabel === "ESTÁ SEGURO") {
    statusColor = [34, 197, 94];
  } else if (scan.statusLabel === "PRECISA DE ATENÇÃO") {
    statusColor = [249, 115, 22];
  } else if (scan.statusLabel === "BOAS PRÁTICAS A MELHORAR") {
    statusColor = [234, 179, 8];
  }

  // Draw status indicator circle
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.circle(margin + 18, 180, 3.5, "F");

  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(safeText(scan.statusLabel), margin + 25, 182);

  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${scan.score}`, margin + 15, 210);
  doc.setFontSize(18);
  doc.setTextColor(148, 163, 184);
  doc.text("/ 100", margin + 50, 208);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.text("Relatório emitido automaticamente por SaaS Security Auditor - Documento Oficial", margin + 15, 245);

  addFooter(1);

  // --- PAGE 2: EXECUTIVE SUMMARY & CATEGORY SCORES ---
  doc.addPage();
  y = 30;
  addHeader("Resumo Executivo & Metodologia");
  addFooter(doc.getNumberOfPages());

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("1. RESUMO EXECUTIVO", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const execSummaryText =
    `Esta auditoria de segurança automatizada foi executada para avaliar a postura defensiva do SaaS localizado em ${scan.target}. ` +
    `Foram realizadas verificações não intrusivas cobrindo criptografia HTTPS/TLS, cabeçalhos de segurança HTTP, atributos de cookies, ` +
    `políticas CORS, proteção contra Clickjacking, formulários e CSRF, identificação de rotas e segredos em scripts públicos.`;

  const splitSummary = doc.splitTextToSize(safeText(execSummaryText), contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 5 + 6;

  // Findings Breakdown Table Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("2. CLASSIFICAÇÃO DOS ACHADOS", margin, y);
  y += 8;

  const severities = [
    { name: "CRITICAL (Crítico)", count: scan.summary.criticalCount, color: [220, 38, 38] },
    { name: "HIGH (Alto)", count: scan.summary.highCount, color: [234, 88, 12] },
    { name: "MEDIUM (Médio)", count: scan.summary.mediumCount, color: [217, 119, 6] },
    { name: "LOW (Baixo)", count: scan.summary.lowCount, color: [202, 138, 4] },
    { name: "INFO (Informativo)", count: scan.summary.infoCount, color: [37, 99, 235] },
  ];

  for (const sev of severities) {
    checkPageBreak(12);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");

    doc.setFillColor(sev.color[0], sev.color[1], sev.color[2]);
    doc.rect(margin, y, 4, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(safeText(sev.name), margin + 8, y + 6.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(sev.color[0], sev.color[1], sev.color[2]);
    doc.text(`${sev.count}`, pageWidth - margin - 10, y + 6.5, { align: "right" });

    y += 13;
  }

  y += 6;

  // Category status breakdown
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("3. STATUS DAS CATEGORIAS AUDITADAS", margin, y);
  y += 8;

  const categoriesList = [
    "HTTPS & TLS",
    "Security Headers",
    "Cookies",
    "CORS",
    "Clickjacking",
    "Forms & Auth",
    "CSRF",
    "Endpoints Inventory",
    "Robots & Sitemap",
    "JavaScript & Secrets",
    "GraphQL",
    "Information Disclosure",
  ];

  for (const catName of categoriesList) {
    checkPageBreak(10);
    const catFinding = scan.findings.filter((f) => f.category === catName || f.category.includes(catName));
    const isPass = catFinding.length === 0;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 8, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(safeText(catName), margin + 4, y + 5.5);

    if (isPass) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("PASS [APROVADO]", pageWidth - margin - 4, y + 5.5, { align: "right" });
    } else {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(`WARNING (${catFinding.length} achado[s])`, pageWidth - margin - 4, y + 5.5, { align: "right" });
    }

    y += 10;
  }

  // --- PAGE 3+: DETAILED FINDINGS ---
  doc.addPage();
  y = 30;
  addHeader("Detalhamento Técnico dos Achados");
  addFooter(doc.getNumberOfPages());

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("4. DETALHAMENTO DE ACHADOS E RECOMENDAÇÕES", margin, y);
  y += 10;

  if (scan.findings.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);
    doc.text("Nenhum risco relevante foi identificado nos testes automatizados realizados.", margin, y);
    y += 10;
  } else {
    for (const f of scan.findings) {
      checkPageBreak(55);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 50, 2, 2, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 50, 2, 2, "S");

      // Badge severity bar
      let bColor = [220, 38, 38];
      if (f.severity === "HIGH") bColor = [234, 88, 12];
      if (f.severity === "MEDIUM") bColor = [217, 119, 6];
      if (f.severity === "LOW") bColor = [202, 138, 4];
      if (f.severity === "INFO") bColor = [37, 99, 235];

      doc.setFillColor(bColor[0], bColor[1], bColor[2]);
      doc.rect(margin, y, 4, 50, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(safeText(`[${f.id}] ${f.title}`), margin + 8, y + 7);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(bColor[0], bColor[1], bColor[2]);
      doc.text(safeText(`SEVERIDADE: ${f.severity}`), margin + 8, y + 14);

      doc.setTextColor(100, 116, 139);
      doc.text(safeText(`CATEGORIA: ${f.category}  |  MÉTODO: ${f.method}`), margin + 65, y + 14);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("EVIDÊNCIA:", margin + 8, y + 21);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const evText = doc.splitTextToSize(safeText(f.evidence), contentWidth - 35);
      doc.text(evText.slice(0, 1), margin + 32, y + 21);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("IMPACTO:", margin + 8, y + 28);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const impText = doc.splitTextToSize(safeText(f.impact), contentWidth - 35);
      doc.text(impText.slice(0, 2), margin + 32, y + 28);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("RECOMENDAÇÃO:", margin + 8, y + 40);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const recText = doc.splitTextToSize(safeText(f.recommendation), contentWidth - 42);
      doc.text(recText.slice(0, 2), margin + 40, y + 40);

      y += 56;
    }
  }

  // --- METHODOLOGY & LIMITATIONS SECTION ---
  checkPageBreak(65);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("5. METODOLOGIA E LIMITAÇÕES DA AUDITORIA", margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text("METODOLOGIA DE PONTUAÇÃO (SCORE):", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const scoreExpl =
    "A nota de segurança varia de 0 a 100. Cada achado aplica a seguinte penalidade base: " +
    "CRITICAL (-25 pontos), HIGH (-12 pontos), MEDIUM (-6 pontos), LOW (-2 pontos), INFO (0 pontos). " +
    "A pontuação final é limitada ao intervalo [0, 100].";
  const splitScoreExpl = doc.splitTextToSize(safeText(scoreExpl), contentWidth);
  doc.text(splitScoreExpl, margin, y);
  y += splitScoreExpl.length * 4.5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text("PARÂMETROS DE AUDITORIA:", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("- Requisições por Segundo: Max 2 req/s  |  Timeout por Requisição: 10 segundos", margin, y);
  y += 5;
  doc.text("- Profundidade Máxima de Crawler: 3 níveis  |  Limite de Páginas: 100 páginas", margin, y);
  y += 5;
  doc.text("- Proteção SSRF: Ativa (Bloqueio automático de IP interno, localhost e 169.254.169.254)", margin, y);
  y += 10;

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "F");
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text("AVISO LEGAL DE LIMITAÇÕES DA AUDITORIA:", margin + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(127, 29, 29);
  const disclaimerText =
    "Este relatório representa somente os testes automatizados realizados durante esta auditoria. " +
    "A ausência de findings não constitui garantia absoluta de segurança e não substitui um teste de intrusão (Pentest) profissional e manual. " +
    "Todas as evidências contendo tokens ou senhas foram automaticamente mascaradas (********) por razões de privacidade.";
  const splitDisclaimer = doc.splitTextToSize(safeText(disclaimerText), contentWidth - 12);
  doc.text(splitDisclaimer, margin + 6, y + 13);

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

