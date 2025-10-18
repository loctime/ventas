import { useState, useEffect, useCallback } from "react"
import type { FirestoreService, Transaction } from "@/lib/firestore-service"
import type { DailyClosure, DailyExpense, UserSettings } from "@/lib/types"

interface UseFirestoreDailyClosuresProps {
  firestoreService: FirestoreService | null
  userId: string | undefined
  activeWorkingDay: string
  userSettings: UserSettings | null
}

export function useFirestoreDailyClosures({
  firestoreService,
  userId,
  activeWorkingDay,
  userSettings
}: UseFirestoreDailyClosuresProps) {
  const [todayClosure, setTodayClosure] = useState<DailyClosure | null>(null)
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([])
  const [dailyClosures, setDailyClosures] = useState<DailyClosure[]>([])
  const [error, setError] = useState<string | null>(null)

  // Subscribe to all daily closures
  useEffect(() => {
    if (!firestoreService) return

    const unsubscribeDailyClosures = firestoreService.subscribeToDailyClosures((data) => {
      setDailyClosures(data)
    })

    return () => {
      unsubscribeDailyClosures()
    }
  }, [firestoreService])

  // Subscribe to active working day closure
  useEffect(() => {
    if (!firestoreService || !activeWorkingDay) return

    const unsubscribeTodayClosure = firestoreService.subscribeToDailyClosure(activeWorkingDay, (data) => {
      setTodayClosure(data)
    })

    // Get active day's transactions
    firestoreService.getTransactionsForDate(activeWorkingDay).then((data) => {
      setTodayTransactions(data)
    })

    return () => {
      unsubscribeTodayClosure()
    }
  }, [firestoreService, activeWorkingDay])

  // Save daily closure
  const saveTodayClosure = useCallback(async (data: {
    cashCounted: number
    cardCounted: number
    transferCounted: number
    expenses: DailyExpense[]
    note?: string
    closureDate?: string
    closureNumber?: number
  }) => {
    if (!firestoreService || !userId) return
    
    try {
      setError(null)
      const workingDay = data.closureDate || activeWorkingDay
      
      const dayTransactions = await firestoreService.getTransactionsForDate(workingDay)
      
      const totalCounted = data.cashCounted + data.cardCounted + data.transferCounted
      const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0)
      
      const workModeTotal = dayTransactions
        .filter(t => t.type === 'collection')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const difference = totalCounted - workModeTotal
      const finalBalance = totalCounted - totalExpenses

      const closure: Omit<DailyClosure, 'userId'> = {
        id: `${userId}_${workingDay}`,
        date: workingDay,
        cashCounted: data.cashCounted,
        cardCounted: data.cardCounted,
        transferCounted: data.transferCounted,
        totalCounted,
        expenses: data.expenses,
        totalExpenses,
        workModeTransactionIds: dayTransactions.map(t => t.id || ''),
        workModeTotal,
        difference,
        note: data.note,
        finalBalance,
        status: 'open',
        createdAt: Date.now(),
        closureNumber: data.closureNumber
      }

      await firestoreService.saveDailyClosure(closure)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cierre')
      throw err
    }
  }, [firestoreService, userId, activeWorkingDay])

  // Close daily balance
  const closeDailyBalance = useCallback(async (closureDate?: string) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      const dateToClose = closureDate || activeWorkingDay
      await firestoreService.closeDailyBalance(dateToClose)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar el día')
      throw err
    }
  }, [firestoreService, activeWorkingDay])

  // Handle closure conflicts
  const handleClosureConflict = useCallback(async (
    action: string,
    closureData: any,
    existingClosure: DailyClosure,
    rememberChoice: boolean = false
  ) => {
    if (!firestoreService || !userId) return
    
    try {
      setError(null)
      
      if (rememberChoice && userSettings) {
        await firestoreService.saveUserSettings({
          ...userSettings,
          closureConflictBehavior: action as any,
          updatedAt: Date.now()
        })
      }

      const workingDay = closureData.closureDate || activeWorkingDay

      switch (action) {
        case 'replace':
          await firestoreService.deleteDailyClosure(workingDay)
          await saveTodayClosure(closureData)
          await closeDailyBalance(workingDay)
          break
          
        case 'multiple':
          const closureNumber = await firestoreService.getNextClosureNumber(workingDay)
          
          await saveTodayClosure({
            ...closureData,
            closureNumber,
            closureDate: workingDay
          })
          const newClosureId = `${userId}_${workingDay}_${closureNumber}`
          await firestoreService.closeDailyBalance(workingDay, newClosureId)
          break
          
        case 'unify':
          const unifiedData = {
            cashCounted: existingClosure.cashCounted + closureData.cashCounted,
            cardCounted: existingClosure.cardCounted + closureData.cardCounted,
            transferCounted: existingClosure.transferCounted + closureData.transferCounted,
            expenses: [...existingClosure.expenses, ...closureData.expenses],
            note: [existingClosure.note, closureData.note].filter(Boolean).join(' | '),
            closureDate: workingDay
          }
          
          await firestoreService.deleteDailyClosure(workingDay)
          await saveTodayClosure(unifiedData)
          await closeDailyBalance(workingDay)
          break
          
        case 'edit':
          await firestoreService.cancelDailyClosure(workingDay, existingClosure.id)
          break
          
        default:
          throw new Error(`Acción no reconocida: ${action}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al manejar conflicto de cierre')
      throw err
    }
  }, [firestoreService, userId, activeWorkingDay, saveTodayClosure, closeDailyBalance, userSettings])

  // Get conflict recommendation
  const getConflictRecommendation = useCallback((existingClosure: DailyClosure): 'unify' | 'multiple' | 'replace' => {
    if (!existingClosure.closedAt) return 'replace'
    
    const timeDiff = Date.now() - existingClosure.closedAt
    const threshold = userSettings?.unifiedClosureThreshold || 120 * 60 * 1000
    
    if (timeDiff < threshold) {
      return 'unify'
    }
    
    return 'multiple'
  }, [userSettings])

  // Get closure by date
  const getClosureByDate = useCallback(async (dateStr: string): Promise<DailyClosure | null> => {
    if (!firestoreService) return null
    
    try {
      const localClosure = dailyClosures.find(c => c.date === dateStr)
      if (localClosure) {
        return localClosure
      }
      
      const firestoreClosure = await firestoreService.getDailyClosure(dateStr)
      return firestoreClosure
    } catch (error) {
      console.error('Error al obtener cierre por fecha:', error)
      return null
    }
  }, [firestoreService, dailyClosures])

  // Cancel day closure
  const cancelDayClosure = useCallback(async (closureDate: string) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      
      if (typeof firestoreService.deleteDailyClosure !== 'function') {
        throw new Error('Función deleteDailyClosure no disponible. Por favor, recarga la página.')
      }
      
      await firestoreService.deleteDailyClosure(closureDate)
      setTodayClosure(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar cierre'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [firestoreService])

  return {
    todayClosure,
    todayTransactions,
    dailyClosures,
    error,
    saveTodayClosure,
    closeDailyBalance,
    handleClosureConflict,
    getConflictRecommendation,
    getClosureByDate,
    cancelDayClosure
  }
}

