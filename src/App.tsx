import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { ScanProgressView } from "./components/ScanProgressView";
import { SimpleResultCard } from "./components/SimpleResultCard";
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowRight, Lock, CheckCircle2, FileText, History, RefreshCw, ExternalLink } from "lucide-react";

export default function App() {
  const [currentPath, setCurrentPath] = useState("/");

  // Form & Scan State
  const [targetUrl, setTargetUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active scan session
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Iniciando auditoria...");
  const [scanResult, setScanResult] = useState<{ score: number; statusLabel: string; target: string } | null>(null);

  // Dashboard state
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Poll active scan if running
  useEffect(() => {
    let interval: any = null;

    if (activeScanId && scanStatus === "running") {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/scan/${activeScanId}`);
          if (!res.ok) return;

          const data = await res.json();
          setScanProgress(data.progress || 10);
          if (data.currentStep) setCurrentStep(data.currentStep);

          if (data.status === "completed") {
            setScanStatus("completed");
            setScanResult({
              score: data.score,
              statusLabel: data.statusLabel,
              target: data.target,
            });
            clearInterval(interval);
          } else if (data.status === "failed") {
            setScanStatus("failed");
            setUrlError(data.error || "A auditoria falhou. Verifique se o servidor está online.");
            clearInterval(interval);
          }
        } catch {
          // ignore transient poll error
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeScanId, scanStatus]);

  // Handle URL form submit (Trigger Authorization modal)
  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");

    if (!targetUrl.trim()) {
      setUrlError("Por favor, informe a URL do seu SaaS.");
      return;
    }

    let formatted = targetUrl.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = "https://" + formatted;
      setTargetUrl(formatted);
    }

    try {
      const parsed = new URL(formatted);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        setUrlError("Por razões de segurança (SSRF), redes locais/localhost não são permitidas.");
        return;
      }
    } catch {
      setUrlError("Formato de URL inválido. Exemplo: https://meusaas.com");
      return;
    }

    // Open Authorization modal
    setIsAuthModalOpen(true);
  };

  // Trigger scan API call after authorization confirmation
  const handleStartScan = async () => {
    setIsAuthModalOpen(false);
    setScanStatus("running");
    setScanProgress(10);
    setCurrentStep("Registrando scan na plataforma...");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetUrl,
          profile: "standard",
          authorized: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScanStatus("failed");
        setUrlError(data.error || "Erro ao iniciar o teste de segurança.");
        return;
      }

      setActiveScanId(data.scanId);
    } catch (err: any) {
      setScanStatus("failed");
      setUrlError("Não foi possível comunicar com o servidor da plataforma.");
    }
  };

  // Reset scan state back to home
  const handleResetScan = () => {
    setActiveScanId(null);
    setScanStatus("idle");
    setScanProgress(0);
    setScanResult(null);
    setUrlError("");
  };

  // Fetch Dashboard History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/scans");
      if (res.ok) {
        const data = await res.json();
        setScanHistory(data.scans || []);
      }
    } catch {
      // fallback
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (currentPath === "/dashboard") {
      fetchHistory();
    }
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Cybersecurity Top Header */}
      <Header currentPath={currentPath} onNavigate={(path) => setCurrentPath(path)} />

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col">
        {/* LANDING PAGE ROUTE ( / ) */}
        {currentPath === "/" && (
          <div className="flex-1">
            {scanStatus === "idle" && (
              <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 space-y-20">
                {/* HERO SECTION */}
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-semibold tracking-wide">
                    <Lock className="w-3.5 h-3.5" />
                    PLATAFORMA AUTOMATIZADA DE SEGURANÇA SAAS
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                    SEU SAAS ESTÁ <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
                      REALMENTE SEGURO?
                    </span>
                  </h1>

                  <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                    Cole a URL do seu SaaS e descubra se existem problemas de segurança que precisam ser corrigidos.
                  </p>

                  {/* URL INPUT FORM */}
                  <form onSubmit={handleSubmitUrl} className="max-w-xl mx-auto pt-4 space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch gap-3 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl focus-within:border-red-500/60 transition-colors">
                      <input
                        type="text"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://seu-saas.com"
                        className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none text-sm font-mono"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm rounded-lg shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                      >
                        TESTAR MEU SAAS
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {urlError && (
                      <p className="text-xs font-mono text-red-400 flex items-center justify-center gap-1.5 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {urlError}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 pt-1 font-mono">
                      Somente teste sistemas próprios ou em que você tenha autorização.
                    </p>
                  </form>
                </div>

                {/* VISUAL PROCESS WORKFLOW */}
                <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl max-w-2xl mx-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1 p-3">
                      <div className="text-xs font-mono text-red-400 font-bold">01</div>
                      <div className="text-sm font-bold text-white">COLE A URL</div>
                    </div>
                    <div className="space-y-1 p-3">
                      <div className="text-xs font-mono text-slate-500 font-bold">02</div>
                      <div className="text-sm font-bold text-white">ANALISANDO</div>
                    </div>
                    <div className="space-y-1 p-3">
                      <div className="text-xs font-mono text-slate-500 font-bold">03</div>
                      <div className="text-sm font-bold text-white">NOTA</div>
                    </div>
                    <div className="space-y-1 p-3">
                      <div className="text-xs font-mono text-slate-500 font-bold">04</div>
                      <div className="text-sm font-bold text-white">PDF COMPLETO</div>
                    </div>
                  </div>
                </div>

                {/* IMPACT COPY SECTION */}
                <div className="space-y-12 border-t border-slate-800/60 pt-16">
                  <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      SEU SAAS PODE ESTAR FUNCIONANDO PERFEITAMENTE... <br />
                      <span className="text-red-400">E AINDA ASSIM TER PROBLEMAS DE SEGURANÇA.</span>
                    </h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {[
                      "Um cookie sem flag HttpOnly ou Secure.",
                      "Um header HTTP de segurança ausente.",
                      "Uma política CORS excessivamente permissiva.",
                      "Uma configuração ou rota esquecida.",
                      "Uma informação ou segredo exposto em scripts público.",
                    ].map((detail, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-start gap-3"
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                        <span className="text-slate-300 text-sm">{detail}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-slate-400 text-sm mb-6">
                      Pequenos detalhes podem virar grandes problemas.
                    </p>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-colors"
                    >
                      TESTAR MEU SAAS
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCAN RUNNING IN PROGRESS */}
            {scanStatus === "running" && (
              <div className="py-20 px-4">
                <ScanProgressView
                  targetUrl={targetUrl}
                  progress={scanProgress}
                  currentStep={currentStep}
                />
              </div>
            )}

            {/* SCAN COMPLETED -> MINIMALIST SIMPLE RESULT CARD */}
            {scanStatus === "completed" && scanResult && (
              <div className="py-20 px-4">
                <SimpleResultCard
                  score={scanResult.score}
                  statusLabel={scanResult.statusLabel}
                  scanId={activeScanId!}
                  targetUrl={scanResult.target}
                  onReset={handleResetScan}
                />
              </div>
            )}

            {/* SCAN FAILED STATE */}
            {scanStatus === "failed" && (
              <div className="py-20 px-4 max-w-md mx-auto text-center space-y-6">
                <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto" />
                  <h3 className="font-bold text-lg text-white">⚠️ NÃO FOI POSSÍVEL ANALISAR</h3>
                  <p className="text-xs text-slate-300">
                    {urlError || "Não foi possível concluir os testes automatizados neste alvo."}
                  </p>
                </div>
                <button
                  onClick={handleResetScan}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  TENTAR NOVAMENTE
                </button>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD HISTÓRICO ROUTE ( /dashboard ) */}
        {currentPath === "/dashboard" && (
          <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <History className="w-6 h-6 text-red-400" />
                  Histórico de Auditorias
                </h1>
                <p className="text-xs text-slate-400">
                  Acesse o resultado minimalista e relatórios PDF de scans anteriores.
                </p>
              </div>
              <button
                onClick={fetchHistory}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
              </button>
            </div>

            {scanHistory.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <p className="text-slate-400 text-sm">Nenhuma auditoria registrada até o momento.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {scanHistory.map((scan) => {
                  let badgeBg = "bg-red-950/40 text-red-400 border-red-800/60";
                  let statusEmoji = "🔴";
                  if (scan.statusLabel === "ESTÁ SEGURO") {
                    badgeBg = "bg-emerald-950/40 text-emerald-400 border-emerald-800/60";
                    statusEmoji = "🟢";
                  } else if (scan.statusLabel === "PRECISA DE ATENÇÃO") {
                    badgeBg = "bg-orange-950/40 text-orange-400 border-orange-800/60";
                    statusEmoji = "🟠";
                  } else if (scan.statusLabel === "BOAS PRÁTICAS A MELHORAR") {
                    badgeBg = "bg-yellow-950/40 text-yellow-400 border-yellow-800/60";
                    statusEmoji = "🟡";
                  }

                  return (
                    <div
                      key={scan.scanId}
                      className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-sm font-bold text-white break-all">
                          {scan.target}
                        </span>
                        <div className="text-xs text-slate-500 font-mono">
                          {new Date(scan.createdAt).toLocaleString("pt-BR")}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${badgeBg}`}>
                          <span>{statusEmoji}</span>
                          <span>{scan.statusLabel}</span>
                          <span className="ml-1 text-white font-mono font-extrabold">{scan.score}/100</span>
                        </div>

                        <a
                          href={`/api/scan/${scan.scanId}/report/pdf`}
                          download
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                          PDF
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LIVE STREAM ROUTE ( /live ) */}
        {currentPath === "/live" && (
          <div className="max-w-md mx-auto px-4 py-12 flex-1 w-full space-y-8 flex flex-col justify-center">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-black text-white tracking-wider uppercase">
                SAAS SECURITY AUDITOR
              </h1>
              <p className="text-xs text-red-400 font-mono animate-pulse">
                • MODO TRANSMISSÃO / LIVE
              </p>
            </div>

            {scanStatus === "idle" && (
              <form onSubmit={handleSubmitUrl} className="space-y-4">
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-center font-mono text-sm text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-red-600 hover:bg-red-500 font-bold text-sm rounded-xl text-white transition-colors"
                >
                  TESTAR
                </button>
              </form>
            )}

            {scanStatus === "running" && (
              <ScanProgressView targetUrl={targetUrl} progress={scanProgress} currentStep={currentStep} />
            )}

            {scanStatus === "completed" && scanResult && (
              <SimpleResultCard
                score={scanResult.score}
                statusLabel={scanResult.statusLabel}
                scanId={activeScanId!}
                targetUrl={scanResult.target}
                onReset={handleResetScan}
              />
            )}
          </div>
        )}
      </main>

      {/* AUTHORIZATION CONFIRMATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        targetUrl={targetUrl}
        onClose={() => setIsAuthModalOpen(false)}
        onConfirm={handleStartScan}
      />

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 font-mono">
        SaaS Security Auditor © {new Date().getFullYear()} — Plataforma Defensiva de Auditoria de Segurança
      </footer>
    </div>
  );
}
