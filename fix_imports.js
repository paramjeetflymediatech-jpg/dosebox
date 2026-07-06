const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else callback(dirPath);
  });
}

const IMPORT_LINE = "import { formatCurrency } from '@/lib/utils';";

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if this file has the bad injection (import inside another import block)
  // A bad injection looks like: the formatCurrency import line is NOT immediately after a ';' or a line ending
  // We detect: open import block (import {) with the formatCurrency line inside it
  if (!content.includes(IMPORT_LINE)) return;

  const lines = content.split('\n');
  let inMultilineImport = false;
  let badLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('import {') && !trimmed.includes('}')) {
      inMultilineImport = true;
    }
    if (inMultilineImport && trimmed === IMPORT_LINE) {
      badLineIndex = i;
      break;
    }
    if (inMultilineImport && trimmed.includes('}') && trimmed.includes('from')) {
      inMultilineImport = false;
    }
  }

  if (badLineIndex === -1) return; // No bad injection found

  // Remove the bad line
  lines.splice(badLineIndex, 1);

  // Find the correct insertion point (after 'use client' or at the very start, before other imports)
  let insertAt = 0;
  if (lines[0] && lines[0].includes('use client')) {
    insertAt = 1;
    // skip blank lines after 'use client'
    while (insertAt < lines.length && lines[insertAt].trim() === '') insertAt++;
  }

  // Check it's not already at the top
  const alreadyAtTop = lines.slice(0, insertAt + 3).some(l => l.trim() === IMPORT_LINE);
  if (!alreadyAtTop) {
    lines.splice(insertAt, 0, IMPORT_LINE);
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Fixed:', filePath);
});

console.log('Done.');
