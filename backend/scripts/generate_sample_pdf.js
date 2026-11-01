import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const owner = 'BALERION18';
  const repo = 'PS60';
  const commit = '8448593216b4d2d076986481f88934999d7ff05b';

  console.log(`Requesting live PDF audit report from http://localhost:5000/api/reports/pdf/${owner}/${repo}?ref=${commit}...`);

  const url = `http://localhost:5000/api/reports/pdf/${owner}/${repo}?ref=${commit}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`HTTP Error ${response.status}:`, errorText);
    process.exit(1);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outputPath = path.resolve(__dirname, '../../reports/BALERION18-PS60-fortivex-audit.pdf');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);

  console.log(`Successfully generated and saved PDF report to: ${outputPath}`);
  console.log(`Buffer size: ${buffer.length} bytes`);
  console.log(`PDF header check: ${buffer.slice(0, 5).toString('ascii')}`);
}

main().catch((err) => {
  console.error('Failed to generate report:', err);
  process.exit(1);
});
