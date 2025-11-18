import 'dotenv/config'; // Load .env FIRST
import app from './app.js';
import http from 'http';
import os from 'os';

// Create HTTP server
const server = http.createServer(app);

// Start server
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  
  // Get local IP addresses for LAN access
  const networkInterfaces = os.networkInterfaces();
  
  console.log('\nAccess the server from:');
  console.log(`  Local:   http://localhost:${PORT}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  Network: http://${iface.address}:${PORT}`);
      }
    });
  });
  console.log('');
});