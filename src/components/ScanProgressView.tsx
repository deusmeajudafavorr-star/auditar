import React from "react";
import { Check, Loader2 } from "lucide-react";

interface ScanProgressProps {
  targetUrl: string;
  progress: number;
  currentStep?: string;
}

const STEPS = [
  "Conectividade",
  "HTTPS",
  "Segurança HTTP",
  "Sessão",
  "APIs",
  "Aplicação",
  "Análise final",
];

export const ScanProgressView: React.FC<ScanProgressProps> = ({ targetUrl, progress, currentStep }) => {
  // Determine current step index based on progress (0 to 100)
  const currentStepIndex = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="text-center mb-6">
        <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-2">
          ANALISANDO SEU SAAS...
        </h2>
        <p className="font-mono text-lg text-red-400 font-semibold break-all">
          {targetUrl}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-8">
        <div className="w-full h-3 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300 ease-out shadow-lg shadow-red-500/50"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>{currentStep || "Executando auditoria..."}</span>
          <span className="font-bold text-red-400">{progress}%</span>
        </div>
      </div>

      {/* High level steps checklist */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
        {STEPS.map((stepName, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={stepName} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {isDone ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-500 flex items-center justify-center text-xs">
                    •
                  </span>
                )}
                <span
                  className={
                    isDone
                      ? "text-slate-300 font-medium"
                      : isCurrent
                      ? "text-white font-bold"
                      : "text-slate-500"
                  }
                >
                  {stepName}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {isDone ? "Concluído" : isCurrent ? "Analisando..." : "Pendente"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
