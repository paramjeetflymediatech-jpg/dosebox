const fs = require('fs');
const path = require('path');

function replaceRamda(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceRamda(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('ramda/src/')) {
        // Change: var _omit = _interopRequireDefault(require("ramda/src/omit"));
        // to: var _omit = { default: require("ramda").omit };
        content = content.replace(/_interopRequireDefault\(require\(['"]ramda\/src\/([^'"]+)['"]\)\)/g, '{ default: require("ramda").$1 }');
        // also handle any direct require
        content = content.replace(/require\(['"]ramda\/src\/([^'"]+)['"]\)/g, 'require("ramda").$1');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched', fullPath);
      }
    }
  }
}

replaceRamda('node_modules/@native-html/transient-render-engine/lib');
replaceRamda('node_modules/@native-html/css-processor/lib');
console.log('Done.');
