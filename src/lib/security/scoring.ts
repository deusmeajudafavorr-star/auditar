import { Finding, StatusLabel } from "./types";

export interface ScoreResult {
  score: number;
  statusLabel: StatusLabel;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
}

export function calculateSecurityScore(findings: Finding[]): ScoreResult {
  let score = 100;

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;

  for (const f of findings) {
    switch (f.severity) {
      case "CRITICAL":
        criticalCount++;
        score -= 25;
        break;
      case "HIGH":
        highCount++;
        score -= 12;
        break;
      case "MEDIUM":
        mediumCount++;
        score -= 6;
        break;
      case "LOW":
        lowCount++;
        score -= 2;
        break;
      case "INFO":
        infoCount++;
        // INFO does not decrease score
        break;
    }
  }

  // Bound score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  let statusLabel: StatusLabel = "ESTÁ SEGURO";

  if (criticalCount > 0 || highCount > 0) {
    statusLabel = "ESTÁ INSEGURO";
  } else if (mediumCount > 0) {
    statusLabel = "PRECISA DE ATENÇÃO";
  } else if (lowCount > 0) {
    statusLabel = "BOAS PRÁTICAS A MELHORAR";
  } else {
    statusLabel = "ESTÁ SEGURO";
  }

  return {
    score,
    statusLabel,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
  };
}
