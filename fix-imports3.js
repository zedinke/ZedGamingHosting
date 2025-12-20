const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.startsWith('.')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace all variations of relative paths to i18n/translations with the alias
      let updated = content;
      
      // Match patterns like from '../i18n/translations' or from '../../../../i18n/translations'
      updated = updated.replace(/from ['"](\.*\/)+i18n\/translations['"]/g, "from '@i18n/translations'");
      
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated);
        console.log('Updated: ' + fullPath);
      }
    }
  });
}

walkDir('apps/web/src');
console.log('Done fixing imports to use alias');
