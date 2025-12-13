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

// Helper: Tìm tỉnh gần nhất từ tọa độ với cải thiện
function findProvinceByPoint(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;
  
  // For Vietnam, max reasonable distance is ~3 degrees (increased for better coverage)
  const MAX_DISTANCE = 3;
  
  vietnamProvinces.forEach(province => {
    const distance = Math.sqrt(
      Math.pow(province.coordinates.lat - lat, 2) +
      Math.pow(province.coordinates.lng - lng, 2)
    );
    
    // If very close to province center (< 0.3 degrees), prioritize it
    if (distance < 0.3 && distance < minDistance) {
      minDistance = distance;
      nearest = province;
    } else if (distance < MAX_DISTANCE && distance < minDistance) {
      minDistance = distance;
      nearest = province;
    }
  });
  
  return nearest;
}

// Helper: Lấy nhiều điểm mẫu từ polygon (center + corners)
function getSamplePoints(coordinates) {
  let allPoints = [];
  
  // Flatten MultiPolygon to get all points
  if (coordinates[0][0][0] instanceof Array) {
    coordinates.forEach(polygon => {
      polygon[0].forEach(point => {
        allPoints.push({ lng: point[0], lat: point[1] });
      });
    });
  } else {
    coordinates[0].forEach(point => {
      allPoints.push({ lng: point[0], lat: point[1] });
    });
  }
  
  if (allPoints.length === 0) return [];
  
  // Calculate center
  const center = allPoints.reduce(
    (acc, point) => ({
      lng: acc.lng + point.lng,
      lat: acc.lat + point.lat
    }),
    { lng: 0, lat: 0 }
  );
  center.lng /= allPoints.length;
  center.lat /= allPoints.length;
  
  // Get sample points: center + first + quarter + middle + three-quarter + last
  const samplePoints = [center];
  
  if (allPoints.length > 0) {
    samplePoints.push(allPoints[0]); // First point
  }
  if (allPoints.length > 3) {
    samplePoints.push(allPoints[Math.floor(allPoints.length * 0.25)]); // Quarter point
    samplePoints.push(allPoints[Math.floor(allPoints.length / 2)]); // Middle point
    samplePoints.push(allPoints[Math.floor(allPoints.length * 0.75)]); // Three-quarter point
    samplePoints.push(allPoints[allPoints.length - 1]); // Last point
  } else if (allPoints.length > 1) {
    samplePoints.push(allPoints[allPoints.length - 1]); // Last point
  }
  
  return samplePoints;
}

// Improved: Tìm tỉnh bằng cách vote từ nhiều điểm mẫu
function findProvinceForFeature(feature) {
  const samplePoints = getSamplePoints(feature.geometry.coordinates);
  
  if (samplePoints.length === 0) return null;
  
  const provinceVotes = {};
  
  // Vote for provinces based on sample points
  samplePoints.forEach(point => {
    const province = findProvinceByPoint(point.lat, point.lng);
    if (province) {
      provinceVotes[province.code] = (provinceVotes[province.code] || 0) + 1;
    }
  });
  
  // Return province with most votes
  if (Object.keys(provinceVotes).length === 0) return null;
  
  const winner = Object.entries(provinceVotes).reduce((a, b) => 
    a[1] > b[1] ? a : b
  );
  
  return vietnamProvinces.find(p => p.code === winner[0]);
}

// Extract dữ liệu
const provinceSoilMap = {};
const unmappedFeatures = [];
const provinceStats = {};

console.log('🔍 Processing GeoJSON features...');
console.log(`   Total features: ${soilMap.features.length}\n`);

soilMap.features.forEach((feature, index) => {
  if ((index + 1) % 100 === 0) {
    console.log(`   Processing feature ${index + 1}/${soilMap.features.length}...`);
  }
  
  try {
    const province = findProvinceForFeature(feature);
    
    if (province) {
      if (!provinceSoilMap[province.code]) {
        provinceSoilMap[province.code] = {
          provinceCode: province.code,
          provinceName: province.name,
          soilTypes: []
        };
        provinceStats[province.code] = 0;
      }
      
      provinceStats[province.code]++;
      
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
    } else {
      const samplePoints = getSamplePoints(feature.geometry.coordinates);
      unmappedFeatures.push({
        index: index + 1,
        center: samplePoints[0] || null,
        properties: feature.properties
      });
    }
  } catch (error) {
    console.warn(`⚠️  Error processing feature ${index + 1}:`, error.message);
    unmappedFeatures.push({
      index: index + 1,
      error: error.message
    });
  }
});

// Export ra JSON
const outputPath = path.join(__dirname, '../data/province_soil_data.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(provinceSoilMap, null, 2),
  'utf8'
);

// Log statistics
console.log('\n✅ Extraction completed!');
console.log(`📊 Extracted soil data for ${Object.keys(provinceSoilMap).length} provinces`);
console.log(`📁 Output saved to: ${outputPath}`);

// Log province statistics
console.log('\n📈 Province statistics:');
Object.entries(provinceStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10) // Top 10
  .forEach(([code, count]) => {
    const province = vietnamProvinces.find(p => p.code === code);
    console.log(`   ${province?.name || code}: ${count} features`);
  });

// Log unmapped features
if (unmappedFeatures.length > 0) {
  console.log(`\n⚠️  ${unmappedFeatures.length} features could not be mapped to any province`);
  if (unmappedFeatures.length <= 20) {
    console.log('   Unmapped features:');
    unmappedFeatures.forEach(f => {
      if (f.center) {
        console.log(`   - Feature ${f.index}: center at (${f.center.lat?.toFixed(4)}, ${f.center.lng?.toFixed(4)})`);
      } else {
        console.log(`   - Feature ${f.index}: ${f.error || 'unknown error'}`);
      }
    });
  } else {
    console.log('   (Too many to display, showing first 10)');
    unmappedFeatures.slice(0, 10).forEach(f => {
      if (f.center) {
        console.log(`   - Feature ${f.index}: center at (${f.center.lat?.toFixed(4)}, ${f.center.lng?.toFixed(4)})`);
      }
    });
  }
}

// Check for missing provinces
console.log('\n🔍 Checking for missing provinces...');
const extractedCodes = Object.keys(provinceSoilMap);
const allCodes = vietnamProvinces.map(p => p.code);
const missingCodes = allCodes.filter(code => !extractedCodes.includes(code));

if (missingCodes.length > 0) {
  console.log(`⚠️  ${missingCodes.length} provinces have no soil data:`);
  missingCodes.forEach(code => {
    const province = vietnamProvinces.find(p => p.code === code);
    console.log(`   - ${province?.name || code} (${code})`);
  });
} else {
  console.log('✅ All provinces have soil data!');
}

console.log('\n💡 Next step: Run "node scripts/importProvinceData.js" to import into MongoDB');

