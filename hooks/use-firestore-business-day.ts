import { useState, useEffect, useCallback } from "react"
import type { FirestoreService } from "@/lib/firestore-service"
import type { UserSettings } from "@/lib/types"
import { getBusinessDay, getClosureDateSuggestions, isExtendedHours } from "@/lib/utils/business-day"

export function useFirestoreBusinessDay(firestoreService: FirestoreService | null) {
  const [activeWorkingDay, setActiveWorkingDay] = useState<string>('')
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [businessDayCutoff, setBusinessDayCutoff] = useState(4)
  const [error, setError] = useState<string | null>(null)

  // Load user settings
  useEffect(() => {
    if (!firestoreService) return

    const unsubscribe = firestoreService.subscribeToUserSettings((settings) => {
      setUserSettings(settings)
      if (settings?.businessDayCutoffHour !== undefined) {
        setBusinessDayCutoff(settings.businessDayCutoffHour)
      }
    })

    return unsubscribe
  }, [firestoreService])

  // Calculate active day based on configuration
  useEffect(() => {
    const day = getBusinessDay(businessDayCutoff)
    setActiveWorkingDay(day)
  }, [businessDayCutoff])

  // Day change detector (checks every minute)
  useEffect(() => {
    const checkDayChange = () => {
      const currentBusinessDay = getBusinessDay(businessDayCutoff)
      if (currentBusinessDay !== activeWorkingDay && activeWorkingDay !== '') {
        console.log('📅 Cambio de día comercial detectado:', activeWorkingDay, '→', currentBusinessDay)
        setActiveWorkingDay(currentBusinessDay)
      }
    }

    checkDayChange()
    const interval = setInterval(checkDayChange, 60000)
    return () => clearInterval(interval)
  }, [activeWorkingDay, businessDayCutoff])

  // Update business day cutoff
  const updateBusinessDayCutoff = useCallback(async (hour: number) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.saveUserSettings({
        businessDayCutoffHour: hour,
        createdAt: userSettings?.createdAt || Date.now()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración')
      throw err
    }
  }, [firestoreService, userSettings])

  // Update closure preferences
  const updateClosurePreferences = useCallback(async (behavior: string, threshold: number) => {
    if (!firestoreService || !userSettings) return
    
    try {
      setError(null)
      await firestoreService.saveUserSettings({
        ...userSettings,
        closureConflictBehavior: behavior as any,
        unifiedClosureThreshold: threshold * 60 * 1000,
        updatedAt: Date.now()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar preferencias de cierre')
      throw err
    }
  }, [firestoreService, userSettings])

  // Get closure suggestions
  const getClosureSuggestions = useCallback(() => {
    return getClosureDateSuggestions(businessDayCutoff)
  }, [businessDayCutoff])

  // Force update active working day
  const forceUpdateActiveWorkingDay = useCallback(() => {
    const newDay = getBusinessDay(businessDayCutoff)
    setActiveWorkingDay(newDay)
  }, [businessDayCutoff])

  // Force start new day
  const forceStartNewDay = useCallback(async () => {
    try {
      setError(null)
      const newDay = getBusinessDay(businessDayCutoff)
      setActiveWorkingDay(newDay)
      console.log('✅ Nuevo día iniciado:', newDay)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar nuevo día')
      throw err
    }
  }, [businessDayCutoff])

  return {
    activeWorkingDay,
    businessDayCutoff,
    userSettings,
    isExtendedHours: isExtendedHours(businessDayCutoff),
    error,
    updateBusinessDayCutoff,
    updateClosurePreferences,
    getClosureSuggestions,
    forceUpdateActiveWorkingDay,
    forceStartNewDay
  }
}

