#!/bin/bash

# Script to get LAN IP address for frontend/backend configuration

echo "🔍 Finding LAN IP address..."
echo ""

# Try different methods to get IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1.1.1.1 | awk '{print $7; exit}' 2>/dev/null)
else
    IP=$(ipconfig | grep "IPv4" | awk '{print $14}' | head -1 2>/dev/null)
fi

if [ -z "$IP" ]; then
    echo "❌ Could not detect LAN IP automatically"
    echo ""
    echo "Please find your IP manually:"
    echo "  macOS: System Preferences > Network"
    echo "  Linux: ip addr show"
    exit 1
fi

echo "✅ LAN IP Address: $IP"
echo ""
echo "📋 Configuration:"
echo ""
echo "1. Frontend URL (access from other devices):"
echo "   http://$IP:5173"
echo ""
echo "2. Backend URL (for .env file):"
echo "   http://$IP:4000/api/v1"
echo ""
echo "3. Add to apps/frontend/.env:"
echo "   VITE_API_URL=http://$IP:4000/api/v1"
echo ""
echo "4. Test backend connection:"
echo "   curl http://$IP:4000/api/v1/health"
echo ""

