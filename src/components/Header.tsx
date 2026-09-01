import React from "react";
import { ShieldAlert, ShieldCheck, ShieldCheck as ShieldIcon, AlertTriangle, FileText, Lock, ArrowRight, Activity, CheckCircle2, History, ExternalLink } from "lucide-react";

interface HeaderProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath = "/", onNavigate }) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          onClick={() => onNavigate && onNavigate("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500/20 to-slate-900 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10 group-hover:border-red-500/60 transition-all">
            <ShieldIcon className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-red-400 transition-colors">
            SaaS Security <span className="text-red-500 font-extrabold">Auditor</span>
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-4 text-sm font-medium">
          <button
            onClick={() => onNavigate && onNavigate("/")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              currentPath === "/" ? "text-white bg-slate-800/80" : "text-slate-400 hover:text-white"
            }`}
          >
            Início
          </button>
          <button
            onClick={() => onNavigate && onNavigate("/dashboard")}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentPath === "/dashboard" ? "text-white bg-slate-800/80" : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4 text-slate-400" />
            Histórico
          </button>
          <button
            onClick={() => onNavigate && onNavigate("/live")}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentPath === "/live" ? "text-white bg-slate-800/80" : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 text-red-400 animate-pulse" />
            Modo Live
          </button>
        </nav>
      </div>
    </header>
  );
};
