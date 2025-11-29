import axios from 'axios';
import { parseString } from 'xml2js';

/**
 * Fetch articles from Google News RSS
 * @param {string} provinceName - Province name
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchFromGoogleNews = async (provinceName, limit = 5) => {
  try {
    // Keywords for agriculture-related news - prioritize disaster/weather over economy
    const keywords = ['nông nghiệp', 'thời tiết', 'mùa vụ', 'cây trồng', 'lũ', 'ngập', 'bão', 'thiên tai'];
    const query = `${provinceName} (${keywords.join(' OR ')})`;
    
    // Google News RSS URL
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=vi&gl=VN&ceid=VN:vi`;
    
    const response = await axios.get(rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return new Promise((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const items = result?.rss?.channel?.[0]?.item || [];
        const provinceNameLower = provinceName.toLowerCase();
        
        const articles = items.slice(0, limit * 2) // Get more to filter
          .map(item => {
            let url = item.link?.[0] || '';
            
            // Extract image from description or media:content
            let imageUrl = null;
            if (item.description && item.description[0]) {
              // Try to extract image from HTML description
              const desc = item.description[0];
              const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch) {
                imageUrl = imgMatch[1];
              }
            }
            // Try media:content (some RSS feeds use this)
            if (!imageUrl && item['media:content'] && item['media:content'][0] && item['media:content'][0].$.url) {
              imageUrl = item['media:content'][0].$.url;
            }
            // Try media:thumbnail
            if (!imageUrl && item['media:thumbnail'] && item['media:thumbnail'][0] && item['media:thumbnail'][0].$.url) {
              imageUrl = item['media:thumbnail'][0].$.url;
            }
            
            // Extract title - try multiple sources
            let title = item.title?.[0]?.trim() || '';
            
            // If title is empty, try to extract from description (remove HTML tags)
            if (!title && item.description?.[0]) {
              const desc = item.description[0];
              // Remove HTML tags and get first 100 chars
              title = desc.replace(/<[^>]*>/g, '').trim().substring(0, 100);
            }
            
            // If still no title, skip this article
            if (!title || title.length < 5) {
              return null;
            }
            
            const description = item.description?.[0] || '';
            
            // Check if article is actually about this province
            // For disaster/weather articles, be more lenient - check both title and description
            const titleLower = title.toLowerCase();
            const descLower = description.toLowerCase();
            const disasterKeywords = ['lũ', 'ngập', 'bão', 'thiên tai', 'sạt lở', 'cứu hộ', 'sơ tán', 'thiệt hại', 'mưa lớn', 'thời tiết', 'cảnh báo', 'nông nghiệp', 'mùa vụ'];
            const economicKeywords = ['kinh tế', 'giá', 'thị trường', 'xuất khẩu', 'nhập khẩu', 'doanh nghiệp', 'đầu tư', 'cổ phiếu', 'chứng khoán'];
            const hasDisasterKeyword = disasterKeywords.some(k => titleLower.includes(k) || descLower.includes(k));
            const isPureEconomic = economicKeywords.some(k => titleLower.includes(k)) && !hasDisasterKeyword;
            
            // More lenient: relevant if has province name OR (has disaster keyword and mentions province/region in description)
            // But exclude pure economic articles
            const isRelevant = !isPureEconomic && (
              titleLower.includes(provinceNameLower) || 
              descLower.includes(provinceNameLower) ||
              (hasDisasterKeyword && (descLower.includes(provinceNameLower) || titleLower.includes('miền trung') || titleLower.includes('miền bắc') || titleLower.includes('miền nam')))
            );
            
            return {
              title: title,
              url: url,
              source: item.source?.[0]?._ || item.source?.[0] || 'Google News',
              date: item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date(),
              imageUrl: imageUrl || null,
              _isRelevant: isRelevant
            };
          })
          .filter(a => a && a.title && a.title.length > 5 && a.url && a._isRelevant) // Only keep relevant articles with valid title
          .slice(0, limit) // Limit final results
          .map(({ _isRelevant, ...article }) => article); // Remove helper field
        
        resolve(articles);
      });
    });
  } catch (error) {
    console.warn(`⚠️  Google News fetch failed for ${provinceName}:`, error.message);
    return [];
  }
};

/**
 * Fetch from VnExpress RSS
 * @param {string} provinceName - Province name
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchFromVnExpress = async (provinceName, limit = 3) => {
  try {
    const rssUrl = `https://vnexpress.net/rss/kinh-doanh.rss`;
    
    const response = await axios.get(rssUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return new Promise((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const items = result?.rss?.channel?.[0]?.item || [];
        const provinceNameLower = provinceName.toLowerCase();
        
        const articles = items
          .filter(item => {
            const title = (item.title?.[0] || '').toLowerCase();
            const desc = (item.description?.[0] || '').toLowerCase();
            // More strict matching - must contain full province name
            return title.includes(provinceNameLower) || desc.includes(provinceNameLower);
          })
          .slice(0, limit)
          .map(item => {
            // Extract image from VnExpress description
            let imageUrl = null;
            if (item.description && item.description[0]) {
              const desc = item.description[0];
              const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch) {
                imageUrl = imgMatch[1];
              }
            }
            
            // Extract title - ensure it's not empty
            let title = item.title?.[0]?.trim() || '';
            if (!title && item.description?.[0]) {
              const desc = item.description[0];
              title = desc.replace(/<[^>]*>/g, '').trim().substring(0, 100);
            }
            
            // Skip if no valid title
            if (!title || title.length < 5) {
              return null;
            }
            
            return {
              title: title,
              url: item.link?.[0] || '',
              source: 'VnExpress',
              date: item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date(),
              imageUrl: imageUrl || null
            };
          })
          .filter(a => a && a.title && a.title.length > 5 && a.url);
        
        resolve(articles);
      });
    });
  } catch (error) {
    console.warn(`⚠️  VnExpress fetch failed for ${provinceName}:`, error.message);
    return [];
  }
};

/**
 * Fetch articles about floods and storms specifically
 * @param {string} provinceName - Province name
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchFloodStormArticles = async (provinceName, limit = 5) => {
  try {
    // Keywords specifically for floods and storms
    const keywords = [
      'ngập lụt', 'ngập úng', 'lũ lụt', 'lũ quét', 'sạt lở', 
      'bão', 'bão số', 'áp thấp nhiệt đới', 'gió mạnh', 'mưa bão',
      'thiệt hại', 'cứu hộ', 'sơ tán', 'phòng chống lũ', 'phòng chống bão'
    ];
    const query = `${provinceName} (${keywords.join(' OR ')})`;
    
    // Google News RSS URL
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=vi&gl=VN&ceid=VN:vi`;
    
    const response = await axios.get(rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return new Promise((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const items = result?.rss?.channel?.[0]?.item || [];
        const provinceNameLower = provinceName.toLowerCase();
        
        const floodStormKeywords = ['ngập', 'lũ', 'bão', 'sạt lở', 'thiệt hại', 'cứu hộ', 'sơ tán'];
        
        const articles = items.slice(0, limit * 3) // Get more to filter
          .map(item => {
            let url = item.link?.[0] || '';
            
            // Extract image
            let imageUrl = null;
            if (item.description && item.description[0]) {
              const desc = item.description[0];
              const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch) {
                imageUrl = imgMatch[1];
              }
            }
            if (!imageUrl && item['media:content'] && item['media:content'][0] && item['media:content'][0].$.url) {
              imageUrl = item['media:content'][0].$.url;
            }
            if (!imageUrl && item['media:thumbnail'] && item['media:thumbnail'][0] && item['media:thumbnail'][0].$.url) {
              imageUrl = item['media:thumbnail'][0].$.url;
            }
            
            // Extract title - ensure it's not empty
            let title = item.title?.[0]?.trim() || '';
            if (!title && item.description?.[0]) {
              const desc = item.description[0];
              title = desc.replace(/<[^>]*>/g, '').trim().substring(0, 100);
            }
            
            // Skip if no valid title
            if (!title || title.length < 5) {
              return null;
            }
            
            const description = item.description?.[0] || '';
            
            // Check if article is about flood/storm and relevant to province
            const titleLower = title.toLowerCase();
            const descLower = description.toLowerCase();
            const isFloodStorm = floodStormKeywords.some(keyword => 
              titleLower.includes(keyword) || descLower.includes(keyword)
            );
            
            // More lenient for flood/storm articles - check region if province name not found
            const regionKeywords = {
              'huế': ['thừa thiên huế', 'miền trung', 'bắc trung bộ'],
              'quảng nam': ['miền trung', 'nam trung bộ'],
              'đà nẵng': ['miền trung', 'nam trung bộ']
            };
            const regionMatches = regionKeywords[provinceNameLower]?.some(region => 
              titleLower.includes(region) || descLower.includes(region)
            ) || false;
            
            const isRelevant = isFloodStorm && (
              titleLower.includes(provinceNameLower) || 
              descLower.includes(provinceNameLower) ||
              regionMatches ||
              (isFloodStorm && (descLower.includes(provinceNameLower) || titleLower.includes('miền trung')))
            );
            
            return {
              title: title,
              url: url,
              source: item.source?.[0]?._ || item.source?.[0] || 'Google News',
              date: item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date(),
              imageUrl: imageUrl || null,
              _isRelevant: isRelevant
            };
          })
          .filter(a => a && a.title && a.title.length > 5 && a.url && a._isRelevant)
          .slice(0, limit)
          .map(({ _isRelevant, ...article }) => article);
        
        resolve(articles);
      });
    });
  } catch (error) {
    console.warn(`⚠️  Flood/Storm articles fetch failed for ${provinceName}:`, error.message);
    return [];
  }
};

/**
 * Fetch articles about weather and disasters
 * @param {string} provinceName - Province name
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchWeatherDisasterArticles = async (provinceName, limit = 5) => {
  try {
    // Keywords for weather and disaster news
    const keywords = [
      'thời tiết', 'cảnh báo', 'thiên tai', 'bão', 'lũ lụt', 
      'hạn hán', 'mưa lớn', 'sương giá', 'gió mạnh', 'dự báo thời tiết',
      'khí tượng', 'thủy văn', 'cảnh báo thiên tai', 'phòng chống thiên tai',
      'ngập lụt', 'ngập úng', 'lũ quét', 'sạt lở'
    ];
    const query = `${provinceName} (${keywords.join(' OR ')})`;
    
    // Google News RSS URL
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=vi&gl=VN&ceid=VN:vi`;
    
    const response = await axios.get(rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return new Promise((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const items = result?.rss?.channel?.[0]?.item || [];
        const provinceNameLower = provinceName.toLowerCase();
        
        const articles = items.slice(0, limit * 2) // Get more to filter
          .map(item => {
            let url = item.link?.[0] || '';
            
            // Extract image from description or media:content
            let imageUrl = null;
            if (item.description && item.description[0]) {
              const desc = item.description[0];
              const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch) {
                imageUrl = imgMatch[1];
              }
            }
            if (!imageUrl && item['media:content'] && item['media:content'][0] && item['media:content'][0].$.url) {
              imageUrl = item['media:content'][0].$.url;
            }
            if (!imageUrl && item['media:thumbnail'] && item['media:thumbnail'][0] && item['media:thumbnail'][0].$.url) {
              imageUrl = item['media:thumbnail'][0].$.url;
            }
            
            // Extract title - ensure it's not empty
            let title = item.title?.[0]?.trim() || '';
            if (!title && item.description?.[0]) {
              const desc = item.description[0];
              title = desc.replace(/<[^>]*>/g, '').trim().substring(0, 100);
            }
            
            // Skip if no valid title
            if (!title || title.length < 5) {
              return null;
            }
            
            const description = item.description?.[0] || '';
            
            // Check if article is about weather/disaster
            const titleLower = title.toLowerCase();
            const descLower = description.toLowerCase();
            const weatherKeywords = ['thời tiết', 'cảnh báo', 'thiên tai', 'bão', 'lũ', 'hạn hán', 'mưa', 'sương giá', 'gió', 'dự báo'];
            const isWeatherRelated = weatherKeywords.some(keyword => 
              titleLower.includes(keyword) || descLower.includes(keyword)
            );
            const isRelevant = (titleLower.includes(provinceNameLower) || descLower.includes(provinceNameLower)) && isWeatherRelated;
            
            return {
              title: title,
              url: url,
              source: item.source?.[0]?._ || item.source?.[0] || 'Google News',
              date: item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date(),
              imageUrl: imageUrl || null,
              _isRelevant: isRelevant
            };
          })
          .filter(a => a && a.title && a.title.length > 5 && a.url && a._isRelevant)
          .slice(0, limit)
          .map(({ _isRelevant, ...article }) => article);
        
        resolve(articles);
      });
    });
  } catch (error) {
    console.warn(`⚠️  Weather/Disaster articles fetch failed for ${provinceName}:`, error.message);
    return [];
  }
};

/**
 * Fetch articles from all sources for a province
 * @param {string} provinceName - Province name
 * @returns {Promise<Array>} Array of unique articles
 */
export const fetchProvinceArticles = async (provinceName) => {
  try {
    // Fetch from multiple sources in parallel - including weather/disaster and flood/storm articles
    const [googleArticles, vnexpressArticles, weatherArticles, floodStormArticles] = await Promise.all([
      fetchFromGoogleNews(provinceName, 5),
      fetchFromVnExpress(provinceName, 3),
      fetchWeatherDisasterArticles(provinceName, 5), // Weather/disaster articles
      fetchFloodStormArticles(provinceName, 5) // Flood/storm articles specifically
    ]);
    
    // Combine and deduplicate by URL
    const allArticles = [...googleArticles, ...vnexpressArticles, ...weatherArticles, ...floodStormArticles];
    const uniqueArticles = [];
    const seenUrls = new Set();
    
    for (const article of allArticles) {
      if (article.url && !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueArticles.push(article);
      }
    }
    
    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });
    
    return uniqueArticles;
  } catch (error) {
    console.error(`❌ Error fetching articles for ${provinceName}:`, error);
    return [];
  }
};

