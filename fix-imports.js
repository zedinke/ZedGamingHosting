const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const updated = content.replace(/from 'next-intl'/g, "from '../../i18n/translations'");
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated);
        console.log('Updated: ' + fullPath);
      }
    }
  });
}

walkDir('apps/web/src');
console.log('Done');
