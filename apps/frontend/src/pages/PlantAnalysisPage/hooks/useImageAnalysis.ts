import { useState, useCallback, useEffect } from 'react'
import type { UploadedImage, AnalysisResult } from '../types'
import { uploadImage } from '../services/analysisService'
// import { validateImage } from '../services/analysisService' // Disabled to save Plant.id credits
import { useStreamingAnalysis } from './useStreamingAnalysis'

const STORAGE_KEY = 'plant_analysis_results'

// Helper functions for localStorage
const saveAnalysisToStorage = (result: AnalysisResult, imageUrl: string, imageId: string) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const results = saved ? JSON.parse(saved) : {}
    
    results[imageId] = {
      result,
      imageUrl,
      timestamp: Date.now(),
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
    console.log('💾 [useImageAnalysis] Saved analysis result to localStorage:', imageId)
  } catch (error) {
    console.error('❌ [useImageAnalysis] Failed to save to localStorage:', error)
  }
}

const loadAnalysisFromStorage = (): Record<string, { result: AnalysisResult; imageUrl: string; timestamp: number }> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return {}
    
    const results = JSON.parse(saved)
    console.log('📂 [useImageAnalysis] Loaded analysis results from localStorage:', Object.keys(results).length)
    return results
  } catch (error) {
    console.error('❌ [useImageAnalysis] Failed to load from localStorage:', error)
    return {}
  }
}

