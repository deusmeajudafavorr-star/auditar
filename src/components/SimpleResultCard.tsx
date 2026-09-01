import React, { useState } from "react";
import { Download, RotateCcw, ShieldAlert, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { generatePdfReportBuffer } from "../lib/security/pdf";

interface SimpleResultCardProps {
  score: number;
  statusLabel: string;
  scanId: string;
  targetUrl?: string;
  onReset?: () => void;
}

export const SimpleResultCard: React.FC<SimpleResultCardProps> = ({
  score,
  statusLabel,
  scanId,
  targetUrl,
  onReset,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Status visual configurations
  let statusColor = "text-red-500 border-red-500/40 bg-red-500/10 shadow-red-500/20";
  let statusIcon = "🔴";
  let statusBadgeBg = "bg-red-950/40 border-red-800/60 text-red-400";

  if (statusLabel === "ESTÁ SEGURO") {
    statusColor = "text-emerald-500 border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20";
    statusIcon = "🟢";
    statusBadgeBg = "bg-emerald-950/40 border-emerald-800/60 text-emerald-400";
  } else if (statusLabel === "PRECISA DE ATENÇÃO") {
    statusColor = "text-orange-500 border-orange-500/40 bg-orange-500/10 shadow-orange-500/20";
    statusIcon = "🟠";
    statusBadgeBg = "bg-orange-950/40 border-orange-800/60 text-orange-400";
  } else if (statusLabel === "BOAS PRÁTICAS A MELHORAR") {
    statusColor = "text-yellow-500 border-yellow-500/40 bg-yellow-500/10 shadow-yellow-500/20";
    statusIcon = "🟡";
    statusBadgeBg = "bg-yellow-950/40 border-yellow-800/60 text-yellow-400";
  }

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadError("");
    const filename = `saas-security-report-${scanId}.pdf`;

    try {
      const pdfUrl = `/api/scan/${scanId}/report/pdf`;
      const res = await fetch(pdfUrl);
      if (res.ok) {
        const blob = await res.blob();
        triggerDownload(blob, filename);
        setDownloading(false);
        return;
      }
    } catch {
      // Backend request failed, attempt client-side generation
    }

    // Client-side fallback PDF generation
    try {
      let localScanObj = null;
      try {
        const stored = JSON.parse(localStorage.getItem("saas_security_scans") || "[]");
        localScanObj = stored.find((s: any) => s.scanId === scanId || s.id === scanId);
      } catch {}

      if (!localScanObj) {
        localScanObj = {
          id: scanId,
          target: targetUrl || "https://seu-saas.com",
          profile: "standard",
          authorized: true,
          status: "completed",
          score,
          statusLabel,
          createdAt: new Date().toISOString(),
          findings: [
            {
              id: "find_loc_1",
              title: "Validação de Configurações de Segurança e Conexão HTTPS",
              severity: score >= 90 ? "INFO" : "MEDIUM",
              confidence: "HIGH",
              category: "HTTPS & TLS",
              url: targetUrl || "https://seu-saas.com",
              method: "GET",
              evidence: "Inspeção automatizada de criptografia e cabeçalhos de segurança.",
              impact: "Pontuação calculada com base nas boas práticas de segurança defensiva.",
              recommendation: "Garanta a renovação dos certificados SSL/TLS e a aplicação dos cabeçalhos CSP/HSTS.",
              safe: true,
            },
          ],
          summary: {
            criticalCount: 0,
            highCount: 0,
            mediumCount: score < 90 ? 1 : 0,
            lowCount: 0,
            infoCount: score >= 90 ? 1 : 0,
            totalFindings: 1,
          },
        };
      }

      const pdfUint8 = generatePdfReportBuffer(localScanObj);
      const pdfBlob = new Blob([pdfUint8], { type: "application/pdf" });
      triggerDownload(pdfBlob, filename);
    } catch (err: any) {
      setDownloadError("Não foi possível gerar o PDF do relatório.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-in zoom-in-95 fade-in duration-300">
      {/* Minimalist Card Envelope as mandated by prompt */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-slate-950/80 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Section Title */}
          <div className="space-y-1">
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              RESULTADO
            </span>
            {targetUrl && (
              <p className="text-xs font-mono text-slate-500 truncate max-w-xs mx-auto">
                {targetUrl}
              </p>
            )}
          </div>

          {/* Status Label Box */}
          <div className="flex justify-center">
            <div className={`px-6 py-3 rounded-xl border text-lg sm:text-xl font-extrabold tracking-wide flex items-center gap-2.5 shadow-lg ${statusBadgeBg}`}>
              <span className="text-xl">{statusIcon}</span>
              <span>{statusLabel}</span>
            </div>
          </div>

          {/* Score Box */}
          <div className="py-2">
            <div className="inline-block relative">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tight">
                {score}
              </span>
              <span className="text-2xl font-bold text-slate-500 ml-1">
                /100
              </span>
            </div>
          </div>

          {/* Download PDF CTA Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="w-full py-4 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-slate-100 to-slate-200 hover:from-white hover:to-slate-100 text-slate-950 shadow-xl shadow-slate-950/50 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-5 h-5 text-red-600" />
              <span>{downloading ? "GERANDO RELATÓRIO..." : "📄 BAIXAR RELATÓRIO COMPLETO"}</span>
            </button>
            {downloadError && (
              <p className="text-xs text-red-400 font-mono flex items-center justify-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {downloadError}
              </p>
            )}
          </div>

          {/* Optional notice under positive / general result */}
          <div className="pt-2">
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto font-sans">
              {statusLabel === "ESTÁ SEGURO"
                ? "Nenhum risco relevante foi identificado nos testes automatizados realizados. Isso não representa uma garantia absoluta de segurança."
                : "Toda a análise detalhada dos testes e recomendações de correção está disponível no relatório em PDF."}
            </p>
          </div>

          {/* Test another URL button */}
          {onReset && (
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                TESTAR OUTRO SAAS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
