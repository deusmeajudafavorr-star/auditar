export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type ScanProfile = "quick" | "standard" | "full" | "passive";

export type ScanStatus = "queued" | "running" | "completed" | "failed" | "limited" | "timeout";

export type StatusLabel =
  | "ESTÁ INSEGURO"
  | "PRECISA DE ATENÇÃO"
  | "BOAS PRÁTICAS A MELHORAR"
  | "ESTÁ SEGURO"
  | "NÃO FOI POSSÍVEL ANALISAR";

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  category: string;
  url: string;
  method: string;
  evidence: string;
  impact: string;
  recommendation: string;
  safe: boolean;
}

export interface CategoryResult {
  category: string;
  status: "PASS" | "WARNING" | "NOT DETECTED" | "NOT TESTED";
  findingsCount: number;
}

export interface Scan {
  id: string;
  target: string;
  profile: ScanProfile;
  authorized: boolean;
  status: ScanStatus;
  progress: number; // 0 to 100
  currentStep?: string;
  score: number; // 0 to 100
  statusLabel: StatusLabel;
  createdAt: string;
  completedAt?: string;
  error?: string;
  findings: Finding[];
  categoryResults: Record<string, CategoryResult>;
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    totalFindings: number;
  };
}

export interface PublicScanResult {
  scanId: string;
  status: ScanStatus;
  target: string;
  score: number;
  statusLabel: StatusLabel;
  completedAt?: string;
  progress?: number;
}
