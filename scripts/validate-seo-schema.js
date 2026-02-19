#!/usr/bin/env node
/*
 * Run all SEO schema validators in sequence.
 * Usage: node scripts/validate-seo-schema.js
 */

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = process.cwd();
const validators = [
  'scripts/validate-product-schema.js',
  'scripts/validate-pdp-jsonld-template.js'
];

function runValidator(scriptPath) {
  const absPath = path.join(ROOT, scriptPath);
  console.log(`\n=== Running: ${scriptPath} ===`);
  const result = spawnSync(process.execPath, [absPath], {
    cwd: ROOT,
    stdio: 'inherit'
  });
  return result.status === 0;
}

function main() {
  let allPass = true;
  for (const validator of validators) {
    const pass = runValidator(validator);
    if (!pass) {
      allPass = false;
    }
  }

  if (!allPass) {
    console.error('\nSEO schema validation: FAILED');
    process.exitCode = 1;
    return;
  }

  console.log('\nSEO schema validation: OK');
}

main();
