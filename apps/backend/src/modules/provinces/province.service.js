import ProvinceAgriculture from './province.model.js';
import { getWeatherData, getWeatherAlerts } from '../weather/weather.service.js';
import { httpError } from '../../common/utils/http.js';
import { vietnamProvinces } from './vietnamProvinces.js';
import { callGPT } from '../aiAssistant/ai.service.js';
import { fetchProvinceArticles } from './articleFetcher.service.js';
import { getCropCandidates } from './cropCandidates.service.js';

/**
 * Parse GPT text response into structured JSON
 */
const parseGPTResponse = (text, context) => {
  const cleanText = text.replace(/\*\*/g, '').trim();
  const result = {
    season: null,
    crops: [],
    harvesting: [],
    weather: null,
    notes: []
  };

  // 1. Extract season (Mùa vụ hiện tại)
  const seasonMatch = cleanText.match(/(?:^|\n)\s*\d+\.\s*[Mm]ùa vụ[^:]*:\s*([\s\S]*?)(?=\n\s*\d+\.\s*[Cc]ác loại|$)/i);
  if (seasonMatch) {
    let seasonText = seasonMatch[1]
      .trim()
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Remove crop names that might leak in
    const cropKeywords = ['cây lúa', 'cây điều', 'cây cao su', 'cây cà phê', 'cây tiêu'];
    const hasCropNames = cropKeywords.some(k => seasonText.toLowerCase().includes(k));
    
    if (seasonText.length > 20 && !hasCropNames) {
      result.season = seasonText.substring(0, 500);
    }
  }
  
  // Fallback: if no season found, create a basic description
  if (!result.season) {
    const regionName = context.candidates.region === 'north' ? 'miền Bắc' 
      : context.candidates.region === 'south' ? 'miền Nam' 
      : context.candidates.region === 'central' ? 'miền Trung' 
      : 'khu vực';
    result.season = context.hasDatabaseData 
      ? `Tháng ${context.monthName} tại ${context.provinceName} là thời điểm phù hợp cho các hoạt động nông nghiệp.`
      : `Gợi ý tham khảo: Tháng ${context.month} tại ${regionName} thường là mùa trồng các loại rau màu và cây ngắn ngày.`;
  }

  // 2. Extract crops (Các loại cây trồng)
  const cropsMatch = cleanText.match(/(?:^|\n)\s*\d+\.\s*[Cc]ác loại cây trồng[^:]*:\s*([\s\S]*?)(?=\n\s*\d+\.|$)/i);
  if (cropsMatch) {
    const cropsText = cropsMatch[1];
    const cropItems = cropsText
      .split(/\n/)
      .map(item => item.trim())
      .filter(item => {
        const trimmed = item.replace(/^[-•·]\s*/, '').trim();
        return trimmed.length > 2 && 
               trimmed.length < 50 &&
               !trimmed.match(/^(Cây|Như|Có thể|Liệt kê|Nếu|\[)/i);
      })
      .map(item => {
        let crop = item.replace(/^[-•·]\s*/, '').trim();
        crop = crop.replace(/^Cây\s+/, '');
        crop = crop.replace(/:\s*.*$/, '');
        crop = crop.replace(/\s*\([^)]*\)\s*/g, '');
        crop = crop.replace(/\s*\[[^\]]*\]\s*/g, '');
        return crop.trim();
      })
      .filter(crop => crop.length > 0)
      .filter((item, idx, arr) => arr.indexOf(item) === idx)
      .slice(0, 8);
    
    // Only include crops that are in candidates
    result.crops = cropItems.filter(crop => 
      context.candidates.planting.some(c => 
        c.toLowerCase().includes(crop.toLowerCase()) || 
        crop.toLowerCase().includes(c.toLowerCase())
      )
    );
    
    // If no matches, use candidates directly
    if (result.crops.length === 0) {
      result.crops = context.candidates.planting.slice(0, 5);
    }
  } else {
    // Fallback: use candidates
    result.crops = context.candidates.planting.slice(0, 5);
  }

  // 3. Extract harvesting (Có thể thu hoạch)
  const harvestMatch = cleanText.match(/(?:^|\n)\s*\d+\.\s*[Cc]ó thể thu hoạch[^:]*:\s*([\s\S]*?)(?=\n\s*\d+\.|$)/i);
  if (harvestMatch && context.candidates.harvesting.length > 0) {
    const harvestText = harvestMatch[1];
    const harvestItems = harvestText
      .split(/\n/)
      .map(item => item.trim())
      .filter(item => {
        const trimmed = item.replace(/^[-•·]\s*/, '').trim();
        return trimmed.length > 2 && trimmed.length < 50;
      })
      .map(item => {
        let crop = item.replace(/^[-•·]\s*/, '').trim();
        crop = crop.replace(/^Cây\s+/, '');
        crop = crop.replace(/:\s*.*$/, '');
        return crop.trim();
      })
      .filter(crop => crop.length > 0)
      .slice(0, 5);
    
    result.harvesting = harvestItems.filter(crop => 
      context.candidates.harvesting.some(c => 
        c.toLowerCase().includes(crop.toLowerCase()) || 
        crop.toLowerCase().includes(c.toLowerCase())
      )
    );
    
    if (result.harvesting.length === 0) {
      result.harvesting = context.candidates.harvesting.slice(0, 5);
    }
  } else if (context.candidates.harvesting.length > 0) {
    result.harvesting = context.candidates.harvesting.slice(0, 5);
  }

  // 4. Extract weather (Đánh giá điều kiện thời tiết)
  const weatherMatch = cleanText.match(/(?:^|\n)\s*\d+\.\s*[ĐĐ]ánh giá[^:]*:\s*([\s\S]*?)(?=\n\s*\d+\.|$)/i);
  if (weatherMatch) {
    let weatherText = weatherMatch[1]
      .trim()
      .replace(/cây\s+(lúa|điều|tiêu|cà phê|cao su|ngô|đậu)[^,.]*/gi, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ');
    
    if (weatherText.length > 20) {
      result.weather = weatherText.substring(0, 300);
    }
  }

  // 5. Extract notes (Lưu ý và khuyến nghị) with link parsing
  const notesMatch = cleanText.match(/(?:^|\n)\s*\d+\.\s*[Ll]ưu ý[^:]*:\s*([\s\S]*?)(?=Mong rằng|$)/i);
  if (notesMatch) {
    const notesText = notesMatch[1];
    const allNotes = notesText
      .split(/\n/)
      .map(item => item.trim())
      .filter(item => {
        const trimmed = item.replace(/^[-•·]\s*/, '').trim();
        return trimmed.length > 10 && trimmed.length < 300; // Increased limit to allow links
      })
      .map(note => {
        // Parse markdown links: [text](url) - improved regex to handle URLs with special chars
        // Also handle URLs in parentheses: (url)
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const plainUrlRegex = /(https?:\/\/[^\s\)]+)/g;
        const links = [];
        let match;
        
        // Extract markdown links first
        while ((match = markdownLinkRegex.exec(note)) !== null) {
          const linkText = match[1].trim();
          const linkUrl = match[2].trim();
          // Only add if URL is valid (starts with http)
          if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
            links.push({ text: linkText || 'Xem chi tiết', url: linkUrl });
          }
        }
        
        // If no markdown links, try to extract plain URLs
        if (links.length === 0) {
          while ((match = plainUrlRegex.exec(note)) !== null) {
            const url = match[1].trim();
            if (url.startsWith('http://') || url.startsWith('https://')) {
              links.push({ text: 'Xem chi tiết', url: url });
            }
          }
        }
        
        // If no links found, return simple text
        if (links.length === 0) {
          return {
            text: note,
            hasLinks: false
          };
        }
        
        // If has links, simplify text by removing redundant parts
        let simplifiedText = note;
        
        // Remove common patterns before links (more comprehensive)
        simplifiedText = simplifiedText
          .replace(/Đề xuất đọc bài[^"]*"[^"]*"[^:]*:\s*/gi, 'Đọc thêm: ')
          .replace(/Đọc thêm thông tin về[^:]*:\s*/gi, 'Đọc thêm: ')
          .replace(/Xem thêm tại:\s*/gi, '')
          .replace(/Chi tiết tại:\s*/gi, '')
          .replace(/Tham khảo tại:\s*/gi, '')
          .replace(/trên\s*\[/gi, '')
          .replace(/tại:\s*$/gi, '')
          .replace(/:\s*$/gi, '')
          .trim();
        
        // Remove markdown links from text
        simplifiedText = simplifiedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '').trim();
        
        // Remove plain URLs from text
        simplifiedText = simplifiedText.replace(/(https?:\/\/[^\s\)]+)/g, '').trim();
        
        // Remove redundant quotes and extra spaces
        simplifiedText = simplifiedText
          .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        
        // If text is too long, shorten it intelligently
        if (simplifiedText.length > 80) {
          // Try to find a good cutoff point (sentence end, comma, or dash)
          const cutoffPoints = [simplifiedText.lastIndexOf('.'), simplifiedText.lastIndexOf(','), simplifiedText.lastIndexOf('→')];
          const cutoff = Math.max(...cutoffPoints.filter(p => p > 0 && p < 80));
          
          if (cutoff > 30) {
            simplifiedText = simplifiedText.substring(0, cutoff + 1).trim();
          } else {
            simplifiedText = simplifiedText.substring(0, 80).trim() + '...';
          }
        }
        
        // If text is empty or very short after removing links, use a simple prefix
        if (simplifiedText.length < 5) {
          simplifiedText = 'Tham khảo thêm:';
        }
        
        return {
          text: simplifiedText,
          links: links,
          hasLinks: true,
          raw: note // Keep original for fallback
        };
      });
    
    // Prioritize disaster warnings
    const disasterKeywords = ['thiên tai', 'lũ', 'ngập', 'bão', 'hạn hán', 'sương giá', 'cảnh báo'];
    const prioritizedNotes = allNotes.sort((a, b) => {
      const aText = (a.text || a.raw || '').toLowerCase();
      const bText = (b.text || b.raw || '').toLowerCase();
      const aHasDisaster = disasterKeywords.some(k => aText.includes(k));
      const bHasDisaster = disasterKeywords.some(k => bText.includes(k));
      if (aHasDisaster && !bHasDisaster) return -1;
      if (!aHasDisaster && bHasDisaster) return 1;
      return 0;
    });
    
    result.notes = prioritizedNotes.slice(0, 2);
  }

  return result;
};

