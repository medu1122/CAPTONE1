import { useState, useEffect, useCallback } from 'react'
import type { PlantBox } from '../../MyPlantsPage/types/plantBox.types'
import { getPlantBox, updatePlantBox as updatePlantBoxAPI, addNoteToPlantBox } from '../../../services/plantBoxService'

// Helper to map backend data to frontend format (same as in usePlantBoxes)
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
      imageUrl: note.imageUrl,
    })),
    specialRequirements: backendBox.specialRequirements,
    careStrategy: backendBox.careStrategy || undefined, // Include careStrategy from backend
    createdAt: backendBox.createdAt
      ? new Date(backendBox.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: backendBox.updatedAt
      ? new Date(backendBox.updatedAt).toISOString()
      : new Date().toISOString(),
  }
}

export const usePlantDetail = (plantBoxId: string) => {
  const [plantBox, setPlantBox] = useState<PlantBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlantBox = async () => {
      if (!plantBoxId) {
        setError('Plant box ID is required')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await getPlantBox(plantBoxId)

        if (response.success && response.data) {
          const mappedBox = mapBackendToFrontend(response.data)
          setPlantBox(mappedBox)
        } else {
          setError('Không tìm thấy cây trồng')
        }
      } catch (err: any) {
        console.error('Error loading plant box:', err)
        setError(err.message || 'Không thể tải thông tin')
      } finally {
        setLoading(false)
      }
    }

    loadPlantBox()
  }, [plantBoxId])

  const updatePlantBox = useCallback(async (data: Partial<PlantBox>) => {
    if (!plantBoxId) return

    try {
      // Map frontend to backend format
      const backendData: any = {}
      if (data.name) backendData.name = data.name
      if (data.plantName) backendData.plantName = data.plantName
      if (data.scientificName !== undefined) backendData.scientificName = data.scientificName
      if (data.location) {
        backendData.location = {
          name: data.location.name,
          coordinates: data.location.coordinates
            ? {
                lat: data.location.coordinates.lat,
                lon: data.location.coordinates.lng,
              }
            : undefined,
          area: data.location.area,
          soilType: data.location.soilType,
          sunlight: data.location.sunlight,
        }
      }
      if (data.quantity !== undefined) backendData.quantity = data.quantity
      if (data.growthStage) backendData.growthStage = data.growthStage
      if (data.currentHealth) backendData.currentHealth = data.currentHealth
      if (data.specialRequirements !== undefined) backendData.specialRequirements = data.specialRequirements
      if (data.plantedDate) backendData.plantedDate = new Date(data.plantedDate)
      if (data.plannedDate) backendData.plannedDate = new Date(data.plannedDate)

      const response = await updatePlantBoxAPI(plantBoxId, backendData)

      if (response.success && response.data) {
        const updatedBox = mapBackendToFrontend(response.data)
        setPlantBox(updatedBox)
        return updatedBox
      } else {
        throw new Error('Failed to update plant box')
      }
    } catch (err: any) {
      console.error('Error updating plant box:', err)
      throw err
    }
  }, [plantBoxId])

  const addNote = useCallback(async (
    content: string,
    type: 'care' | 'observation' | 'issue' | 'milestone' = 'observation',
    imageUrl?: string
  ) => {
    if (!plantBoxId) return

    try {
      const response = await addNoteToPlantBox(plantBoxId, content, type, imageUrl)

      if (response.success && response.data) {
        const updatedBox = mapBackendToFrontend(response.data)
        setPlantBox(updatedBox)
        return updatedBox
      } else {
        throw new Error('Failed to add note')
      }
    } catch (err: any) {
      console.error('Error adding note:', err)
      throw err
    }
  }, [plantBoxId])

  const refreshPlantBox = useCallback(async () => {
    if (!plantBoxId) return

    try {
      const response = await getPlantBox(plantBoxId)
      if (response.success && response.data) {
        const mappedBox = mapBackendToFrontend(response.data)
        setPlantBox(mappedBox)
      }
    } catch (err: any) {
      console.error('Error refreshing plant box:', err)
    }
  }, [plantBoxId])

  return {
    plantBox,
    loading,
    error,
    updatePlantBox,
    addNote,
    refreshPlantBox,
  }
}
