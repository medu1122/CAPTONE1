import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { vietnamProvinces } from '../src/modules/provinces/vietnamProvinces.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc GeoJSON
const geoJsonPath = path.join(__dirname, '../data/soilmap.geojson');

if (!fs.existsSync(geoJsonPath)) {
  console.error('❌ File not found:', geoJsonPath);
  console.log('💡 Please ensure soilmap.geojson is in the data/ folder');
  process.exit(1);
}

const soilMap = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

// Helper: Tìm tỉnh gần nhất từ tọa độ
function findProvinceByPoint(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;
  
  vietnamProvinces.forEach(province => {
    const distance = Math.sqrt(
      Math.pow(province.coordinates.lat - lat, 2) +
      Math.pow(province.coordinates.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = province;
    }
  });
  
  return nearest;
}

// Helper: Lấy tọa độ trung tâm của polygon
function getPolygonCenter(coordinates) {
  let allPoints = [];
  
  // Xử lý MultiPolygon
  if (coordinates[0][0][0] instanceof Array) {
    coordinates.forEach(polygon => {
      polygon[0].forEach(point => {
        allPoints.push({ lng: point[0], lat: point[1] });
      });
    });
  } else {
    // Polygon
    coordinates[0].forEach(point => {
      allPoints.push({ lng: point[0], lat: point[1] });
    });
  }
  
  // Tính trung tâm
  const center = allPoints.reduce(
    (acc, point) => ({
      lng: acc.lng + point.lng,
      lat: acc.lat + point.lat
    }),
    { lng: 0, lat: 0 }
  );
  
  return {
    lng: center.lng / allPoints.length,
    lat: center.lat / allPoints.length
  };
}

// Extract dữ liệu
const provinceSoilMap = {};

console.log('🔍 Processing GeoJSON features...');
console.log(`   Total features: ${soilMap.features.length}\n`);

soilMap.features.forEach((feature, index) => {
  if ((index + 1) % 100 === 0) {
    console.log(`   Processing feature ${index + 1}/${soilMap.features.length}...`);
  }
  
  try {
    const center = getPolygonCenter(feature.geometry.coordinates);
    const province = findProvinceByPoint(center.lat, center.lng);
    
    if (province) {
      if (!provinceSoilMap[province.code]) {
        provinceSoilMap[province.code] = {
          provinceCode: province.code,
          provinceName: province.name,
          soilTypes: []
        };
      }
      
      // Extract loại đất từ properties
      const soilInfo = {
        type: feature.properties.kieu || 
               feature.properties.domsoil || 
               'Chưa xác định',
        domsoil: feature.properties.domsoil || '',
        faosoil: feature.properties.faosoil || ''
      };
      
      // Tránh trùng lặp
      const exists = provinceSoilMap[province.code].soilTypes.some(
        s => s.type === soilInfo.type
      );
      
      if (!exists) {
        provinceSoilMap[province.code].soilTypes.push(soilInfo);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Error processing feature ${index + 1}:`, error.message);
  }
});

// Export ra JSON
const outputPath = path.join(__dirname, '../data/province_soil_data.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(provinceSoilMap, null, 2),
  'utf8'
);

console.log('\n✅ Extraction completed!');
console.log(`📊 Extracted soil data for ${Object.keys(provinceSoilMap).length} provinces`);
console.log(`📁 Output saved to: ${outputPath}`);
console.log('\n💡 Next step: Run "node scripts/importProvinceData.js" to import into MongoDB');

