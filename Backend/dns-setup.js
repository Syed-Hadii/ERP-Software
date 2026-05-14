// Fix for Node.js DNS resolution issues on Windows
// This ensures Node.js uses public DNS servers instead of localhost
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
console.log('✓ DNS resolver configured to use Google DNS servers');
