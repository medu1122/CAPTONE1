import { useState, useEffect } from 'react'
import type { CareStrategy, DailyStrategy, CareAction } from '../../MyPlantsPage/types/plantBox.types'
import { refreshCareStrategy } from '../../../services/plantBoxService'

// Helper to map backend care strategy to frontend format
const mapBackendStrategyToFrontend = (backendStrategy: any, plantBoxId: string): CareStrategy | null => {
  if (!backendStrategy || !backendStrategy.next7Days) {
    return null
  }

  const mappedDays: DailyStrategy[] = backendStrategy.next7Days.map((day: any, dayIdx: number) => {
    const mappedActions: CareAction[] = (day.actions || []).map((action: any, actionIdx: number) => {
      // Map backend action types to frontend types
      const typeMap: Record<string, CareAction['type']> = {
        water: 'watering',
        fertilize: 'fertilizing',
        prune: 'pruning',
        check: 'inspection',
        protect: 'protection',
      }

      return {
        _id: action._id || `action_${dayIdx}_${actionIdx}`,
        time: action.time || '08:00',
        description: action.description || '',
        reason: action.reason || '',
        completed: action.completed || false,
        type: typeMap[action.type] || 'other',
        products: action.products
          ? action.products.map((p: string | { name: string; link?: string }) =>
              typeof p === 'string' ? { name: p } : p
            )
          : undefined,
      }
    })

    return {
      date: day.date ? new Date(day.date).toISOString() : new Date().toISOString(),
      weather: {
        temp: day.weather?.temp || { min: 20, max: 30 },
        humidity: day.weather?.humidity || 60,
        rain: day.weather?.rain || 0,
        alerts: day.weather?.alerts || [],
      },
      actions: mappedActions,
    }
  })

  return {
    plantBoxId,
    lastUpdated: backendStrategy.lastUpdated
      ? new Date(backendStrategy.lastUpdated).toISOString()
      : new Date().toISOString(),
    next7Days: mappedDays,
  }
}

export const useCareStrategy = (plantBox: any & { careStrategy?: any }) => {
  const [strategy, setStrategy] = useState<CareStrategy | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (plantBox?.careStrategy) {
      const mappedStrategy = mapBackendStrategyToFrontend(plantBox.careStrategy, plantBox._id)
      setStrategy(mappedStrategy)
      setLoading(false)
    } else {
      setStrategy(null)
      setLoading(false)
    }
  }, [plantBox])

  const refreshStrategy = async () => {
    if (!plantBox?._id) return

    setRefreshing(true)
    try {
      const response = await refreshCareStrategy(plantBox._id)

      if (response.success && response.data) {
        const backendBox = response.data as any
        const mappedStrategy = mapBackendStrategyToFrontend(
          backendBox.careStrategy,
          plantBox._id
        )
        setStrategy(mappedStrategy)
      } else {
        throw new Error('Failed to refresh strategy')
      }
    } catch (err: any) {
      console.error('Error refreshing strategy:', err)
      throw err
    } finally {
      setRefreshing(false)
    }
  }

  const toggleActionComplete = (dayIndex: number, actionId: string) => {
    if (!strategy) return

    const updatedDays = [...strategy.next7Days]
    const action = updatedDays[dayIndex]?.actions.find((a) => a._id === actionId)
    if (action) {
      action.completed = !action.completed
      setStrategy({ ...strategy, next7Days: updatedDays })
    }
  }

  return {
    strategy,
    loading,
    refreshing,
    refreshStrategy,
    toggleActionComplete,
  }
}
