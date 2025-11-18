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
      soilType?: string
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
    images?: PlantImage[]
    notes?: PlantNote[]
    specialRequirements?: string
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
      soilType?: string
      sunlight?: 'full' | 'partial' | 'shade'
    }
    quantity?: number
    growthStage?: PlantBox['growthStage']
    specialRequirements?: string
  }
  