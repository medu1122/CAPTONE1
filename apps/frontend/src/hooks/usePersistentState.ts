import { useState, useEffect, useCallback } from 'react'

export type StorageType = 'localStorage' | 'sessionStorage'

export interface PersistentStateOptions {
  storage?: StorageType
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  validate?: (value: any) => boolean
  onError?: (error: Error) => void
}

// Default serialization functions
const defaultSerialize = (value: any): string => {
  try {
    return JSON.stringify(value)
  } catch (error) {
    console.error('Serialization error:', error)
    return 'null'
  }
}

const defaultDeserialize = (value: string): any => {
  try {
    return JSON.parse(value)
  } catch (error) {
    console.error('Deserialization error:', error)
    return null
  }
}

// Get storage instance
const getStorage = (type: StorageType): Storage => {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    } as Storage
  }
  
  return type === 'localStorage' ? localStorage : sessionStorage
}

// Check if storage is available
const isStorageAvailable = (type: StorageType): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    const storage = getStorage(type)
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

// Main hook
export const usePersistentState = <T>(
  key: string,
  defaultValue: T,
  options: PersistentStateOptions = {}
): [T, (value: T) => void, () => void] => {
  const {
    storage: storageType = 'localStorage',
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    validate,
    onError
  } = options

  const [value, setValue] = useState<T>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Get value from storage on mount
  useEffect(() => {
    if (!isStorageAvailable(storageType)) {
      console.warn(`Storage ${storageType} is not available`)
      setIsInitialized(true)
      return
    }

    try {
      const storage = getStorage(storageType)
      const storedValue = storage.getItem(key)
      
      if (storedValue !== null) {
        const parsedValue = deserialize(storedValue)
        
        // Validate if validator is provided
        if (validate && !validate(parsedValue)) {
          console.warn(`Stored value for key "${key}" failed validation`)
          setValue(defaultValue)
        } else {
          setValue(parsedValue)
        }
      }
    } catch (error) {
      console.error(`Error reading from ${storageType}:`, error)
      onError?.(error as Error)
    } finally {
      setIsInitialized(true)
    }
  }, [key, storageType, deserialize, validate, defaultValue, onError])

  // Save value to storage
  const setPersistentValue = useCallback((newValue: T) => {
    setValue(newValue)
    
    if (!isStorageAvailable(storageType)) {
      console.warn(`Storage ${storageType} is not available`)
      return
    }

    try {
      const storage = getStorage(storageType)
      const serializedValue = serialize(newValue)
      storage.setItem(key, serializedValue)
    } catch (error) {
      console.error(`Error saving to ${storageType}:`, error)
      onError?.(error as Error)
    }
  }, [key, storageType, serialize, onError])

  // Remove value from storage
  const removeValue = useCallback(() => {
    if (!isStorageAvailable(storageType)) {
      console.warn(`Storage ${storageType} is not available`)
      return
    }

    try {
      const storage = getStorage(storageType)
      storage.removeItem(key)
      setValue(defaultValue)
    } catch (error) {
      console.error(`Error removing from ${storageType}:`, error)
      onError?.(error as Error)
    }
  }, [key, storageType, defaultValue, onError])

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return [defaultValue, setPersistentValue, removeValue]
  }

  return [value, setPersistentValue, removeValue]
}

// Specialized hooks for common use cases
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  return usePersistentState(key, defaultValue, { storage: 'localStorage' })
}

export const useSessionStorage = <T>(key: string, defaultValue: T) => {
  return usePersistentState(key, defaultValue, { storage: 'sessionStorage' })
}

// Hook for storing objects with validation
export const usePersistentObject = <T extends Record<string, any>>(
  key: string,
  defaultValue: T,
  schema?: Partial<T>
) => {
  const validate = (value: any): value is T => {
    if (!value || typeof value !== 'object') return false
    
    if (schema) {
      return Object.keys(schema).every(schemaKey => 
        schemaKey in value
      )
    }
    
    return true
  }

  return usePersistentState(key, defaultValue, {
    storage: 'localStorage',
    validate
  })
}

// Hook for storing arrays
export const usePersistentArray = <T>(
  key: string,
  defaultValue: T[],
  maxLength?: number
) => {
  const validate = (value: any): value is T[] => {
    if (!Array.isArray(value)) return false
    
    if (maxLength && value.length > maxLength) {
      console.warn(`Array length exceeds maxLength (${maxLength})`)
      return false
    }
    
    return true
  }

  const [array, setArray, removeArray] = usePersistentState(key, defaultValue, {
    storage: 'localStorage',
    validate
  })

  const addItem = useCallback((item: T) => {
    setArray(prev => [...prev, item])
  }, [setArray])

  const removeItem = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index))
  }, [setArray])

  const updateItem = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((existingItem, i) => i === index ? item : existingItem))
  }, [setArray])

  const clearArray = useCallback(() => {
    setArray([])
  }, [setArray])

  return {
    array,
    setArray,
    removeArray,
    addItem,
    removeItem,
    updateItem,
    clearArray
  }
}

// Hook for storing user preferences
export const useUserPreferences = () => {
  const [preferences, setPreferences] = usePersistentObject('user_preferences', {
    theme: 'light' as 'light' | 'dark',
    language: 'vi',
    notifications: true,
    sidebarCollapsed: false,
    autoSave: true
  })

  const updatePreference = useCallback(<K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }, [setPreferences])

  const resetPreferences = useCallback(() => {
    setPreferences({
      theme: 'light',
      language: 'vi',
      notifications: true,
      sidebarCollapsed: false,
      autoSave: true
    })
  }, [setPreferences])

  return {
    preferences,
    setPreferences,
    updatePreference,
    resetPreferences
  }
}

// Hook for storing draft messages
export const useDraftMessage = (conversationId?: string) => {
  const key = conversationId ? `draft_${conversationId}` : 'draft_current'
  
  const [draft, setDraft, clearDraft] = useLocalStorage(key, {
    text: '',
    image: null as File | null,
    timestamp: Date.now()
  })

  const updateDraft = useCallback((updates: Partial<typeof draft>) => {
    setDraft(prev => ({ ...prev, ...updates, timestamp: Date.now() }))
  }, [setDraft])

  const saveDraft = useCallback((text: string, image?: File | null) => {
    updateDraft({ text, image: image || null })
  }, [updateDraft])

  const loadDraft = useCallback(() => {
    return draft
  }, [draft])

  return {
    draft,
    updateDraft,
    saveDraft,
    loadDraft,
    clearDraft
  }
}
