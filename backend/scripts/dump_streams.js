import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.resolve(__dirname, '../../reports/BALERION18-PS60-repolens-audit.pdf');
const buffer = fs.readFileSync(pdfPath);

let searchPos = 0;
let streamCount = 0;
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
  try {
    const decompressed = zlib.inflateSync(streamData).toString('latin1');
    streamCount++;
    console.log(`--- Stream ${streamCount} (${decompressed.length} bytes) ---`);
    // Print lines containing '('
    const textLines = decompressed.match(/\((?:[^\\)]|\\.)*\)/g) || [];
    console.log(textLines.slice(0, 15).join(' '));
  } catch (e) {
    // console.log('not zlib stream', e.message);
  }

  searchPos = streamEnd + 9;
}