/**
 * Auto-fetch articles if needed (non-blocking)
 * @param {object} province - Province document
 */
const autoFetchArticlesIfNeeded = async (province) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Check if articles are empty or too old
    const hasRecentArticles = province.articles.some(a => {
      const articleDate = a.date ? new Date(a.date) : new Date(0);
      return articleDate > sevenDaysAgo;
    });
    
    console.log(`📰 [autoFetchArticlesIfNeeded] ${province.provinceName}: ${province.articles.length} articles, hasRecent: ${hasRecentArticles}`);
    
    // Auto-fetch if: no articles OR less than 5 articles OR all articles are old
    // Lower threshold to fetch more frequently and get more articles
    if (province.articles.length === 0 || 
        province.articles.length < 5 || 
        !hasRecentArticles) {
      
      console.log(`🔄 Auto-fetching articles for ${province.provinceName}...`);
      
      try {
        const articles = await fetchProvinceArticles(province.provinceName);
        console.log(`📰 [autoFetchArticlesIfNeeded] Fetched ${articles.length} articles from API for ${province.provinceName}`);
        
        const existingUrls = new Set(province.articles.map(a => a.url));
        const newArticles = articles.filter(a => a && a.url && a.title && !existingUrls.has(a.url));
        
        console.log(`📰 [autoFetchArticlesIfNeeded] ${newArticles.length} new articles after deduplication`);
        
        if (newArticles.length > 0) {
          province.articles.push(...newArticles);
          // Sort by date (newest first)
          province.articles.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
          });
          // Keep only latest 30 articles per province
          province.articles = province.articles.slice(0, 30);
          await province.save();
          console.log(`✅ Auto-fetched ${newArticles.length} articles for ${province.provinceName}. Total now: ${province.articles.length}`);
        } else {
          console.log(`⚠️  No new articles found for ${province.provinceName} (${articles.length} fetched, but all duplicates or invalid)`);
        }
      } catch (fetchError) {
        console.error(`❌ Error fetching articles for ${province.provinceName}:`, fetchError.message);
        throw fetchError; // Re-throw to be caught by outer catch
      }
    } else {
      console.log(`✅ [autoFetchArticlesIfNeeded] ${province.provinceName} has ${province.articles.length} recent articles, skipping fetch`);
    }
  } catch (error) {
    console.warn(`⚠️  Auto-fetch failed for ${province.provinceName}:`, error.message);
    console.warn(`   Stack:`, error.stack);
    // Don't throw - continue without new articles
  }
};

