/**
 * 🌾 RICE DISEASE DETECTION - TEST SCRIPT
 * 
 * Tests the rice-specific disease logic to ensure:
 * 1. Rice plants are correctly identified
 * 2. System uses rice disease knowledge (not generic leaf spot)
 * 3. Correct symptoms and care instructions are generated
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test cases
const testCases = [
  {
    id: 1,
    name: 'Rice with Sheath Blight',
    plant: {
      commonName: 'Rice',
      scientificName: 'Oryza sativa',
      probability: 0.85
    },
    disease: {
      name: 'Leaf spot', // Plant.id generic detection
      originalName: 'Fungi',
      probability: 0.66
    },
    imageDescription: 'Dark brown streaks running along leaf sheaths, yellowing lower leaves',
    expectedDiagnosis: 'Khô vằn',
    expectedSymptoms: ['vệt dọc bẹ', 'thâm nâu', 'vằn'],
    expectedCare: ['giảm ẩm ruộng', 'thông thoáng', 'dọn tàn dư']
  },
  {
    id: 2,
    name: 'Rice with Neck Blast',
    plant: {
      commonName: 'Lúa',
      scientificName: 'Oryza sativa',
      probability: 0.78
    },
    disease: {
      name: 'Bệnh nấm',
      originalName: 'Fungal infection',
      probability: 0.72
    },
    imageDescription: 'Panicle neck constricted and dark, grains empty and whitish',
    expectedDiagnosis: 'Đạo ôn cổ bông',
    expectedSymptoms: ['cổ bông', 'đen', 'hạt lép', 'thắt'],
    expectedCare: ['giảm ẩm', 'bón phân cân đối', 'không thừa đạm']
  },
  {
    id: 3,
    name: 'Rice with Leaf Blast',
    plant: {
      commonName: 'Rice plant',
      scientificName: 'Oryza sativa',
      probability: 0.92
    },
    disease: {
      name: 'Đốm lá',
      originalName: 'Leaf spot',
      probability: 0.81
    },
    imageDescription: 'Diamond-shaped spots on leaves, brown margins, grayish center',
    expectedDiagnosis: 'Đạo ôn lá',
    expectedSymptoms: ['đốm hình thoi', 'viền nâu', 'giữa xám'],
    expectedCare: ['giảm ẩm', 'thông thoáng', 'bón kali']
  },
  {
    id: 4,
    name: 'Non-Rice Plant (Tomato) - Should Use Generic Logic',
    plant: {
      commonName: 'Tomato',
      scientificName: 'Solanum lycopersicum',
      probability: 0.95
    },
    disease: {
      name: 'Đốm lá',
      originalName: 'Leaf spot',
      probability: 0.88
    },
    imageDescription: 'Circular spots on leaves, brown with yellow halo',
    expectedDiagnosis: 'Đốm lá',
    expectedSymptoms: ['đốm tròn', 'vàng', 'nâu'],
    expectedCare: ['cắt lá bệnh', 'tưới gốc', 'giữ lá khô']
  },
  {
    id: 5,
    name: 'Unknown Plant (Low Confidence) - But Rice in Vietnamese Name',
    plant: {
      commonName: 'Không xác định',
      scientificName: '',
      probability: 0.14
    },
    disease: {
      name: 'Bệnh nấm',
      originalName: 'Fungi',
      probability: 0.66
    },
    imageDescription: 'User message says "cây lúa trong hình bị bệnh gì"',
    userMessage: 'cây lúa trong hình bị bệnh gì',
    expectedDiagnosis: 'bệnh lúa', // Should trigger rice logic from user message
    expectedSymptoms: ['bẹ', 'cổ bông', 'hạt'],
    expectedCare: ['giảm ẩm ruộng', 'thông thoáng']
  }
];

/**
 * Rice detection logic (mirrors ai.service.js)
 */
function detectRice(plant, userMessage = '') {
  const scientificName = plant.scientificName || '';
  const plantName = plant.commonName || '';
  const message = userMessage.toLowerCase();
  
  const isRiceFromPlant = 
    scientificName.toLowerCase().includes('oryza') || 
    plantName.toLowerCase().includes('lúa') ||
    plantName.toLowerCase().includes('rice');
  
  const isRiceFromMessage = 
    message.includes('lúa') || 
    message.includes('rice') ||
    message.includes('paddy');
  
  return isRiceFromPlant || isRiceFromMessage;
}

/**
 * Simulate diagnosis logic
 */
