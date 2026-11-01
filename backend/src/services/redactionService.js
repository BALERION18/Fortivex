import { SECRET_RULES } from './secretScanner.js';

/**
 * Pre-AI Sanitization Engine
 * Scans and redacts all known secrets and credentials before repository content is
 * ever passed to AI prompt templates or outbound API requests.
 *
 * Enforces fail-safe verification:
 * If redaction fails to scrub all secrets, the content is categorically blocked.
 *
 * @param {string} content - Raw repository or snippet text
 * @returns {{ safe: boolean, text?: string, error?: string, redactionsCount: number }}
 */
export function redactSecretsBeforeAI(content) {
  if (!content || typeof content !== 'string') {
    return { safe: true, text: '', redactionsCount: 0 };
  }

  let sanitized = content;
  let redactionsCount = 0;

  for (const rule of SECRET_RULES) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    sanitized = sanitized.replace(regex, (match, ...args) => {
      redactionsCount++;
      const targetSecret = (rule.secretGroup && args[rule.secretGroup - 1]) ? args[rule.secretGroup - 1] : match;
      return match.replace(targetSecret, `[REDACTED_SECRET:${rule.id}]`);
    });
  }


  // Verification pass: Rescan sanitized output to ensure zero secrets survived
  for (const rule of SECRET_RULES) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    // Ignore our own replacement token if it matches
    let checkMatch;
    while ((checkMatch = regex.exec(sanitized)) !== null) {
      const matchedStr = rule.secretGroup ? checkMatch[rule.secretGroup] : checkMatch[0];
      if (matchedStr && !matchedStr.includes('[REDACTED_SECRET:')) {
        // Redaction failed to fully neutralize the credential!
        return {
          safe: false,
          error: `Safety check failure: Detected unredacted credential matching rule '${rule.id}'. Transmitting content to AI has been blocked.`,
          redactionsCount
        };
      }
    }
  }

  return {
    safe: true,
    text: sanitized,
    redactionsCount
  };
}
