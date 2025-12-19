'use strict';

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[locale-validator] Failed to read JSON ${filePath}:`, err.message);
    process.exitCode = 1;
    return {};
  }
}

function flattenKeys(obj, prefix = '') {
  const keys = new Set();
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const nextPrefix = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        for (const sub of flattenKeys(v, nextPrefix)) keys.add(sub);
      } else {
        keys.add(nextPrefix);
      }
    }
  }
  return keys;
}

function walkDir(dir, extSet, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, extSet, files);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extSet.has(ext)) files.push(full);
    }
  }
  return files;
}

function extractNamespaceAndKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // namespace from useTranslations('namespace')
  const nsMatch = content.match(/useTranslations\(\s*['"]([^'"\)]+)['"]\s*\)/);
  const namespace = nsMatch ? nsMatch[1].trim() : '';
  // t('key') occurrences
  const keyRegex = /\bt\(\s*(['"])((?:[^'"\\]|\\.)+?)\1\s*\)/g;
  const keys = [];
  let m;
  while ((m = keyRegex.exec(content)) !== null) {
    const key = m[2];
    // Skip keys with template expressions or variables
    if (key.includes('${')) continue;
    keys.push(namespace ? `${namespace}.${key}` : key);
  }
  return { namespace, keys };
}

function main() {
  const root = process.cwd();
  const webSrc = path.join(root, 'apps', 'web', 'src');
  const enPath = path.join(root, 'apps', 'web', 'src', 'locales', 'en', 'common.json');
  const huPath = path.join(root, 'apps', 'web', 'src', 'locales', 'hu', 'common.json');

  const en = readJson(enPath);
  const hu = readJson(huPath);
  const enKeys = flattenKeys(en);
  const huKeys = flattenKeys(hu);

  const files = walkDir(webSrc, new Set(['.tsx', '.ts']));
  const usedKeys = new Set();
  for (const f of files) {
    try {
      const { keys } = extractNamespaceAndKeys(f);
      for (const k of keys) usedKeys.add(k);
    } catch (err) {
      console.warn(`[locale-validator] Failed to parse ${f}: ${err.message}`);
    }
  }

  const missingEn = [];
  const missingHu = [];
  for (const k of usedKeys) {
    if (!enKeys.has(k)) missingEn.push(k);
    if (!huKeys.has(k)) missingHu.push(k);
  }

  const hasMissing = missingEn.length || missingHu.length;
  if (hasMissing) {
    console.error('\n[locale-validator] Missing translation keys found!');
    if (missingEn.length) {
      console.error(`\nEN missing (${missingEn.length}):`);
      for (const k of missingEn.sort()) console.error(` - ${k}`);
    }
    if (missingHu.length) {
      console.error(`\nHU missing (${missingHu.length}):`);
      for (const k of missingHu.sort()) console.error(` - ${k}`);
    }
    process.exit(2);
  } else {
    console.log('[locale-validator] All used keys exist in EN and HU.');
  }
}

main();
