export interface PlantBox {
    _id: string
    userId: string
    name: string
    type: 'active' | 'planned'
    plantName: string
    scientificName?: string
    plantedDate?: string
    plannedDate?: string
    location: {
      name: string
      coordinates?: {
        lat: number
        lng: number
      }
      area?: number // m²
      soilType?: string[] // Array of soil types (multiple)
      sunlight?: 'full' | 'partial' | 'shade'
    }
    quantity?: number
    growthStage?:
      | 'seed'
      | 'seedling'
      | 'vegetative'
      | 'flowering'
      | 'fruiting'
      | 'harvest'
    currentHealth?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    currentDiseases?: PlantDisease[]
    healthNotes?: string
    images?: PlantImage[]
    notes?: PlantNote[]
    specialRequirements?: string
    careStrategy?: CareStrategy | null // AI-generated care strategy
    notifications?: {
      enabled: boolean
      email: boolean
      sms: boolean
      frequency?: 'daily' | 'weekly' | 'custom'
      customSchedule?: string[]
    }
    createdAt: string
    updatedAt: string
  }
  
  export interface PlantImage {
    _id: string
    url: string
    description?: string
    date: string
  }
  
  export interface PlantNote {
    _id: string
    type: 'care' | 'observation' | 'issue' | 'milestone'
    content: string
    date: string
    imageUrl?: string
  }
  
  export interface DiseaseFeedback {
    date: string
    status: 'worse' | 'same' | 'better' | 'resolved'
    notes?: string
  }

  export interface SelectedTreatment {
    chemical?: ChemicalTreatment[]
    biological?: BiologicalTreatment[]
    cultural?: CulturalTreatment[]
  }

  export interface ChemicalTreatment {
    name: string
    activeIngredient: string
    manufacturer?: string
    targetDiseases?: string[]
    targetCrops?: string[]
    dosage: string
    usage: string
    frequency?: string
    isolationPeriod?: string
    precautions?: string[]
    imageUrl?: string
    price?: string
  }

  export interface BiologicalTreatment {
    name: string
    materials: string
    steps: string
    timeframe?: string
    effectiveness?: string
  }

  export interface CulturalTreatment {
    name: string
    action: string
    description: string
    priority?: string
  }

  export interface PlantDisease {
    _id?: string
    name: string
    symptoms?: string
    severity?: 'mild' | 'moderate' | 'severe'
    detectedDate?: string
    treatmentPlan?: string
    status?: 'active' | 'treating' | 'resolved'
    feedback?: DiseaseFeedback[]
    selectedTreatments?: SelectedTreatment
  }
  
  export interface CareAction {
    _id: string
    time: string
    description: string
    reason: string
    completed: boolean
    type:
      | 'watering'
      | 'fertilizing'
      | 'pruning'
      | 'inspection'
      | 'protection'
      | 'other'
    products?: {
      name: string
      link?: string
    }[]
  }
  
  export interface DailyStrategy {
    date: string
    weather: {
      temp: { min: number; max: number }
      humidity: number
      rain: number
      alerts?: string[]
    }
    actions: CareAction[]
  }
  
  export interface CareStrategy {
    plantBoxId: string
    lastUpdated: string
    next7Days: DailyStrategy[]
    summary?: string
  }
  
  export interface PlantBoxFilters {
    search?: string
    type?: 'all' | 'active' | 'planned'
    sortBy?: 'newest' | 'oldest' | 'nameAsc' | 'nameDesc'
  }
  
  export interface CreatePlantBoxData {
    name: string
    type: 'active' | 'planned'
    plantName: string
    scientificName?: string
    plantedDate?: string
    plannedDate?: string
    location: {
      name: string
      coordinates?: {
        lat: number
        lng: number
      }
      area?: number
      soilType?: string[] // Array of soil types
      sunlight?: 'full' | 'partial' | 'shade'
    }
    quantity?: number
    growthStage?: PlantBox['growthStage']
    specialRequirements?: string
    currentDiseases?: PlantDisease[]
    healthNotes?: string
  }
  