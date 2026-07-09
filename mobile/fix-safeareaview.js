
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src/screens', function(filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if it imports SafeAreaView from react-native
        const regex = /import\s+\{[^}]*SafeAreaView[^}]*\}\s+from\s+['"]react-native['"];/g;
        if (content.match(/SafeAreaView/) && !content.includes('react-native-safe-area-context')) {
            // Replace the import in react-native
            content = content.replace(/(import\s+\{[^}]*)(SafeAreaView,?\s*)([^}]*\}\s+from\s+['"]react-native['"];)/g, (match, p1, p2, p3) => {
                let newImport = p1.trim();
                if (newImport.endsWith(',')) newImport = newImport.slice(0, -1);
                // If it was the only import, we might have empty {}, but typically there are others
                return p1 + p3;
            });
            // Clean up empty commas if any
            content = content.replace(/,\s*,/g, ',');
            content = content.replace(/\{\s*,/g, '{');
            content = content.replace(/,\s*\}/g, '}');

            // Add the new import
            content = content.replace(/(import\s+.*?from\s+['"]react-native['"];)/, "\nimport { SafeAreaView } from 'react-native-safe-area-context';");
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', filePath);
        }
    }
});

