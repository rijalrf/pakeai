#!/usr/bin/env node

const path = require('path');
const { runCli } = require('../dist/index');

const args = process.argv.slice(2);
runCli(args).catch((err) => {
  console.error('CLI Runtime Error:', err);
  process.exit(1);
});
