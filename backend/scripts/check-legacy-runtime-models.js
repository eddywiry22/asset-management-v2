#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIRS = ['services', 'controllers', 'routes'];

const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js')) checkFile(full);
  }
}

function checkFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(ROOT, filePath);

  const modelRequireDestructure = src.match(/const\s*\{([^}]+)\}\s*=\s*require\('\.\.\/models'\)/g) || [];
  for (const statement of modelRequireDestructure) {
    if (/\bItem\b/.test(statement)) {
      violations.push({ file: rel, reason: 'Item model imported from ../models' });
    }
    if (/\bGood\b/.test(statement)) {
      violations.push({ file: rel, reason: 'Good model imported from ../models' });
    }
    if (/\bMovement\b/.test(statement)) {
      violations.push({ file: rel, reason: 'Legacy Movement model imported from ../models' });
    }
  }
}

for (const rel of TARGET_DIRS) {
  walk(path.join(ROOT, rel));
}

if (violations.length > 0) {
  console.error('Legacy runtime model imports found:');
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.reason}`);
  }
  process.exit(1);
}

console.log('No legacy runtime model imports detected in services/controllers/routes.');
