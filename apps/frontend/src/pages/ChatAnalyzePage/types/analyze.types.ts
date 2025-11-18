export interface Message {
  role: 'user' | 'assistant'
  type: 'text' | 'image'
  content: string
}

export interface Plant {
  commonName: string
  scientificName: string
}

export interface Disease {
  name: string
  description: string
}

export interface Product {
  name: string
  imageUrl: string
  price: string
  note: string
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
  label: string
}

export interface ImageInsights {
  previewUrl: string
  boxes: Box[]
}

// ============================================
// NEW TYPES FOR TREATMENT RECOMMENDATIONS
// ============================================

export interface TreatmentItem {
  name: string
  description: string
  dosage?: string
  materials?: string
  priority?: 'High' | 'Medium' | 'Low'
  effectiveness?: string
  timeframe?: string
  source?: string
}

export interface TreatmentRecommendation {
  type: 'chemical' | 'biological' | 'cultural'
  title: string
  items: TreatmentItem[]
}

// ============================================
// NEW TYPES FOR ADDITIONAL INFO
// ============================================

export interface AdditionalInfoDetails {
  usage?: string
  dosage?: string
  frequency?: string
  precautions?: string[]
  isolation?: string
  source?: string
}

export interface AdditionalInfo {
  type: 'product' | 'guide' | 'faq'
  title: string
  summary: string
  imageUrl?: string
  details?: AdditionalInfoDetails
}

// ============================================
// UPDATED ANALYSIS RESULT
// ============================================

export interface AnalysisResult {
  plant: Plant
  disease: Disease | null
  confidence: number
  care: string[]
  products: Product[]  // Keep for backward compatibility
  treatments?: TreatmentRecommendation[]  // NEW
  additionalInfo?: AdditionalInfo[]  // NEW
  imageInsights?: ImageInsights
}

export interface Conversation {
  id: string
  sessionId?: string | null
  title: string
  messages: Message[]
  result: AnalysisResult | null
  createdAt: string
  updatedAt: string
  snippet: string
}
  