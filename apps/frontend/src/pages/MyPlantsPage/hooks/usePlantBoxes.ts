import { useState, useEffect, useCallback } from 'react'
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
      soilType: backendBox.location?.soilType,
      sunlight: backendBox.location?.sunlight,
    },
    quantity: backendBox.quantity,
    growthStage: backendBox.growthStage,
    currentHealth: backendBox.currentHealth,
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
const mapFrontendToBackend = (data: CreatePlantBoxData | Partial<PlantBox>): any => {
  const mapped: any = {
    name: data.name?.trim(),
    plantType: data.type === 'active' ? 'existing' : 'planned',
    plantName: data.plantName?.trim(),
    scientificName: data.scientificName?.trim() || undefined,
    location: {
      name: data.location?.name?.trim() || '',
      coordinates: data.location?.coordinates
        ? {
            lat: data.location.coordinates.lat,
            lon: data.location.coordinates.lng,
          }
        : undefined,
      area: data.location?.area || undefined,
      soilType: data.location?.soilType?.trim() || undefined,
      sunlight: data.location?.sunlight || 'full',
    },
    quantity: data.quantity || 1,
    growthStage: data.growthStage || undefined,
    specialRequirements: data.specialRequirements?.trim() || undefined,
  }

  // Remove undefined values from location
  if (!mapped.location.coordinates) {
    delete mapped.location.coordinates
  }
  if (!mapped.location.area) {
    delete mapped.location.area
  }
  if (!mapped.location.soilType) {
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
  const [boxes, setBoxes] = useState<PlantBox[]>([])
  const [filteredBoxes, setFilteredBoxes] = useState<PlantBox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PlantBoxFilters>({
    search: '',
    type: 'all',
    sortBy: 'newest',
  })

  useEffect(() => {
    const loadBoxes = async () => {
      setLoading(true)
      setError(null)
      try {
        const plantType: 'existing' | 'planned' | null =
          filters.type === 'active'
            ? 'existing'
            : filters.type === 'planned'
              ? 'planned'
              : null
        const response = await getPlantBoxes({
          plantType: plantType as 'existing' | 'planned' | null,
          page: 1,
          limit: 100,
        })

        if (response.success && response.data) {
          const mappedBoxes = response.data.plantBoxes.map(mapBackendToFrontend)
          setBoxes(mappedBoxes)
        } else {
          setError('Failed to load plant boxes')
          setBoxes([])
        }
      } catch (err: any) {
        console.error('Failed to load boxes:', err)
        setError(err.message || 'Failed to load plant boxes')
        setBoxes([])
      } finally {
        setLoading(false)
      }
    }

    loadBoxes()
  }, [filters.type])

  useEffect(() => {
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
  }, [boxes, filters])

  const updateFilters = useCallback((newFilters: Partial<PlantBoxFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const createBox = useCallback(
    async (data: CreatePlantBoxData): Promise<PlantBox> => {
      try {
        const backendData = mapFrontendToBackend(data)
        console.log('📤 [CreateBox] Frontend data:', data)
        console.log('📤 [CreateBox] Backend data:', backendData)
        
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

  return {
    boxes: filteredBoxes,
    loading,
    error,
    filters,
    updateFilters,
    createBox,
    updateBox,
    deleteBox,
    totalCount: boxes.length,
    activeCount: boxes.filter((b) => b.type === 'active').length,
    plannedCount: boxes.filter((b) => b.type === 'planned').length,
  }
}
