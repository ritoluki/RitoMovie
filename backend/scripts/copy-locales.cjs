const { cpSync } = require('node:fs');
const path = require('node:path');

cpSync(
  path.join(__dirname, '../src/locales'),
  path.join(__dirname, '../dist/locales'),
  { recursive: true }
);
