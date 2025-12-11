export interface PlantInfo {
  commonName: string
  scientificName: string
  confidence: number
  reliable: boolean
}

export interface Disease {
  name: string
  originalName: string
  confidence: number
  description?: string
}

export interface Treatment {
  type: 'chemical' | 'biological' | 'cultural'
  title: string
  items: TreatmentItem[]
}

export interface TreatmentItem {
  name: string
  description?: string
  dosage?: string
  usage?: string
  // For chemical products
  activeIngredient?: string
  manufacturer?: string
  targetDiseases?: string[]
  targetCrops?: string[]
  imageUrl?: string
  frequency?: string
  isolationPeriod?: string
  precautions?: string[]
  price?: string
  source?: string
  // For biological methods
  materials?: string
  timeframe?: string
  effectiveness?: string
  steps?: string
}

export interface AnalysisResult {
  plant: PlantInfo
  isHealthy: boolean
  diseases: Disease[]
  treatments: Record<string, Treatment[]>  // Array of Treatment objects by disease name
  additionalInfo: Record<string, any>
  aiAdvice?: Record<string, string>  // Optional: AI-generated advice by disease name
  care: any
  analyzedAt: string
  imageUrl: string
  analysisId?: string
}

export interface ValidationState {
  isValid: boolean
  isPlant: boolean | null
  confidence: number
  plantName?: string
  message: string
  warning?: boolean
  validating?: boolean
}

export interface UploadedImage {
  id: string
  file: File
  previewUrl: string
  analyzing: boolean
  result: AnalysisResult | null
  error?: string
  validation?: ValidationState
}

