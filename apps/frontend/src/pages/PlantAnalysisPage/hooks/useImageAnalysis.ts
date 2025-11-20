import { useState, useCallback } from 'react'
import type { UploadedImage, AnalysisResult } from '../types'
import { uploadImage, analyzeImage } from '../services/analysisService'

export const useImageAnalysis = () => {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [pendingAnalysis, setPendingAnalysis] = useState<Set<string>>(new Set())

  const addImage = useCallback((file: File): { id: string; image: UploadedImage } => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`File ${file.name} quá lớn! Vui lòng chọn file nhỏ hơn 10MB`)
    }

    const id = `img_${Date.now()}_${Math.random()}`
    const url = URL.createObjectURL(file)

    const newImage: UploadedImage = {
      id,
      file,
      previewUrl: url,
      analyzing: false,
      result: null,
    }

    // Single state update to avoid race conditions
    setImages((prev) => {
      const updated = [...prev, newImage]
      // Auto-select first image
      if (updated.length === 1) {
        setSelectedImageId(id)
      }
      return updated
    })

    // Mark as pending analysis
    setPendingAnalysis((prev) => new Set(prev).add(id))

    // Return both id and the actual image object
    return { id, image: newImage }
  }, [])

  const removeImage = useCallback(
    (imageId: string) => {
      const image = images.find((img) => img.id === imageId)
      if (image) {
        URL.revokeObjectURL(image.previewUrl)
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

      // Upload image
      const imageUrl = await uploadImage(fileToUpload)

      // Analyze image
      const result = await analyzeImage(imageUrl)

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                analyzing: false,
                result,
              }
            : img,
        ),
      )

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
  }
}

