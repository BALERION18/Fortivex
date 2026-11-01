import { generateExecutivePdfReport } from '../src/services/pdfReportService.js';
import fs from 'fs';
import path from 'path';

async function test() {
  const ps60Data = JSON.parse(fs.readFileSync('d:/REA/reports/test_data.json', 'utf8').catch(() => '{}'));
}
