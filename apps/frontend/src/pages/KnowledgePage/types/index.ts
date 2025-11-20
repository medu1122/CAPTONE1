export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  snippet: string
}

export interface LastAnalysis {
  plant: {
    commonName: string
  } | null
  disease: {
    name: string
  } | null
  confidence: number
  isHealthy: boolean
  analyzedAt: string
}

