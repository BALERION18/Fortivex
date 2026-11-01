import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPdf(owner, repo, ref) {
  console.log('\n========================================');
  console.log('Testing PDF for ' + owner + '/' + repo + ' (ref: ' + (ref || 'HEAD') + ')...');
  const url = 'http://localhost:5000/api/reports/pdf/' + owner + '/' + repo + (ref ? '?ref=' + ref : '');
  const res = await fetch(url);
  if (!res.ok) {
    console.error('FAILED: HTTP ' + res.status + ':', await res.text());
    return false;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log('PDF buffer size: ' + buffer.length + ' bytes');

  let searchPos = 0;
  const pageStreams = [];

  while (true) {
    const streamStart = buffer.indexOf('stream', searchPos);
    if (streamStart === -1) break;
    let dataStart = streamStart + 6;
    if (buffer[dataStart] === 0x0d && buffer[dataStart + 1] === 0x0a) dataStart += 2;
    else if (buffer[dataStart] === 0x0a || buffer[dataStart] === 0x0d) dataStart += 1;
    const streamEnd = buffer.indexOf('endstream', dataStart);
    if (streamEnd === -1) break;
    const streamData = buffer.slice(dataStart, streamEnd);
    try {
      const text = zlib.inflateSync(streamData).toString('latin1');
      pageStreams.push(text);
    } catch (e) {}
    searchPos = streamEnd + 9;
  }

  console.log('Total Pages in PDF: ' + pageStreams.length);

  function parseStream(streamText) {
    const lines = [];
    const regex = /\[([^\]]+)\]\s*TJ/g;
    let match;
    while ((match = regex.exec(streamText)) !== null) {
      const inner = match[1];
      let str = '';
      const hexRegex = /<([0-9a-fA-F]+)>/g;
      let h;
      while ((h = hexRegex.exec(inner)) !== null) {
        try {
          str += Buffer.from(h[1], 'hex').toString('utf-8');
        } catch {}
      }
      if (str.trim()) lines.push(str.trim());
    }
    return lines;
  }

  let hasOrphan = false;

  pageStreams.forEach((s, idx) => {
    const lines = parseStream(s);
    console.log('\n--- Page ' + (idx + 1) + ' of ' + pageStreams.length + ' (' + lines.length + ' text items) ---');
    const sections = lines.filter((l) => /^[1-7]\.\s+[A-Za-z]/.test(l));
    console.log('  Sections starting on this page:', sections.length > 0 ? sections.join(' | ') : '(none - continuation)');
    console.log('  First item:', lines[0]?.substring(0, 60));
    console.log('  Last item: ', lines[lines.length - 1]?.substring(0, 60));

    // Check if the last item is an orphan section header
    if (sections.length > 0) {
      const lastSec = sections[sections.length - 1];
      const lastSecIndex = lines.indexOf(lastSec);
      // If the section header is within the last 2 items on the page (before footer)
      if (lastSecIndex >= lines.length - 3) {
        console.warn('  ⚠️ WARNING: Section "' + lastSec + '" is an orphan at the bottom of Page ' + (idx + 1) + '!');
        hasOrphan = true;
      }
    }
  });

  if (!hasOrphan) {
    console.log('\n✅ PASS: No orphan section headers detected! All sections have immediate content below them.');
  }

  return !hasOrphan;
}

async function run() {
  const r1 = await testPdf('morluto', 'rea', 'ba866a26ec');
  const r2 = await testPdf('BALERION18', 'PS60', '8448593216b4d2d076986481f88934999d7ff05b');

  if (r1 && r2) {
    console.log('\n🎉 ALL PDF INTEGRITY TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error('\n❌ PDF INTEGRITY TEST FAILED!\n');
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
