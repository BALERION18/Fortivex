import { describe, it, expect } from 'vitest';
import { redactSecretsBeforeAI } from '../src/services/redactionService.js';

describe('Pre-AI Redaction & Sanitization Service', () => {
  const DUMMY_AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
  const DUMMY_GH_PAT = 'ghp_0123456789abcdefghijklmnopqrstuvwxyz';
  const DUMMY_DB_URI = 'postgres://root:secretPass123@192.168.1.1:5432/app';

  it('redacts credentials and replaces with safe token', () => {
    const rawSnippet = `AWS_KEY="${DUMMY_AWS_KEY}"\nGITHUB_TOKEN="${DUMMY_GH_PAT}"`;
    const result = redactSecretsBeforeAI(rawSnippet);

    expect(result.safe).toBe(true);
    expect(result.redactionsCount).toBeGreaterThanOrEqual(2);
    expect(result.text).toContain('[REDACTED_SECRET:aws-access-key-id]');
    expect(result.text).toContain('[REDACTED_SECRET:github-pat]');

    // CRITICAL SECURITY ASSERTION: Raw credentials MUST NOT exist in outbound text
    expect(result.text).not.toContain(DUMMY_AWS_KEY);
    expect(result.text).not.toContain(DUMMY_GH_PAT);
  });

  it('returns clean text untouched if no secrets exist', () => {
    const cleanSnippet = 'function calculateTotal(a, b) { return a + b; }';
    const result = redactSecretsBeforeAI(cleanSnippet);

    expect(result.safe).toBe(true);
    expect(result.redactionsCount).toBe(0);
    expect(result.text).toBe(cleanSnippet);
  });

  it('handles null and undefined input gracefully', () => {
    expect(redactSecretsBeforeAI(null).safe).toBe(true);
    expect(redactSecretsBeforeAI(undefined).safe).toBe(true);
  });
});
