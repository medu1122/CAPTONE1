import os from 'os';

/**
 * Lấy IP address của server từ network interfaces
 * Ưu tiên IPv4 non-internal addresses
 * @returns {string|null} IP address hoặc null nếu không tìm thấy
 */
export const getServerIp = () => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const allIps = [];
    
    // Thu thập tất cả IPv4 non-internal addresses
    for (const interfaceName of Object.keys(networkInterfaces)) {
      const iface = networkInterfaces[interfaceName];
      for (const addr of iface) {
        if (addr.family === 'IPv4' && !addr.internal) {
          let priority = 3; // Mặc định priority thấp nhất
          
          // Ưu tiên 172.x.x.x nhất (thường là network chính/VPN đang active)
          if (addr.address.startsWith('172.')) {
            priority = 1;
          }
          // Sau đó ưu tiên 10.x.x.x
          else if (addr.address.startsWith('10.')) {
            priority = 2;
          }
          // Cuối cùng là các IP khác (192.168.x.x, etc.)
          
          allIps.push({
            address: addr.address,
            interface: interfaceName,
            priority: priority
          });
        }
      }
    }
    
    if (allIps.length === 0) {
      return null;
    }
    
    // Sắp xếp theo priority (172.x được ưu tiên nhất)
    allIps.sort((a, b) => a.priority - b.priority);
    
    // Log để debug
    console.log('🌐 Available IP addresses:');
    allIps.forEach(ip => {
      console.log(`  - ${ip.address} (${ip.interface})`);
    });
    
    // Trả về IP có priority cao nhất
    const selectedIp = allIps[0].address;
    console.log(`✅ Selected server IP: ${selectedIp}`);
    
    return selectedIp;
  } catch (error) {
    console.error('❌ Error getting server IP:', error.message);
    return null;
  }
};

/**
 * Lấy URL frontend dựa trên IP server hiện tại
 * @param {number} frontendPort - Port của frontend (mặc định 5173)
 * @returns {string} Frontend URL
 */
export const getFrontendUrl = (frontendPort = 5173) => {
  // Nếu có APP_URL trong env, ưu tiên dùng nó
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  // Tự động detect IP server
  const serverIp = getServerIp();
  if (serverIp) {
    return `http://${serverIp}:${frontendPort}`;
  }
  
  // Fallback về localhost
  return `http://localhost:${frontendPort}`;
};

