import 'dotenv/config'; // Load .env FIRST
import app from './app.js';
import http from 'http';

// Create HTTP server
const server = http.createServer(app);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});