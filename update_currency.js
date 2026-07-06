const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

let modifiedCount = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern for ₹{...toFixed(...)}
    const toFixedRegex = /₹\{([^}]+)\.toFixed\(\d+\)\}/g;
    // Pattern for ₹{...toLocaleString(...)}
    const toLocaleStringRegex = /₹\{([^}]+)\.toLocaleString\([^}]*\)\}/g;

    let modified = content;

    if (toFixedRegex.test(modified) || toLocaleStringRegex.test(modified)) {
      modified = modified.replace(toFixedRegex, '₹{formatCurrency($1)}');
      modified = modified.replace(toLocaleStringRegex, '₹{formatCurrency($1)}');

      // Also there are some patterns without curly braces but not many. Mostly ₹{...}
      // Let's also check for ₹ followed by number explicitly? 
      // User mentioned "Pricing amount on ui showing ₹10605.00... want to show 10,605". 
      // The formatting is mostly done in TSX using variable interpolation, e.g., ₹{med.price.toFixed(2)}.

      // Only import if not already imported
      if (modified !== original && !modified.includes('formatCurrency')) {
         // Find a place to put the import
         // Put it after the last import statement, or at the top
         const importStr = "import { formatCurrency } from '@/lib/utils';\n";
         
         const lines = modified.split('\n');
         let lastImportIndex = -1;
         for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
               lastImportIndex = i;
            }
         }

         if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, importStr);
         } else {
            // Find after 'use client'
            if (lines[0].includes('use client')) {
               lines.splice(1, 0, '\n' + importStr);
            } else {
               lines.unshift(importStr);
            }
         }
         modified = lines.join('\n');
      }

      if (modified !== original) {
        fs.writeFileSync(filePath, modified, 'utf8');
        modifiedCount++;
        console.log('Modified:', filePath);
      }
    }
  }
});

console.log('Total files modified:', modifiedCount);