export const useImageAnalysis = () => {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [pendingAnalysis, setPendingAnalysis] = useState<Set<string>>(new Set())
  const streamingAnalysis = useStreamingAnalysis()

  // Load saved analysis results on mount
  useEffect(() => {
    const savedResults = loadAnalysisFromStorage()
    if (Object.keys(savedResults).length > 0) {
      const savedEntries = Object.entries(savedResults)
      // Sort by timestamp, get latest
      const sortedEntries = savedEntries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      const [imageId, data] = sortedEntries[0]
      
      // Create a placeholder image with saved result
      // Note: We can't restore the File object, but we can restore the result
      const savedImage: UploadedImage = {
        id: imageId,
        file: new File([], 'saved-image.jpg', { type: 'image/jpeg' }), // Placeholder file
        previewUrl: data.imageUrl || data.result.imageUrl, // Use saved imageUrl or from result
        analyzing: false,
        result: data.result,
        validation: {
          isValid: true,
          isPlant: true,
          confidence: 1,
          message: 'Kết quả đã lưu từ phiên trước',
          validating: false,
        },
      }
      
      setImages([savedImage])
      setSelectedImageId(imageId)
      console.log('✅ [useImageAnalysis] Restored analysis result from localStorage:', imageId)
    }
  }, [])

  const addImage = useCallback((file: File): { id: string; image: UploadedImage } => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`File ${file.name} quá lớn! Vui lòng chọn file nhỏ hơn 10MB`)
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      throw new Error(`File ${file.name} không đúng định dạng! Chỉ chấp nhận PNG, JPG, WEBP`)
    }

    const id = `img_${Date.now()}_${Math.random()}`
    const url = URL.createObjectURL(file)

    const newImage: UploadedImage = {
      id,
      file,
      previewUrl: url,
      analyzing: false,
      result: null,
      validation: {
        isValid: true,
        isPlant: null,
        confidence: 0,
        message: 'Đang kiểm tra hình ảnh...',
        validating: true,
      },
    }

    // Single state update - chỉ cho phép 1 hình, thay thế hình cũ nếu có
    setImages((prev) => {
      // Cleanup old images
      prev.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl)
      })
      // Set new image
      setSelectedImageId(id)
      return [newImage]
    })

    // Mark as pending analysis
    setPendingAnalysis((prev) => new Set([id]))

    // ⚠️ VALIDATION DISABLED - Skip image validation to save Plant.id credits
    // Set validation as valid by default
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? {
              ...img,
              validation: {
                isValid: true,
                isPlant: true,
                confidence: 1,
                message: 'Hình ảnh đã sẵn sàng để phân tích',
                validating: false,
              },
            }
          : img,
      ),
    )

    // OLD VALIDATION CODE - COMMENTED OUT TO SAVE CREDITS
    // ;(async () => {
    //   try {
    //     // Upload image first
    //     const imageUrl = await uploadImage(file)
    //     
    //     // Then validate
    //     const validationResult = await validateImage(imageUrl)
    //     
    //     setImages((prev) =>
    //       prev.map((img) =>
    //         img.id === id
    //           ? {
    //               ...img,
    //               validation: {
    //                 ...validationResult,
    //                 validating: false,
    //               },
    //             }
    //           : img,
    //       ),
    //     )

    //     // If invalid, remove from pending analysis
    //     if (!validationResult.isValid) {
    //       setPendingAnalysis((prev) => {
    //         const newSet = new Set(prev)
    //         newSet.delete(id)
    //         return newSet
    //       })
    //     }
    //   } catch (error: any) {
    //     console.error('Validation error:', error)
    //     setImages((prev) =>
    //       prev.map((img) =>
    //         img.id === id
    //           ? {
    //               ...img,
    //               validation: {
    //                 isValid: true, // Allow to proceed
    //                 isPlant: null,
    //                 confidence: 0,
    //                 message: 'Không thể kiểm tra hình ảnh. Bạn vẫn có thể thử phân tích.',
    //                 warning: true,
    //                 validating: false,
    //               },
    //             }
    //           : img,
    //       ),
    //     )
    //   }
    // })()

    // Return both id and the actual image object
    return { id, image: newImage }
  }, [])

  const removeImage = useCallback(
    (imageId: string) => {
      const image = images.find((img) => img.id === imageId)
      if (image) {
        URL.revokeObjectURL(image.previewUrl)
      }

      // Remove from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const results = JSON.parse(saved)
          delete results[imageId]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
          console.log('🗑️ [useImageAnalysis] Removed analysis result from localStorage:', imageId)
        }
      } catch (error) {
        console.error('❌ [useImageAnalysis] Failed to remove from localStorage:', error)
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId))

      // Select another image if current was removed
      if (selectedImageId === imageId) {
        setImages((currentImages) => {
          const remaining = currentImages.filter((img) => img.id !== imageId)
          setSelectedImageId(remaining.length > 0 ? remaining[0].id : null)
          return currentImages
        })
      }
    },
    [images, selectedImageId],
  )

  const analyze = useCallback(async (imageId: string, imageFile?: File) => {
    console.log('📊 [analyze] Called with:', { imageId, hasFile: !!imageFile })
    
    // Check validation first
    let imageToCheck: UploadedImage | null = null
    setImages((prev) => {
      imageToCheck = prev.find((img) => img.id === imageId) || null
      return prev
    })

    if (imageToCheck?.validation && !imageToCheck.validation.isValid && !imageToCheck.validation.warning) {
      throw new Error(imageToCheck.validation.message || 'Hình ảnh không hợp lệ')
    }
    
    // Determine which file to upload BEFORE any async operations
    let fileToUpload: File | null = null
    
    if (imageFile) {
      // File provided directly - use it
      fileToUpload = imageFile
      console.log('✅ [analyze] Using provided file:', imageFile.name)
    } else {
      // Need to lookup from state
      // Use a temporary variable to capture from functional update
      let foundFile: File | null = null
      setImages((prev) => {
        console.log('🔍 [analyze] Looking up in state, images count:', prev.length)
        const imageInState = prev.find((img) => img.id === imageId)
        foundFile = imageInState?.file || null
        console.log('🔍 [analyze] Found in state:', !!foundFile)
        return prev // Don't update state yet, just capture the file
      })
      fileToUpload = foundFile
    }

    // Now set analyzing state
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              analyzing: true,
              error: undefined,
            }
          : img,
      ),
    )

    try {
      console.log('🎯 [analyze] Final fileToUpload:', !!fileToUpload)
      if (!fileToUpload) {
        throw new Error('Image not found')
      }

      // Upload image first
      const imageUrl = await uploadImage(fileToUpload)

      // Use streaming analysis
      console.log('📡 [analyze] Starting streaming analysis...')
      const result = await streamingAnalysis.analyze(imageUrl)

      // Update image with result
      setImages((prev) => {
        const updatedImage = prev.find((img) => img.id === imageId)
        
        // Save to localStorage for persistence across page refreshes
        if (updatedImage) {
          // Use imageUrl from result (Cloudinary URL) instead of previewUrl (blob URL)
          // Blob URLs don't persist across page refreshes
          const imageUrlToSave = result.imageUrl || updatedImage.previewUrl
          saveAnalysisToStorage(result, imageUrlToSave, imageId)
        }
        
        return prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                analyzing: false,
                result,
              }
            : img,
        )
      })

      // Remove from pending analysis
      setPendingAnalysis((prev) => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })

      return result
    } catch (error: any) {
      console.error('Analysis error:', error)
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                analyzing: false,
                error: error.response?.data?.message || error.message || 'Phân tích thất bại',
              }
            : img,
        ),
      )
      throw error
    }
  }, [])

  const resetImage = useCallback((imageId: string) => {
    // Remove from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const results = JSON.parse(saved)
        delete results[imageId]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
        console.log('🗑️ [useImageAnalysis] Removed analysis result from localStorage:', imageId)
      }
    } catch (error) {
      console.error('❌ [useImageAnalysis] Failed to remove from localStorage:', error)
    }

    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              result: null,
              analyzing: false,
              error: undefined,
            }
          : img,
      ),
    )
    setPendingAnalysis((prev) => {
      const newSet = new Set(prev)
      newSet.add(imageId)
      return newSet
    })
  }, [])

  const selectedImage = images.find((img) => img.id === selectedImageId) || null
  const needsAnalysis = selectedImageId ? pendingAnalysis.has(selectedImageId) : false

  return {
    images,
    selectedImage,
    selectedImageId,
    setSelectedImageId,
    addImage,
    removeImage,
    analyze,
    resetImage,
    needsAnalysis,
    streamingState: streamingAnalysis.state,
  }
}

