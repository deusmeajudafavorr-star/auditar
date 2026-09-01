import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  targetUrl: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, targetUrl, onClose, onConfirm }) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl shadow-red-950/20 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-red-500 mb-4">
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">ATENÇÃO</h3>
            <p className="text-xs text-slate-400">Verificação obrigatória de conformidade</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
          Você confirma que possui autorização para testar o domínio:
        </p>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-red-400 font-mono text-sm break-all mb-5">
          {targetUrl || "https://seusaas.com"}
        </div>

        <label className="flex items-start gap-3 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg cursor-pointer hover:border-slate-700 transition-colors mb-6">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-red-500 rounded border-slate-700 focus:ring-red-500"
          />
          <span className="text-xs text-slate-300 leading-snug">
            Confirmo que sou proprietário deste sistema ou possuo autorização expressa para realizar este teste defensivo de segurança.
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            CANCELAR
          </button>
          <button
            type="button"
            disabled={!confirmed}
            onClick={() => {
              if (confirmed) {
                onConfirm();
              }
            }}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              confirmed
                ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-red-400 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            INICIAR TESTE
          </button>
        </div>
      </div>
    </div>
  );
};
