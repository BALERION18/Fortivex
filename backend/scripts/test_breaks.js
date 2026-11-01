import PDFDocument from 'pdfkit';
import { generateExecutivePdfReport } from '../src/services/pdfReportService.js';

const origAddPage = PDFDocument.prototype.addPage;
let pageNum = 1;
PDFDocument.prototype.addPage = function (...args) {
  const err = new Error();
  console.log(`[PAGE BREAK -> Page ${++pageNum}] Current y: ${this.y}`);
  const lines = err.stack.split('\n').slice(2, 5);
  console.log(lines.join('\n'));
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

console.log('Testing...');
const buf = await generateExecutivePdfReport(reportData);
console.log('Total pages according to PDF trailer:');
const matches = buf.toString('latin1').match(/\/Type\s*\/Page\b/g);
console.log(matches ? matches.length : 'none');
