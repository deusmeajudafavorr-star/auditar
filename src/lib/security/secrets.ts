const SECRET_PATTERNS = [
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "Generic API Key", regex: /(api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi },
  { name: "Bearer Token / JWT", regex: /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*/gi },
  { name: "Private Key Header", regex: /-----BEGIN (RSA|EC|PGP|OPENSSH) PRIVATE KEY-----/gi },
  { name: "Database URL Credentials", regex: /(postgres|mysql|mongodb|redis):\/\/[a-zA-Z0-9_]+:[^@]+@/gi },
];

export function maskSensitiveValue(value: string): string {
  if (!value) return "";
  let sanitized = value;

  // Redact bearer tokens
  sanitized = sanitized.replace(/Bearer\s+[^\s"']+/gi, "Bearer ********");
  // Redact pass / password / token in parameters
  sanitized = sanitized.replace(/(password|passwd|pass|token|secret|auth|api_key|access_key)=([^&"'\s]+)/gi, "$1=********");
  // Redact Authorization headers
  sanitized = sanitized.replace(/(authorization|cookie|set-cookie):\s*[^\r\n]+/gi, "$1: ********");

  return sanitized;
}

export function scanTextForSecrets(text: string): { found: boolean; matches: { type: string; snippet: string }[] } {
  const matches: { type: string; snippet: string }[] = [];
  if (!text) return { found: false, matches };

  for (const pattern of SECRET_PATTERNS) {
    const found = text.match(pattern.regex);
    if (found) {
      for (const f of found) {
        matches.push({
          type: pattern.name,
          snippet: f.substring(0, 10) + "********",
        });
      }
    }
  }

  return {
    found: matches.length > 0,
    matches,
  };
}