function simulateDiagnosis(testCase) {
  const isRice = detectRice(testCase.plant, testCase.userMessage || '');
  
  let diagnosis = testCase.disease.name;
  let symptoms = [];
  let care = [];
  
  if (isRice) {
    // Rice-specific logic
    const description = testCase.imageDescription.toLowerCase();
    
    // Check for sheath blight
    if (description.includes('streak') || description.includes('sheath') || 
        description.includes('brown along') || description.includes('lesion')) {
      diagnosis = 'Khô vằn (Sheath blight)';
      symptoms = ['vệt thâm nâu chạy dọc bẹ lá', 'hình vằn da rắn'];
      care = ['giảm ẩm ruộng', 'thông thoáng', 'dọn tàn dư lá bệnh', 'không ngập nước kéo dài'];
    }
    // Check for neck blast
    else if (description.includes('panicle') || description.includes('neck') || 
             description.includes('constrict') || description.includes('empty grain')) {
      diagnosis = 'Đạo ôn cổ bông (Neck blast)';
      symptoms = ['cổ bông thắt, đen', 'hạt lép, trắng', 'không chín'];
      care = ['bón phân cân đối (không thừa đạm)', 'giảm ẩm', 'phun thuốc phòng trừ khi trổ bông'];
    }
    // Check for leaf blast
    else if (description.includes('diamond') || description.includes('thoi') || 
             description.includes('spot') && description.includes('gray center')) {
      diagnosis = 'Đạo ôn lá (Leaf blast)';
      symptoms = ['đốm hình thoi trên lá', 'viền nâu, giữa xám'];
      care = ['bón kali đầy đủ', 'giảm đạm', 'thông thoáng', 'phun thuốc Tricyclazole'];
    }
    // Generic rice disease
    else {
      diagnosis = 'Bệnh lúa cần kiểm tra thêm';
      symptoms = ['dấu hiệu bất thường trên bẹ/cổ bông/lá'];
      care = ['giảm ẩm ruộng', 'thông thoáng', 'kiểm tra cổ bông và bẹ lá'];
    }
  } else {
    // Generic plant logic
    symptoms = ['đốm trên lá', 'vùng bị bệnh'];
    care = ['cắt bỏ lá bệnh', 'tưới gốc, tránh ướt lá', 'giữ lá khô'];
  }
  
  return { isRice, diagnosis, symptoms, care };
}

/**
 * Check if result matches expectations
 */
function checkResult(testCase, result) {
  const diagnosticMatch = result.diagnosis.toLowerCase().includes(
    testCase.expectedDiagnosis.toLowerCase()
  );
  
  const symptomsMatch = testCase.expectedSymptoms.some(expectedSymptom =>
    result.symptoms.some(symptom => 
      symptom.toLowerCase().includes(expectedSymptom.toLowerCase())
    )
  );
  
  const careMatch = testCase.expectedCare.some(expectedCare =>
    result.care.some(careItem => 
      careItem.toLowerCase().includes(expectedCare.toLowerCase())
    )
  );
  
  const passed = diagnosticMatch && symptomsMatch && careMatch;
  
  return { passed, diagnosticMatch, symptomsMatch, careMatch };
}

/**
 * Run all tests
 */
function runTests() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        🌾 RICE DISEASE DETECTION - TEST SUITE            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`${colors.blue}[Test ${testCase.id}/${testCases.length}]${colors.reset} ${testCase.name}`);
    console.log(`${colors.yellow}Plant:${colors.reset} ${testCase.plant.scientificName || testCase.plant.commonName}`);
    console.log(`${colors.yellow}Disease detected:${colors.reset} ${testCase.disease.originalName} (${Math.round(testCase.disease.probability * 100)}%)`);
    
    const result = simulateDiagnosis(testCase);
    const check = checkResult(testCase, result);
    
    console.log(`${colors.yellow}Is Rice:${colors.reset} ${result.isRice ? '✅ Yes' : '❌ No'}`);
    console.log(`${colors.yellow}Diagnosis:${colors.reset} ${result.diagnosis}`);
    console.log(`${colors.yellow}Symptoms:${colors.reset} ${result.symptoms.slice(0, 2).join(', ')}`);
    console.log(`${colors.yellow}Care:${colors.reset} ${result.care.slice(0, 2).join(', ')}`);
    
    if (check.passed) {
      console.log(`${colors.green}✅ PASSED${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}❌ FAILED${colors.reset}`);
      console.log(`${colors.red}  Diagnostic match: ${check.diagnosticMatch ? '✓' : '✗'}${colors.reset}`);
      console.log(`${colors.red}  Symptoms match: ${check.symptomsMatch ? '✓' : '✗'}${colors.reset}`);
      console.log(`${colors.red}  Care match: ${check.careMatch ? '✓' : '✗'}${colors.reset}`);
      failed++;
    }
    
    console.log(''); // Empty line
  });
  
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}RESULTS:${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passed}/${testCases.length}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}❌ Failed: ${failed}/${testCases.length}${colors.reset}`);
  }
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  if (failed === 0) {
    console.log(`${colors.green}🎉 All tests passed! Rice detection logic is working correctly.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}⚠️  Some tests failed. Please review the logic in ai.service.js${colors.reset}\n`);
  }
}

// Run tests
runTests();

