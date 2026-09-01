import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createScan, getScanById, getAllScans } from "./src/lib/security/scanner";
import { generatePdfReportBuffer } from "./src/lib/security/pdf";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple Rate Limiting in memory
  const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/scan") && req.method === "POST") {
      const ip = req.ip || "unknown";
      const now = Date.now();
      const userLimit = ipRequestCounts.get(ip) || { count: 0, resetTime: now + 60000 };

      if (now > userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + 60000;
      }

      userLimit.count++;
      ipRequestCounts.set(ip, userLimit);

      if (userLimit.count > 10) {
        return res.status(429).json({ error: "Limite de requisições excedido. Aguarde 1 minuto." });
      }
    }
    next();
  });

  // --- API ROUTES ---

  // POST /api/scan
  app.post("/api/scan", (req, res) => {
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

    // Public minimal response - NO technical findings returned to public interface
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

      const d = new Date(scan.createdAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");

      const filename = `saas-security-report-${year}-${month}-${day}-${hours}-${mins}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.send(Buffer.from(pdfBuffer));
    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      return res.status(500).send("Erro ao gerar relatório PDF.");
    }
  });

  // GET /api/scans - Dashboard history
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

  // GET /api/demo - Demo endpoints
  app.get("/api/demo", (req, res) => {
    return res.json({
      unsafeDemo: {
        scanId: "scan_demo_unsafe",
        target: "https://demo-vulnerable-saas.com",
        score: 42,
        statusLabel: "ESTÁ INSEGURO",
      },
      safeDemo: {
        scanId: "scan_demo_safe",
        target: "https://demo-secure-saas.com",
        score: 96,
        statusLabel: "ESTÁ SEGURO",
      },
    });
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SaaS Security Auditor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
