import { Finding, Severity, Confidence } from "./types";
import { maskSensitiveValue } from "./secrets";

export function createFinding(data: {
  id?: string;
  title: string;
  severity: Severity;
  confidence?: Confidence;
  category: string;
  url: string;
  method?: string;
  evidence: string;
  impact: string;
  recommendation: string;
  safe?: boolean;
}): Finding {
  return {
    id: data.id || `find_${Math.random().toString(36).substring(2, 9)}`,
    title: data.title,
    severity: data.severity,
    confidence: data.confidence || "HIGH",
    category: data.category,
    url: data.url,
    method: data.method || "GET",
    evidence: maskSensitiveValue(data.evidence),
    impact: data.impact,
    recommendation: data.recommendation,
    safe: data.safe !== undefined ? data.safe : true,
  };
}
