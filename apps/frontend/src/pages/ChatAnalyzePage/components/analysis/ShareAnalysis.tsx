import React, { useState } from 'react'
import { 
  ShareIcon, 
  CopyIcon, 
  DownloadIcon, 
  FacebookIcon, 
  TwitterIcon, 
  MessageCircleIcon,
  FileTextIcon,
  CheckIcon,
  XIcon
} from 'lucide-react'
import type { AnalysisResult } from '../../types/analyze.types'

interface ShareAnalysisProps {
  result: AnalysisResult | null
  className?: string
}

interface ShareOption {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  color: string
}

export const ShareAnalysis: React.FC<ShareAnalysisProps> = ({ 
  result, 
  className = '' 
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!result) {
    return null
  }

  const generateShareText = (): string => {
    const plantName = result.plant.commonName
    const scientificName = result.plant.scientificName
    const confidence = Math.round(result.confidence * 100)
    
    let text = `🌱 Phân tích cây trồng với GreenGrow\n\n`
    text += `📋 Loại cây: ${plantName} (${scientificName})\n`
    text += `🎯 Độ tin cậy: ${confidence}%\n\n`
    
    if (result.disease && result.confidence > 0.5) {
      text += `⚠️ Phát hiện bệnh: ${result.disease.name}\n`
      text += `📝 Mô tả: ${result.disease.description}\n\n`
    } else {
      text += `✅ Không phát hiện bệnh rõ ràng\n\n`
    }
    
    if (result.care && result.care.length > 0) {
      text += `💡 Hướng dẫn chăm sóc:\n`
      result.care.forEach((item, index) => {
        text += `${index + 1}. ${item}\n`
      })
      text += `\n`
    }
    
    if (result.products && result.products.length > 0) {
      text += `🛒 Sản phẩm khuyến nghị:\n`
      result.products.forEach((product, index) => {
        text += `${index + 1}. ${product.name} - ${product.price}\n`
      })
    }
    
    text += `\n#GreenGrow #PlantAnalysis #Agriculture`
    
    return text
  }

  const generatePDFContent = (): string => {
    const shareText = generateShareText()
    return `
      <html>
        <head>
          <title>Phân tích cây trồng - GreenGrow</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { color: #059669; font-size: 24px; margin-bottom: 20px; }
            .section { margin: 15px 0; }
            .section h3 { color: #374151; margin-bottom: 10px; }
            .care-list { margin-left: 20px; }
            .product-list { margin-left: 20px; }
          </style>
        </head>
        <body>
          <div class="header">🌱 Phân tích cây trồng - GreenGrow</div>
          <div class="section">
            <h3>📋 Thông tin cây trồng</h3>
            <p><strong>Loại cây:</strong> ${result.plant.commonName}</p>
            <p><strong>Tên khoa học:</strong> ${result.plant.scientificName}</p>
            <p><strong>Độ tin cậy:</strong> ${Math.round(result.confidence * 100)}%</p>
          </div>
          ${result.disease && result.confidence > 0.5 ? `
            <div class="section">
              <h3>⚠️ Phát hiện bệnh</h3>
              <p><strong>Tên bệnh:</strong> ${result.disease.name}</p>
              <p><strong>Mô tả:</strong> ${result.disease.description}</p>
            </div>
          ` : `
            <div class="section">
              <h3>✅ Kết quả phân tích</h3>
              <p>Không phát hiện bệnh rõ ràng trên cây trồng</p>
            </div>
          `}
          ${result.care && result.care.length > 0 ? `
            <div class="section">
              <h3>💡 Hướng dẫn chăm sóc</h3>
              <ul class="care-list">
                ${result.care.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${result.products && result.products.length > 0 ? `
            <div class="section">
              <h3>🛒 Sản phẩm khuyến nghị</h3>
              <ul class="product-list">
                ${result.products.map(product => `<li>${product.name} - ${product.price}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="section">
            <p><em>Được tạo bởi GreenGrow - Ứng dụng nông nghiệp thông minh</em></p>
          </div>
        </body>
      </html>
    `
  }

  const copyToClipboard = async () => {
    try {
      const shareText = generateShareText()
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const shareToSocial = (platform: string) => {
    const shareText = generateShareText()
    const encodedText = encodeURIComponent(shareText)
    
    let url = ''
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}`
        break
      default:
        return
    }
    
    window.open(url, '_blank', 'width=600,height=400')
  }

  const downloadAsPDF = async () => {
    setIsGenerating(true)
    try {
      // In a real implementation, you would use a PDF generation library
      // For now, we'll create a simple text file
      const content = generateShareText()
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `green-grow-analysis-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      label: 'Sao chép',
      icon: copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />,
      action: copyToClipboard,
      color: copied ? 'text-green-600' : 'text-gray-600'
    },
    {
      id: 'download',
      label: 'Tải xuống',
      icon: isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" /> : <DownloadIcon size={16} />,
      action: downloadAsPDF,
      color: 'text-gray-600'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon size={16} />,
      action: () => shareToSocial('facebook'),
      color: 'text-blue-600'
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: <TwitterIcon size={16} />,
      action: () => shareToSocial('twitter'),
      color: 'text-blue-400'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircleIcon size={16} />,
      action: () => shareToSocial('whatsapp'),
      color: 'text-green-500'
    }
  ]

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ShareIcon size={16} />
        <span>Chia sẻ</span>
      </button>

      {showShareMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* Share menu */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Chia sẻ kết quả phân tích
              </div>
              <div className="space-y-1">
                {shareOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      option.action()
                      setShowShareMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors ${option.color}`}
                    disabled={isGenerating && option.id === 'download'}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Compact share button for mobile
export const ShareButton: React.FC<ShareAnalysisProps> = ({ 
  result, 
  className = '' 
}) => {
  const [copied, setCopied] = useState(false)

  if (!result) {
    return null
  }

  const copyToClipboard = async () => {
    try {
      const shareText = `🌱 Phân tích cây trồng với GreenGrow\n\n` +
        `📋 Loại cây: ${result.plant.commonName}\n` +
        `🎯 Độ tin cậy: ${Math.round(result.confidence * 100)}%\n\n` +
        `#GreenGrow #PlantAnalysis`
      
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        copied 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
    >
      {copied ? <CheckIcon size={16} /> : <ShareIcon size={16} />}
      <span>{copied ? 'Đã sao chép' : 'Chia sẻ'}</span>
    </button>
  )
}
