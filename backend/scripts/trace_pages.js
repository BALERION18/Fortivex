import PDFDocument from 'pdfkit';
import { generateExecutivePdfReport } from '../src/services/pdfReportService.js';

const origAddPage = PDFDocument.prototype.addPage;
let pageNum = 1;
PDFDocument.prototype.addPage = function (...args) {
  const err = new Error();
  console.log(`\n========================================`);
  console.log(`[PAGE BREAK -> Page ${++pageNum}] Current y was: ${this.y}`);
  const lines = err.stack.split('\n').slice(2, 6);
  console.log(lines.join('\n'));
  console.log(`========================================\n`);
  return origAddPage.apply(this, args);
};

const owner = 'BALERION18';
const repo = 'PS60';
const ref = '8448593216b4d2d076986481f88934999d7ff05b';

const [aiRes, secRes, anaRes] = await Promise.all([
  fetch(`http://localhost:5000/api/ai/intelligence/${owner}/${repo}?ref=${ref}`).then((r) => r.json()),
  fetch(`http://localhost:5000/api/security/scan/${owner}/${repo}?ref=${ref}`).then((r) => r.json()),
  fetch(`http://localhost:5000/api/analytics/insights/${owner}/${repo}`).then((r) => r.json())
]);

const reportData = {
  owner,
  repo,
  commitSha: ref,
  defaultBranch: 'main',
  timestamp: new Date().toISOString(),
  health: {
    overallRating: 'Security Review Required',
    explanation: 'Potential credentials or sensitive patterns flagged in repository files.',
    passedCount: 4,
    totalCount: 6
  },
  intelligence: aiRes.data || {},
  security: secRes.data || {},
  analytics: anaRes.data || {}
};

console.log('Generating report locally with live API data...');
console.log('Routes count:', (reportData.intelligence.routes || []).length);
console.log('Findings count:', (reportData.security.findings || []).length);
console.log('Top contributors count:', (reportData.analytics.ownership?.topContributors || []).length);

const buf = await generateExecutivePdfReport(reportData);
console.log('Done! Generated buffer size:', buf.length);
