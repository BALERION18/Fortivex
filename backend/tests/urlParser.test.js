import { describe, it, expect } from 'vitest';
import { parseGitHubUrl } from '../src/utils/urlParser.js';

describe('parseGitHubUrl', () => {
  it('parses basic "owner/repo" format', () => {
    const result = parseGitHubUrl('facebook/react');
    expect(result.valid).toBe(true);
    expect(result.owner).toBe('facebook');
    expect(result.repo).toBe('react');
    expect(result.fullName).toBe('facebook/react');
  });

  it('parses full HTTPS GitHub URLs', () => {
    const result = parseGitHubUrl('https://github.com/expressjs/express');
    expect(result.valid).toBe(true);
    expect(result.owner).toBe('expressjs');
    expect(result.repo).toBe('express');
  });

  it('parses URLs with trailing slashes', () => {
    const result = parseGitHubUrl('https://github.com/vuejs/core/');
    expect(result.valid).toBe(true);
    expect(result.owner).toBe('vuejs');
    expect(result.repo).toBe('core');
  });

  it('parses URLs ending with .git', () => {
    const result = parseGitHubUrl('https://github.com/morluto/rea.git');
    expect(result.valid).toBe(true);
    expect(result.owner).toBe('morluto');
    expect(result.repo).toBe('rea');
  });

  it('parses URLs with subpaths like /tree/main', () => {
    const result = parseGitHubUrl('https://github.com/torvalds/linux/tree/master');
    expect(result.valid).toBe(true);
    expect(result.owner).toBe('torvalds');
    expect(result.repo).toBe('linux');
  });

  it('rejects empty input', () => {
    const result = parseGitHubUrl('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects non-string input', () => {
    const result = parseGitHubUrl(null);
    expect(result.valid).toBe(false);
  });

  it('rejects incomplete owner-only input', () => {
    const result = parseGitHubUrl('facebook');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid format');
  });

  it('rejects invalid owner names with illegal characters', () => {
    const result = parseGitHubUrl('invalid@user/my-repo');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid owner name');
  });
});
