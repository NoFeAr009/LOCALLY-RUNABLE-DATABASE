#!/usr/bin/env node
const path = require('path');
const args = process.argv.slice(2);
const command = args.join(' ').toLowerCase();

if (command.includes('server on') || command === 'on' || command === 'start' || args.length === 0) {
  console.log('========================================================');
  console.log('  ⚡ NOFEAR DATABASE SERVER & SUPABASE ENGINE');
  console.log('========================================================');
  require(path.join(__dirname, 'server.js'));
} else {
  console.log('Unknown command. To start server, type:');
  console.log('  nofear server on');
}
