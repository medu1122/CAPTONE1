import type { Conversation } from '../types/analyze.types'
export const STORAGE_KEYS = {
  CONVERSATIONS: 'gg_chat_conversations_v1',
  HISTORY_COLLAPSED: 'gg_history_collapsed',
  HISTORY_OPEN: 'gg_history_open',
}
export const storage = {
  getConversations: (): Conversation[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to parse conversations from localStorage', error)
      return []
    }
  },
  setConversations: (conversations: Conversation[]): void => {
    localStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS,
      JSON.stringify(conversations),
    )
  },
}
