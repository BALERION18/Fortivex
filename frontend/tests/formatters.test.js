import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatDate,
  formatRelativeTime,
  parseClientUrl
} from '../src/utils/formatters.js';

describe('Frontend Formatters', () => {
  describe('formatNumber', () => {
    it('formats small numbers normally', () => {
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });

    it('formats thousands with k', () => {
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(20000)).toBe('20k');
    });

    it('formats millions with M', () => {
      expect(formatNumber(1200000)).toBe('1.2M');
    });

    it('handles null/undefined gracefully', () => {
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO dates', () => {
      const res = formatDate('2026-01-15T12:00:00Z');
      expect(res).toContain('2026');
      expect(res).toContain('Jan');
    });

    it('returns dash on invalid date', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('invalid')).toBe('—');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "just now" for very recent timestamps', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('returns days ago for older timestamps', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });
  });

  describe('parseClientUrl', () => {
    it('parses valid owner/repo', () => {
      const res = parseClientUrl('facebook/react');
      expect(res.valid).toBe(true);
      expect(res.owner).toBe('facebook');
      expect(res.repo).toBe('react');
    });

    it('parses full URL with trailing slash', () => {
      const res = parseClientUrl('https://github.com/expressjs/express/');
      expect(res.valid).toBe(true);
      expect(res.owner).toBe('expressjs');
      expect(res.repo).toBe('express');
    });

    it('rejects invalid inputs', () => {
      expect(parseClientUrl('').valid).toBe(false);
      expect(parseClientUrl('onlyowner').valid).toBe(false);
    });
  });
});
