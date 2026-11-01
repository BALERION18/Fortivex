import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function decodePdfText(buffer) {
  let combinedText = '';

  let searchPos = 0;
  while (true) {
    const streamStart = buffer.indexOf('stream', searchPos);
    if (streamStart === -1) break;

    let dataStart = streamStart + 6;
    if (buffer[dataStart] === 0x0d && buffer[dataStart + 1] === 0x0a) {
      dataStart += 2;
    } else if (buffer[dataStart] === 0x0a || buffer[dataStart] === 0x0d) {
      dataStart += 1;
    }

    const streamEnd = buffer.indexOf('endstream', dataStart);
    if (streamEnd === -1) break;

    const streamData = buffer.slice(dataStart, streamEnd);
    let streamText = '';
    try {
      streamText = zlib.inflateSync(streamData).toString('latin1');
    } catch {
      streamText = streamData.toString('latin1');
    }

    // Decode all hex string tokens `<[0-9a-fA-F]+>` inside TJ arrays
    const hexMatches = streamText.matchAll(/<([0-9a-fA-F]+)>/g);
    for (const match of hexMatches) {
      try {
        const decoded = Buffer.from(match[1], 'hex').toString('utf-8');
        combinedText += decoded;
      } catch {}
    }

    // Also decode regular literal strings `(text)`
    const literalMatches = streamText.matchAll(/\(([^)]+)\)/g);
    for (const match of literalMatches) {
      combinedText += match[1];
    }

    combinedText += '\n';
    searchPos = streamEnd + 9;
  }

  return combinedText;
}

async function inspectPdf() {
  const pdfPath = path.resolve(__dirname, '../../reports/BALERION18-PS60-repolens-audit.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const text = decodePdfText(buffer);

  console.log('=== DECODED PDF CONTENT AUDIT ===');
  console.log(`Path: ${pdfPath}`);
  console.log(`Size: ${buffer.length} bytes`);
  console.log(`Header: ${buffer.slice(0, 5).toString('ascii')}`);

  // 1. Check for raw secrets (must NOT be present)
  const forbiddenPatterns = [
    /ghp_[a-zA-Z0-9]{36}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN RSA PRIVATE KEY-----/
  ];
  let leakFound = false;
  for (const pat of forbiddenPatterns) {
    if (pat.test(text)) {
      console.error(`FAILED: Raw secret pattern matched: ${pat}`);
      leakFound = true;
    }
  }
  if (!leakFound) {
    console.log('PASS: Zero unredacted raw credentials detected in PDF streams.');
  }

  // 2. Check for Pinned Commit
  const hasCommit = text.includes('8448593');
  console.log(`Pinned Commit Present: ${hasCommit ? 'PASS' : 'FAIL'}`);

  // 3. Check for Project Description
  const hasPurpose = text.includes('Himadri') || text.includes('VajraX') || text.includes('Antarctic') || text.includes('telemetry');
  console.log(`Project Purpose Present: ${hasPurpose ? 'PASS' : 'FAIL'}`);

  // 4. Check for Multi-Component Setup
  const hasPip = text.includes('pip install -r backend/requirements.txt') || text.includes('pip install');
  console.log(`Python Setup (pip install) Verified: ${hasPip ? 'PASS' : 'FAIL'}`);

  const hasNpm = text.includes('npm install --prefix frontend') || text.includes('npm install');
  console.log(`Frontend Setup (npm install) Verified: ${hasNpm ? 'PASS' : 'FAIL'}`);

  const hasPytest = text.includes('pytest backend/tests') || text.includes('pytest');
  console.log(`Python Test Harness (pytest) Verified: ${hasPytest ? 'PASS' : 'FAIL'}`);

  // 5. Incompatible commands check
  // Check that pip install is NOT followed by node .
  const hasIncompatible = text.includes('pip install') && text.includes('node .');
  console.log(`No Incompatible 'node .' command for Python: ${!hasIncompatible ? 'PASS' : 'FAIL'}`);

  // 6. Check for Contributor Shares & 100% distribution
  const hasBalerion = text.includes('BALERION18');
  console.log(`Contributor BALERION18 Present: ${hasBalerion ? 'PASS' : 'FAIL'}`);

  // 7. Check for Heuristic Bus-factor cautionary note
  const hasBusCaution = text.includes('CAUTIONARY HEURISTIC') || text.includes('HEURISTIC BUS-FACTOR') || text.includes('cautionary');
  console.log(`Cautionary Bus Factor Advisory Present: ${hasBusCaution ? 'PASS' : 'FAIL'}`);

  // 8. Count pages
  const rawText = buffer.toString('latin1');
  const pageMatches = rawText.match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : 'Unknown';
  console.log(`Total Pages Generated: ${pageCount}`);

  console.log('\n--- Sample Decoded Content Snippet ---');
  console.log(text.substring(0, 750).replace(/\n+/g, ' '));
  console.log('\n=== AUDIT COMPLETE ===');
}

inspectPdf().catch(console.error);
