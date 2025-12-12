import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import type {
  PlantBox,
  PlantBoxFilters,
  CreatePlantBoxData,
} from '../types/plantBox.types'
import {
  getPlantBoxes,
  createPlantBox as createPlantBoxAPI,
  updatePlantBox as updatePlantBoxAPI,
  deletePlantBox as deletePlantBoxAPI,
} from '../../../services/plantBoxService'

// Helper to map backend data to frontend format
const mapBackendToFrontend = (backendBox: any): PlantBox => {
  return {
    _id: backendBox._id || backendBox.id,
    userId: backendBox.user || backendBox.userId,
    name: backendBox.name,
    type: backendBox.plantType === 'existing' ? 'active' : 'planned',
    plantName: backendBox.plantName,
    scientificName: backendBox.scientificName,
    plantedDate: backendBox.plantedDate
      ? new Date(backendBox.plantedDate).toISOString()
      : undefined,
    plannedDate: backendBox.plannedDate
      ? new Date(backendBox.plannedDate).toISOString()
      : undefined,
    location: {
      name: backendBox.location?.name || '',
      coordinates: backendBox.location?.coordinates
        ? {
            lat: backendBox.location.coordinates.lat,
            lng: backendBox.location.coordinates.lon || backendBox.location.coordinates.lng,
          }
        : undefined,
      area: backendBox.location?.area,
      soilType: Array.isArray(backendBox.location?.soilType) 
        ? backendBox.location.soilType 
        : backendBox.location?.soilType 
          ? [backendBox.location.soilType] 
          : [],
      sunlight: backendBox.location?.sunlight,
    },
    quantity: backendBox.quantity,
    growthStage: backendBox.growthStage,
    currentHealth: backendBox.currentHealth,
    currentDiseases: (backendBox.currentDiseases || []).map((disease: any) => ({
      _id: disease._id,
      name: disease.name,
      symptoms: disease.symptoms,
      severity: disease.severity,
      detectedDate: disease.detectedDate ? new Date(disease.detectedDate).toISOString() : undefined,
      treatmentPlan: disease.treatmentPlan,
      status: disease.status,
      feedback: (disease.feedback || []).map((fb: any) => ({
        _id: fb._id,
        date: fb.date ? new Date(fb.date).toISOString() : new Date().toISOString(),
        status: fb.status,
        notes: fb.notes,
      })),
      selectedTreatments: disease.selectedTreatments ? {
        chemical: disease.selectedTreatments.chemical || [],
        biological: disease.selectedTreatments.biological || [],
        cultural: disease.selectedTreatments.cultural || [],
      } : undefined,
    })),
    healthNotes: backendBox.healthNotes,
    images: (backendBox.images || []).map((img: any, idx: number) => ({
      _id: img._id || `img_${idx}`,
      url: img.url,
      description: img.description,
      date: img.date ? new Date(img.date).toISOString() : new Date().toISOString(),
    })),
    notes: (backendBox.notes || []).map((note: any, idx: number) => ({
      _id: note._id || `note_${idx}`,
      type: note.type,
      content: note.content,
      date: note.date ? new Date(note.date).toISOString() : new Date().toISOString(),
    })),
    specialRequirements: backendBox.specialRequirements,
    createdAt: backendBox.createdAt
      ? new Date(backendBox.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: backendBox.updatedAt
      ? new Date(backendBox.updatedAt).toISOString()
      : new Date().toISOString(),
  }
}

// Helper to map frontend data to backend format
const mapFrontendToBackend = (data: CreatePlantBoxData | Partial<PlantBox> | (CreatePlantBoxData & { imageUrl?: string })): any => {
  const mapped: any = {
    name: data.name?.trim(),
    plantType: data.type === 'active' ? 'existing' : 'planned',
    plantName: data.plantName?.trim(),
    scientificName: data.scientificName?.trim() || undefined,
    location: (() => {
      const location: any = {
        name: data.location?.name?.trim() || '',
        coordinates: data.location?.coordinates
          ? {
              lat: data.location.coordinates.lat,
              lon: data.location.coordinates.lng,
            }
          : undefined,
        area: data.location?.area || undefined,
        sunlight: data.location?.sunlight || 'full',
      }
      
      // Only include soilType if it has valid values (always as array)
      const soilType = data.location?.soilType as string[] | string | undefined
      if (soilType) {
        // Convert to array if it's a string
        const soilTypeArray = Array.isArray(soilType) 
          ? soilType 
          : (typeof soilType === 'string' && soilType.trim() ? [soilType.trim()] : [])
        
        if (soilTypeArray.length > 0) {
          const filtered = soilTypeArray
            .filter((s) => s && typeof s === 'string' && s.trim())
            .map((s) => (s as string).trim())
          if (filtered.length > 0) {
            location.soilType = filtered
          }
        }
      }
      
      return location
    })(),
    quantity: data.quantity || 1,
    growthStage: data.growthStage || undefined,
    specialRequirements: data.specialRequirements?.trim() || undefined,
    currentDiseases: data.currentDiseases && data.currentDiseases.length > 0
      ? data.currentDiseases.map((disease: any) => ({
          name: disease.name?.trim(),
          symptoms: disease.symptoms?.trim() || undefined,
          severity: disease.severity || 'moderate',
          detectedDate: disease.detectedDate ? new Date(disease.detectedDate) : new Date(),
          status: disease.status || 'active',
        }))
      : undefined,
    healthNotes: data.healthNotes?.trim() || undefined,
  }
  
  // Handle imageUrl if provided (from CreateBoxModal)
  if ('imageUrl' in data && data.imageUrl) {
    mapped.images = [{
      url: data.imageUrl,
      date: new Date(),
      description: 'Hình ảnh box',
    }]
  }

  // Remove undefined values from location
  if (!mapped.location.coordinates) {
    delete mapped.location.coordinates
  }
  if (!mapped.location.area) {
    delete mapped.location.area
  }
  // Remove soilType if undefined, null, empty string, or empty array
  if (!mapped.location.soilType || 
      (Array.isArray(mapped.location.soilType) && mapped.location.soilType.length === 0) ||
      (typeof mapped.location.soilType === 'string' && mapped.location.soilType.trim() === '')) {
    delete mapped.location.soilType
  }

  // Remove undefined values from root
  if (!mapped.scientificName) {
    delete mapped.scientificName
  }
  if (!mapped.growthStage) {
    delete mapped.growthStage
  }
  if (!mapped.specialRequirements) {
    delete mapped.specialRequirements
  }

  if (data.type === 'active' && 'plantedDate' in data && data.plantedDate) {
    mapped.plantedDate = new Date(data.plantedDate)
  } else if (data.type === 'planned' && 'plannedDate' in data && data.plannedDate) {
    mapped.plannedDate = new Date(data.plannedDate)
  }

  return mapped
}

export const usePlantBoxes = () => {
  const { isAuthenticated } = useAuth()
  const [boxes, setBoxes] = useState<PlantBox[]>([])
  const [filteredBoxes, setFilteredBoxes] = useState<PlantBox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PlantBoxFilters>({
    search: '',
    type: 'all',
    sortBy: 'newest',
  })
  const loadingRef = useRef(false) // Prevent multiple simultaneous calls

  useEffect(() => {
    const loadBoxes = async () => {
      // Don't load if not authenticated
      if (!isAuthenticated) {
        console.log('⏸️ [usePlantBoxes] Not authenticated, skipping...')
        setLoading(false)
        setBoxes([])
        return
      }

      // Prevent multiple simultaneous calls
      if (loadingRef.current) {
        console.log('⏸️ [usePlantBoxes] Already loading, skipping...')
        return
      }

      loadingRef.current = true
      setLoading(true)
      setError(null)
      
      try {
        const plantType: 'existing' | 'planned' | null =
          filters.type === 'active'
            ? 'existing'
            : filters.type === 'planned'
              ? 'planned'
              : null
        
        console.log('📡 [usePlantBoxes] Loading boxes with filters:', { plantType, filters })
        
        const response = await getPlantBoxes({
          plantType: plantType as 'existing' | 'planned' | null,
          page: 1,
          limit: 100,
        })

        console.log('✅ [usePlantBoxes] Response:', response)

        if (response.success && response.data) {
          const mappedBoxes = response.data.plantBoxes.map(mapBackendToFrontend)
          setBoxes(mappedBoxes)
        } else {
          setError('Failed to load plant boxes')
          setBoxes([])
        }
      } catch (err: any) {
        console.error('❌ [usePlantBoxes] Failed to load boxes:', err)
        // Don't set error if it's a redirect (401 -> /auth)
        if (err?.response?.status !== 401 && !err.message?.includes('auth')) {
          setError(err.message || 'Failed to load plant boxes')
        }
        setBoxes([])
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    }

    loadBoxes()
  }, [filters.type, isAuthenticated])

  useEffect(() => {
    // Only filter if we have boxes loaded
    if (boxes.length === 0 && !loading) {
      setFilteredBoxes([])
      return
    }

    let result = [...boxes]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (box) =>
          box.name.toLowerCase().includes(searchLower) ||
          box.plantName.toLowerCase().includes(searchLower) ||
          box.location.name.toLowerCase().includes(searchLower),
      )
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((box) => box.type === filters.type)
    }

    switch (filters.sortBy) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        break
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        break
      case 'nameAsc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'nameDesc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
    }

    setFilteredBoxes(result)
  }, [boxes, filters.search, filters.type, filters.sortBy, loading])

  const updateFilters = useCallback((newFilters: Partial<PlantBoxFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const createBox = useCallback(
    async (data: CreatePlantBoxData): Promise<PlantBox> => {
      try {
        const backendData = mapFrontendToBackend(data)
        console.log('📤 [CreateBox] Frontend data:', JSON.stringify(data, null, 2))
        console.log('📤 [CreateBox] Backend data:', JSON.stringify(backendData, null, 2))
        console.log('📤 [CreateBox] soilType value:', backendData.location?.soilType)
        console.log('📤 [CreateBox] soilType type:', typeof backendData.location?.soilType, Array.isArray(backendData.location?.soilType))
        
        const response = await createPlantBoxAPI(backendData)

        if (response.success && response.data) {
          const newBox = mapBackendToFrontend(response.data)
          setBoxes((prev) => [newBox, ...prev])
          return newBox
        } else {
          throw new Error('Failed to create plant box')
        }
      } catch (err: any) {
        console.error('❌ [CreateBox] Error:', err)
        console.error('❌ [CreateBox] Error response:', err?.response?.data)
        if (err?.response?.data?.errors) {
          console.error('❌ [CreateBox] Validation errors:', JSON.stringify(err.response.data.errors, null, 2))
          err.response.data.errors.forEach((error: any) => {
            console.error(`  - ${error.field}: ${error.message}`)
          })
        }
        throw err
      }
    },
    []
  )

  const updateBox = useCallback(
    async (id: string, data: Partial<PlantBox>): Promise<PlantBox | null> => {
      try {
        const backendData = mapFrontendToBackend(data)
        const response = await updatePlantBoxAPI(id, backendData)

        if (response.success && response.data) {
          const updatedBox = mapBackendToFrontend(response.data)
          setBoxes((prev) =>
            prev.map((box) => (box._id === id ? updatedBox : box))
          )
          return updatedBox
        } else {
          throw new Error('Failed to update plant box')
        }
      } catch (err: any) {
        console.error('Failed to update box:', err)
        throw err
      }
    },
    []
  )

  const deleteBox = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await deletePlantBoxAPI(id)

      if (response.success) {
        setBoxes((prev) => prev.filter((box) => box._id !== id))
        return true
      } else {
        throw new Error('Failed to delete plant box')
      }
    } catch (err: any) {
      console.error('Failed to delete box:', err)
      throw err
    }
  }, [])

  // Calculate stats from all boxes (not filtered)
  const totalCount = boxes.length
  const activeCount = boxes.filter((b) => b.type === 'active').length
  const plannedCount = boxes.filter((b) => b.type === 'planned').length

  return {
    boxes: filteredBoxes,
    loading,
    error,
    filters,
    updateFilters,
    createBox,
    updateBox,
    deleteBox,
    totalCount,
    activeCount,
    plannedCount,
  }
}
