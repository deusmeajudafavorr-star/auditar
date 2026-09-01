import express from "express";
import { createScan, getScanById, getAllScans } from "../src/lib/security/scanner";
import { generatePdfReportBuffer } from "../src/lib/security/pdf";

const app = express();
app.use(express.json());

// POST /api/scan
app.post("/api/scan", async (req, res) => {
  const { target, profile, authorized } = req.body || {};

  if (!authorized) {
    return res.status(400).json({
      error: "Você deve confirmar explicitamente autorização de propriedade para iniciar o teste.",
    });
  }

  if (!target) {
    return res.status(400).json({ error: "URL do SaaS é obrigatória." });
  }

  const result = createScan(target, profile || "standard", true);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    scanId: result.scan.id,
    status: result.scan.status,
  });
});

// GET /api/scan/:scanId
app.get("/api/scan/:scanId", (req, res) => {
  const scanId = req.params.scanId;
  const scan = getScanById(scanId);

  if (!scan) {
    return res.status(404).json({ error: "Auditoria não encontrada." });
  }

  return res.json({
    scanId: scan.id,
    status: scan.status,
    target: scan.target,
    score: scan.score,
    statusLabel: scan.statusLabel,
    completedAt: scan.completedAt,
    progress: scan.progress,
    currentStep: scan.currentStep,
    error: scan.error,
  });
});

// GET /api/scan/:scanId/report/pdf
app.get("/api/scan/:scanId/report/pdf", (req, res) => {
  const scanId = req.params.scanId;
  const scan = getScanById(scanId);

  if (!scan) {
    return res.status(404).send("Auditoria não encontrada.");
  }

  try {
    const pdfBuffer = generatePdfReportBuffer(scan);
    const filename = `saas-security-report-${scanId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    return res.status(500).send("Erro ao gerar relatório PDF.");
  }
});

// GET /api/scans
app.get("/api/scans", (req, res) => {
  const scans = getAllScans().map((s) => ({
    scanId: s.id,
    target: s.target,
    createdAt: s.createdAt,
    score: s.score,
    statusLabel: s.statusLabel,
    status: s.status,
  }));
  return res.json({ scans });
});

export default app;
