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
  export interface AnalysisResult {
    plant: Plant
    disease: Disease | null
    confidence: number
    care: string[]
    products: Product[]
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
  