const fs = require('fs');
const path = require('path');

function walkDir(dir, relativeBase = '') {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, path.join(relativeBase, file));
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.startsWith('.')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Calculate relative path from current file to i18n/translations
      const srcPath = path.join('apps/web/src');
      const relPath = path.relative(fullPath, path.join(srcPath, 'i18n/translations'));
      const relPathFixed = relPath.replace(/\\/g, '/');
      
      const updated = content.replace(/from '\.\.\/\.\.\/i18n\/translations'/g, `from '${relPathFixed}'`);
      
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated);
        console.log('Updated: ' + fullPath + ' -> ' + relPathFixed);
      }
    }
  });
}

walkDir('apps/web/src');
console.log('Done fixing import paths');