/**
 * Get province information including weather, soil types, and crop recommendations
 * @param {string} provinceCode - Province code (e.g., "HN", "HCM")
 * @returns {Promise<object>} Province information
 */
export const getProvinceInfo = async (provinceCode) => {
  try {
    // 1. Get province data from database
    const province = await ProvinceAgriculture.findOne({ provinceCode });
    if (!province) {
      throw httpError(404, 'Tỉnh không tồn tại trong hệ thống');
    }

    // 2. Auto-fetch articles if needed (non-blocking, don't wait for it)
    autoFetchArticlesIfNeeded(province).catch(err => {
      console.warn('Auto-fetch error (non-critical):', err.message);
    });

    // 2. Get province coordinates
    const provinceCoords = vietnamProvinces.find(p => p.code === provinceCode);
    if (!provinceCoords) {
      throw httpError(404, 'Không tìm thấy tọa độ tỉnh');
    }

    // 3. Get current weather and forecast
    let weather = null;
    try {
      weather = await getWeatherData({
        lat: provinceCoords.coordinates.lat,
        lon: provinceCoords.coordinates.lng,
      });
    } catch (error) {
      console.warn(`⚠️  Failed to get weather for ${provinceCode}:`, error.message);
      // Continue without weather data
    }

    // 4. Get current month crop recommendations
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthData = province.cropCalendar?.find(
      c => c.month === currentMonth
    ) || { planting: [], harvesting: [] };

    // 5. Filter and prioritize articles (more lenient filter)
    const provinceNameLower = (province.provinceName || '').toLowerCase();
    const disasterKeywords = ['lũ', 'ngập', 'bão', 'thiên tai', 'sạt lở', 'cứu hộ', 'sơ tán', 'thiệt hại', 'mưa lớn', 'thời tiết', 'cảnh báo'];
    const agricultureKeywords = ['nông nghiệp', 'mùa vụ', 'cây trồng', 'nông dân', 'nông sản', 'canh tác', 'trồng trọt', 'chăn nuôi'];
    const economicKeywords = ['kinh tế', 'giá', 'thị trường', 'xuất khẩu', 'nhập khẩu', 'doanh nghiệp', 'đầu tư'];
    
    // Regional keywords for better matching
    const regionKeywords = [];
    if (provinceNameLower.includes('huế') || provinceNameLower.includes('thừa thiên')) {
      regionKeywords.push('miền trung', 'bắc trung bộ', 'thừa thiên huế');
    }
    
    // Filter out invalid articles FIRST - must have valid title and url
    const rawArticles = province.articles || [];
    const allArticles = rawArticles
      .filter(article => {
        if (!article) return false;
        
        const title = (article.title || '').trim();
        const url = (article.url || '').trim();
        
        // Check for invalid titles
        const invalidTitles = ['không có tiêu đề', 'no title', 'untitled'];
        const hasValidTitle = title.length >= 3 && // Reduced from 5 to 3
                             !invalidTitles.includes(title.toLowerCase());
        
        // Check for invalid URLs
        const invalidUrls = ['#', ''];
        const hasValidUrl = url.length > 5 && // Reduced from 10 to 5
                           !invalidUrls.includes(url.toLowerCase());
        
        return hasValidTitle && hasValidUrl;
      });
    
    console.log(`📰 [getProvinceInfo] Processing ${allArticles.length} valid articles for ${province.provinceName} (from ${rawArticles.length} total)`);
    
    // If no valid articles, log warning with details
    if (allArticles.length === 0 && rawArticles.length > 0) {
      console.warn(`⚠️  [getProvinceInfo] No valid articles for ${province.provinceName}. Sample invalid articles:`, 
        rawArticles.slice(0, 3).map(a => ({
          hasTitle: !!a.title,
          titleLength: a.title?.length || 0,
          title: (a.title || '').substring(0, 50) || 'NO TITLE',
          titleValid: (a.title || '').trim().length >= 3,
          hasUrl: !!a.url,
          urlLength: a.url?.length || 0,
          urlValid: (a.url || '').trim().length > 5
        }))
      );
    }
    
    let filteredArticles = allArticles
      .map(article => {
        const titleLower = (article.title || '').toLowerCase();
        const urlLower = (article.url || '').toLowerCase();
        const sourceLower = (article.source || '').toLowerCase();
        
        const hasProvinceName = provinceNameLower && (titleLower.includes(provinceNameLower) || urlLower.includes(provinceNameLower));
        const hasDisasterKeyword = disasterKeywords.some(keyword => titleLower.includes(keyword) || urlLower.includes(keyword));
        const hasAgricultureKeyword = agricultureKeywords.some(keyword => titleLower.includes(keyword) || urlLower.includes(keyword));
        const hasEconomicKeyword = economicKeywords.some(keyword => titleLower.includes(keyword) || urlLower.includes(keyword));
        const hasRegionKeyword = regionKeywords.some(keyword => titleLower.includes(keyword) || urlLower.includes(keyword));
        
        // Calculate priority: higher priority for relevant articles
        let priority = 0;
        if (hasProvinceName) priority += 10;
        if (hasDisasterKeyword) priority += 7;
        if (hasAgricultureKeyword) priority += 5;
        if (hasRegionKeyword) priority += 3;
        if (hasEconomicKeyword && !hasDisasterKeyword && !hasAgricultureKeyword) priority -= 5; // Penalize pure economic articles
        
        return { 
          ...article, 
          _priority: priority, 
          _hasProvinceName: hasProvinceName, 
          _hasDisasterKeyword: hasDisasterKeyword,
          _hasAgricultureKeyword: hasAgricultureKeyword,
          _hasRegionKeyword: hasRegionKeyword
        };
      })
      .filter(article => {
        // Very lenient filter: keep if ANY of these conditions:
        // 1. Has province name
        // 2. Has disaster keyword
        // 3. Has agriculture keyword
        // 4. Has region keyword
        // 5. If no articles pass, keep all (fallback to show something)
        const keep = article._hasProvinceName || 
               article._hasDisasterKeyword || 
               article._hasAgricultureKeyword ||
               article._hasRegionKeyword;
        
        return keep;
      })
      .sort((a, b) => b._priority - a._priority) // Sort by priority
      .slice(0, 10) // Limit to top 10
      .map(({ _priority, _hasProvinceName, _hasDisasterKeyword, _hasAgricultureKeyword, _hasRegionKeyword, ...article }) => {
        // Ensure article has required fields - don't use fallback values, skip if invalid
        const title = (article.title || '').trim();
        const url = (article.url || '').trim();
        
        // More lenient validation
        const invalidTitles = ['không có tiêu đề', 'no title', 'untitled'];
        if (!title || title.length < 3 || invalidTitles.includes(title.toLowerCase())) {
          return null;
        }
        if (!url || url.length < 5 || url === '#') {
          return null;
        }
        
        return {
          title: title,
          url: url,
          source: article.source || 'Nguồn',
          date: article.date || null,
          imageUrl: article.imageUrl || null
        };
      })
      .filter(a => a !== null); // Remove null entries

    console.log(`✅ [getProvinceInfo] Filtered ${filteredArticles.length} articles for ${province.provinceName} (from ${allArticles.length} total)`);
    
    // Log sample articles for debugging
    if (filteredArticles.length > 0) {
      console.log(`   Sample articles:`, filteredArticles.slice(0, 2).map(a => ({ title: a.title?.substring(0, 50), url: a.url?.substring(0, 50) })));
    }
    
    // Debug logging if no articles
    if (filteredArticles.length === 0 && allArticles.length > 0) {
      console.warn(`⚠️  No articles passed filter for ${province.provinceName}. Total articles: ${allArticles.length}`);
      // Log sample titles for debugging
      const sampleTitles = allArticles.slice(0, 3).map(a => ({ title: a.title?.substring(0, 50), hasTitle: !!a.title, hasUrl: !!a.url }));
      console.warn(`   Sample articles:`, sampleTitles);
    }
    
    // If still no articles after relevance filtering, return all valid articles (without relevance filter)
    if (filteredArticles.length === 0 && allArticles.length > 0) {
      console.log(`📰 [getProvinceInfo] No articles passed relevance filter for ${province.provinceName}, returning all valid articles`);
      filteredArticles = allArticles
        .slice(0, 10)
        .map(article => ({
          title: (article.title || '').trim(),
          url: (article.url || '').trim(),
          source: article.source || 'Nguồn',
          date: article.date || null,
          imageUrl: article.imageUrl || null
        }))
        .filter(a => a.title && a.title.length >= 3 && a.url && a.url.length >= 5);
    }

    return {
      provinceName: province.provinceName,
      provinceCode: province.provinceCode,
      temperature: weather?.current?.temperature || null,
      weatherDescription: weather?.current?.description || null,
      weatherForecast: weather?.forecast ? weather.forecast.slice(0, 5) : null, // 5 days forecast
      soilTypes: province.soilTypes.map(s => s.type),
      soilDetails: province.soilTypes,
      currentMonth: {
        month: currentMonth,
        planting: currentMonthData.planting || [],
        harvesting: currentMonthData.harvesting || [],
      },
      articles: filteredArticles,
      source: province.source,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get province info: ${error.message}`);
  }
};

/**
 * Get AI recommendation for crop planting in current season
 * @param {string} provinceCode - Province code
 * @returns {Promise<string>} AI recommendation text
 */
export const getProvinceCropRecommendation = async (provinceCode) => {
  try {
    // 1. Get province data
    const province = await ProvinceAgriculture.findOne({ provinceCode });
    if (!province) {
      throw httpError(404, 'Tỉnh không tồn tại trong hệ thống');
    }

    // 2. Get province coordinates and weather
    const provinceCoords = vietnamProvinces.find(p => p.code === provinceCode);
    if (!provinceCoords) {
      throw httpError(404, 'Không tìm thấy tọa độ tỉnh');
    }

    let weather = null;
    let weatherAlerts = null;
    try {
      weather = await getWeatherData({
        lat: provinceCoords.coordinates.lat,
        lon: provinceCoords.coordinates.lng,
      });
      // Get weather alerts for disaster warnings
      try {
        weatherAlerts = await getWeatherAlerts({
          lat: provinceCoords.coordinates.lat,
          lon: provinceCoords.coordinates.lng,
        });
      } catch (error) {
        console.warn(`⚠️  Failed to get weather alerts for ${provinceCode}:`, error.message);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to get weather for ${provinceCode}:`, error.message);
    }

    // 3. Get current month
    const currentMonth = new Date().getMonth() + 1;
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    // 4. Build context for GPT with REAL data
    const soilTypesText = province.soilTypes.map(s => s.type).join(', ');
    
    // Get crop calendar data for current month
    const currentMonthData = province.cropCalendar?.find(c => c.month === currentMonth);
    const dbPlantingCrops = currentMonthData?.planting || [];
    const dbHarvestingCrops = currentMonthData?.harvesting || [];
    
    // Get crop candidates from rules (prevents hallucination)
    const candidates = getCropCandidates(
      province.provinceName,
      currentMonth,
      dbPlantingCrops,
      dbHarvestingCrops
    );
    
    // Weather forecast data
    const forecastData = weather?.forecast?.slice(0, 3) || [];
    const forecastText = forecastData.length > 0
      ? forecastData.map(f => {
          const date = new Date(f.date);
          return `${date.toLocaleDateString('vi-VN')}: ${f.temperature.min}-${f.temperature.max}°C, ${f.description}, mưa ${f.rain}mm`;
        }).join('; ')
      : null;
    
    // Extract article summaries (use description if available, otherwise title)
    const articleEvidence = province.articles
      .slice(0, 5)
      .map(a => ({
        title: a.title,
        source: a.source || 'Nguồn',
        url: a.url,
        summary: a.title // Will be enhanced later with actual summaries
      }))
      .filter(a => a.title && a.url);

    // 5. Build concise, clear prompt
    const regionName = candidates.region === 'north' ? 'miền Bắc' 
      : candidates.region === 'south' ? 'miền Nam' 
      : candidates.region === 'central' ? 'miền Trung' 
      : 'khu vực';
    
    let systemPrompt = `Bạn là trợ lý nông nghiệp. Nhiệm vụ: Tư vấn mùa vụ dựa trên dữ liệu trong INPUT.

QUY TẮC:
1. CHỈ dùng dữ liệu trong INPUT. KHÔNG được bịa thiên tai, nguồn, hoặc cây trồng ngoài danh sách candidates.
2. Nếu thiếu dữ liệu tỉnh cụ thể → nói rõ "Gợi ý tham khảo theo vùng/tháng" thay vì bịa.
3. CHỈ đề xuất cây trong danh sách candidates. KHÔNG tự nghĩ ra cây khác.
4. Về thiên tai: CHỈ kết luận dựa trên alerts trong INPUT. Nếu không có alerts → nói "Không thấy cảnh báo thiên tai".
5. Trả lời ngắn gọn, cụ thể, dễ hiểu.

FORMAT OUTPUT (bắt buộc, mỗi phần tách biệt):

1. **Mùa vụ hiện tại (${monthNames[currentMonth - 1]}) tại ${province.provinceName}:**
   [2-3 câu mô tả. Nếu có dữ liệu DB → dùng. Nếu không → nói "Gợi ý tham khảo: tháng này tại ${regionName} thường..."]

2. **Các loại cây trồng phổ biến phù hợp với thời điểm này:**
   - [CHỈ liệt kê từ candidates.planting, mỗi cây 1 dòng]
   [Nếu có dữ liệu DB → ghi chú "(theo dữ liệu)". Nếu không → ghi chú "(gợi ý tham khảo)"]`;

    if (candidates.harvesting.length > 0) {
      systemPrompt += `

3. **Có thể thu hoạch:**
   - [CHỈ liệt kê từ candidates.harvesting, mỗi cây 1 dòng]`;
    }

    systemPrompt += `

${candidates.harvesting.length > 0 ? '4' : '3'}. **Đánh giá điều kiện thời tiết hiện tại:**
   [1-2 câu đánh giá về thời tiết. KHÔNG đề cập cây trồng]

${candidates.harvesting.length > 0 ? '5' : '4'}. **Lưu ý và khuyến nghị:**
   [CHỈ 1-2 lưu ý nghiêm trọng nhất]
   - [Nếu có alerts → mô tả cụ thể hành động. Nếu không có alerts → "Không thấy cảnh báo thiên tai, thời tiết [mô tả ngắn] → có thể [1 hành động cụ thể]"]
   - [KHÔNG đề cập bài báo hay links - đã có phần riêng để hiển thị bài báo]`;

    systemPrompt += `

Trả lời bằng tiếng Việt, ngắn gọn.`;

    // Build structured input for GPT
    const inputData = {
      province: province.provinceName,
      month: currentMonth,
      monthName: monthNames[currentMonth - 1],
      region: candidates.region,
      soils: province.soilTypes.map(s => s.type),
      hasDatabaseData: candidates.hasDatabaseData,
      weather: weather ? {
        temp_now: weather.current.temperature,
        humidity: weather.current.humidity,
        description: weather.current.description,
        forecast_3d: forecastData.map(f => ({
          date: new Date(f.date).toLocaleDateString('vi-VN'),
          temp_min: f.temperature.min,
          temp_max: f.temperature.max,
          description: f.description,
          rain: f.rain
        }))
      } : null,
      alerts: weatherAlerts?.alerts || [],
      candidates: {
        plant_now: candidates.planting,
        harvest_now: candidates.harvesting
      },
      evidence: articleEvidence
    };

    const userPrompt = `Tư vấn mùa vụ dựa trên dữ liệu sau:

${JSON.stringify(inputData, null, 2)}

YÊU CẦU:
1. Nếu hasDatabaseData = true → dùng dữ liệu DB. Nếu false → nói "Gợi ý tham khảo theo vùng".
2. CHỈ đề xuất cây trong candidates.plant_now và candidates.harvest_now.
3. Về thiên tai: CHỈ dựa trên alerts. Nếu alerts rỗng → "Không thấy cảnh báo".
4. Nếu weather = null → nói "Chưa có dữ liệu thời tiết".
5. KHÔNG đề cập bài báo hay links trong phần "Lưu ý và khuyến nghị" - đã có phần riêng để hiển thị bài báo.`;

    // 6. Call GPT with lower temperature for accuracy
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Use lower temperature for factual accuracy
    const gptResponse = await callGPT({ 
      messages,
      temperature: 0.2, // Lower temperature for more accurate, less creative responses
      maxTokens: 500 // Limit response length
    });
    
    // Parse GPT response into structured format
    const structuredResponse = parseGPTResponse(gptResponse.content, {
      provinceName: province.provinceName,
      month: currentMonth,
      monthName: monthNames[currentMonth - 1],
      candidates: candidates,
      hasDatabaseData: candidates.hasDatabaseData
    });
    
    return structuredResponse;

  } catch (error) {
    console.error('Error getting crop recommendation:', error);
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get crop recommendation: ${error.message}`);
  }
};

/**
 * Get all provinces with basic info
 * @returns {Promise<Array>} List of provinces
 */
export const getAllProvinces = async () => {
  try {
    const provinces = await ProvinceAgriculture.find({})
      .select('provinceCode provinceName simpleMapsId')
      .lean();

    return provinces;
  } catch (error) {
    throw httpError(500, `Failed to get provinces: ${error.message}`);
  }
};
