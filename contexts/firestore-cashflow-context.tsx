"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./auth-context"
import { FirestoreService, Transaction, PaymentMethod } from "@/lib/firestore-service"
import type { DailyClosure, DailyExpense, UserSettings } from "@/lib/types"
import { getBusinessDay, getClosureDateSuggestions, isExtendedHours } from "@/lib/utils/business-day"

interface CashflowContextType {
  collections: Transaction[]
  payments: Transaction[]
  paymentMethods: PaymentMethod[]
  loading: boolean
  error: string | null
  addCollection: (transaction: Omit<Transaction, 'id' | 'type'>) => Promise<void>
  addPayment: (transaction: Omit<Transaction, 'id' | 'type'>) => Promise<void>
  updateCollection: (id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) => Promise<void>
  updatePayment: (id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  deletePayment: (id: string) => Promise<void>
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id'>) => Promise<void>
  updatePaymentMethod: (id: string, paymentMethod: Partial<Omit<PaymentMethod, 'id'>>) => Promise<void>
  deletePaymentMethod: (id: string) => Promise<void>
  // Daily Closure
  todayClosure: DailyClosure | null
  todayTransactions: Transaction[]
  dailyClosures: DailyClosure[]
  saveTodayClosure: (data: {
    cashCounted: number
    cardCounted: number
    transferCounted: number
    expenses: DailyExpense[]
    note?: string
    closureDate?: string
    closureNumber?: number
  }) => Promise<void>
  closeDailyBalance: (closureDate?: string) => Promise<void>
  handleClosureConflict: (action: string, closureData: any, existingClosure: DailyClosure, rememberChoice?: boolean) => Promise<void>
  getConflictRecommendation: (existingClosure: DailyClosure) => 'unify' | 'multiple' | 'replace'
  // Business Day
  activeWorkingDay: string
  businessDayCutoff: number
  userSettings: UserSettings | null
  isExtendedHours: boolean
  updateBusinessDayCutoff: (hour: number) => Promise<void>
  getClosureSuggestions: () => {
    suggestedDate: string
    alternateDate: string | null
    isAfterMidnight: boolean
    businessDay: string
    calendarDay: string
    message: string
  }
  forceUpdateActiveWorkingDay: () => void
  forceStartNewDay: () => Promise<void>
  cancelDayClosure: (closureDate: string) => Promise<void>
}

const CashflowContext = createContext<CashflowContextType | undefined>(undefined)

export function FirestoreCashflowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Transaction[]>([])
  const [payments, setPayments] = useState<Transaction[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firestoreService, setFirestoreService] = useState<FirestoreService | null>(null)
  
  // Daily closure states
  const [todayClosure, setTodayClosure] = useState<DailyClosure | null>(null)
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([])
  const [dailyClosures, setDailyClosures] = useState<DailyClosure[]>([])
  
  // Business day states
  const [activeWorkingDay, setActiveWorkingDay] = useState<string>('')
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [businessDayCutoff, setBusinessDayCutoff] = useState(4) // Default 4 AM

  // Initialize Firestore service when user is available
  useEffect(() => {
    if (user?.uid) {
      const service = new FirestoreService(user.uid)
      setFirestoreService(service)
    } else {
      setFirestoreService(null)
      setCollections([])
      setPayments([])
      setPaymentMethods([])
    }
  }, [user])

  // Cargar configuración del usuario
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

  // Calcular día activo basado en configuración
  useEffect(() => {
    const day = getBusinessDay(businessDayCutoff)
    setActiveWorkingDay(day)
  }, [businessDayCutoff])

  // Detector de cambio de día (verifica cada minuto)
  useEffect(() => {
    const checkDayChange = () => {
      const currentBusinessDay = getBusinessDay(businessDayCutoff)
      if (currentBusinessDay !== activeWorkingDay && activeWorkingDay !== '') {
        console.log('📅 Cambio de día comercial detectado:', activeWorkingDay, '→', currentBusinessDay)
        setActiveWorkingDay(currentBusinessDay)
      }
    }

    // Verificar inmediatamente al montar el componente
    checkDayChange()
    
    const interval = setInterval(checkDayChange, 60000) // Cada minuto
    return () => clearInterval(interval)
  }, [activeWorkingDay, businessDayCutoff])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!firestoreService) return

    setLoading(true)
    setError(null)

    const unsubscribeCollections = firestoreService.subscribeToCollections((data) => {
      setCollections(data)
      setLoading(false)
    })

    const unsubscribePayments = firestoreService.subscribeToPayments((data) => {
      setPayments(data)
      setLoading(false)
    })

    const unsubscribePaymentMethods = firestoreService.subscribeToPaymentMethods((data) => {
      setPaymentMethods(data)
      setLoading(false)
    })

    // Subscribe to all daily closures
    const unsubscribeDailyClosures = firestoreService.subscribeToDailyClosures((data) => {
      setDailyClosures(data)
    })

    return () => {
      unsubscribeCollections()
      unsubscribePayments()
      unsubscribePaymentMethods()
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

  // Collection methods
  const addCollection = useCallback(async (transaction: Omit<Transaction, 'id' | 'type'>) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.addCollection(transaction)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar cobro')
    }
  }, [firestoreService])

  const updateCollection = useCallback(async (id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.updateCollection(id, transaction)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cobro')
    }
  }, [firestoreService])

  const deleteCollection = useCallback(async (id: string) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.deleteCollection(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cobro')
    }
  }, [firestoreService])

  // Payment methods
  const addPayment = useCallback(async (transaction: Omit<Transaction, 'id' | 'type'>) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.addPayment(transaction)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar pago')
    }
  }, [firestoreService])

  const updatePayment = useCallback(async (id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.updatePayment(id, transaction)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar pago')
    }
  }, [firestoreService])

  const deletePayment = useCallback(async (id: string) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.deletePayment(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pago')
    }
  }, [firestoreService])

  // Payment method management
  const addPaymentMethod = useCallback(async (paymentMethod: Omit<PaymentMethod, 'id'>) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.addPaymentMethod(paymentMethod)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar método de pago')
    }
  }, [firestoreService])

  const updatePaymentMethod = useCallback(async (id: string, paymentMethod: Partial<Omit<PaymentMethod, 'id'>>) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.updatePaymentMethod(id, paymentMethod)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar método de pago')
    }
  }, [firestoreService])

  const deletePaymentMethod = useCallback(async (id: string) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      await firestoreService.deletePaymentMethod(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar método de pago')
    }
  }, [firestoreService])

  // Daily closure methods
  const saveTodayClosure = useCallback(async (data: {
    cashCounted: number
    cardCounted: number
    transferCounted: number
    expenses: DailyExpense[]
    note?: string
    closureDate?: string
    closureNumber?: number
  }) => {
    if (!firestoreService || !user) return
    
    try {
      setError(null)
      // Usar fecha específica o el día activo
      const workingDay = data.closureDate || activeWorkingDay
      
      // Obtener transacciones de ese día específico
      const dayTransactions = await firestoreService.getTransactionsForDate(workingDay)
      
      // Calculate totals
      const totalCounted = data.cashCounted + data.cardCounted + data.transferCounted
      const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0)
      
      // Calculate work mode totals
      const workModeTotal = dayTransactions
        .filter(t => t.type === 'collection')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const difference = totalCounted - workModeTotal
      const finalBalance = totalCounted - totalExpenses

      const closure: Omit<DailyClosure, 'userId'> = {
        id: `${user.uid}_${workingDay}`,
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
  }, [firestoreService, user, activeWorkingDay])

  const closeDailyBalance = useCallback(async (closureDate?: string) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      const dateToClose = closureDate || activeWorkingDay
      await firestoreService.closeDailyBalance(dateToClose)
      
      // Recalcular día activo (se actualizará automáticamente vía useEffect)
      const nextDay = getBusinessDay(businessDayCutoff)
      setActiveWorkingDay(nextDay)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar el día')
      throw err
    }
  }, [firestoreService, activeWorkingDay, businessDayCutoff])

  // Manejar conflictos de cierre
  const handleClosureConflict = useCallback(async (
    action: string,
    closureData: any,
    existingClosure: DailyClosure,
    rememberChoice: boolean = false
  ) => {
    if (!firestoreService || !user) return
    
    try {
      setError(null)
      
      // Guardar preferencia si se solicita
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
          // Eliminar cierre anterior y crear nuevo
          await firestoreService.deleteDailyClosure(workingDay)
          await saveTodayClosure(closureData)
          await closeDailyBalance(workingDay)
          break
          
        case 'multiple':
          // Crear cierre adicional con numeración
          const closureNumber = await firestoreService.getNextClosureNumber(workingDay)
          await saveTodayClosure({
            ...closureData,
            closureNumber
          })
          await firestoreService.closeDailyBalance(workingDay, `${user.uid}_${workingDay}_${closureNumber}`)
          break
          
        case 'unify':
          // Combinar datos y crear cierre unificado
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
          // Cancelar cierre anterior y permitir edición
          await firestoreService.closeDailyBalance(workingDay, existingClosure.id)
          // El usuario podrá editar en el formulario
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al manejar conflicto de cierre')
      throw err
    }
  }, [firestoreService, user, activeWorkingDay, saveTodayClosure, closeDailyBalance, userSettings])

  // Obtener recomendación de acción para conflicto
  const getConflictRecommendation = useCallback((existingClosure: DailyClosure): 'unify' | 'multiple' | 'replace' => {
    if (!existingClosure.closedAt) return 'replace'
    
    const timeDiff = Date.now() - existingClosure.closedAt
    const threshold = userSettings?.unifiedClosureThreshold || 120 * 60 * 1000 // 2 horas por defecto
    
    // Si hay poca diferencia de tiempo, recomendar unificar
    if (timeDiff < threshold) {
      return 'unify'
    }
    
    // Si hay mucha diferencia, recomendar múltiples cierres
    return 'multiple'
  }, [userSettings])

  // Actualizar hora de corte
  const updateBusinessDayCutoff = useCallback(async (hour: number) => {
    if (!firestoreService) return
    
    try {
      await firestoreService.saveUserSettings({
        businessDayCutoffHour: hour,
        createdAt: userSettings?.createdAt || Date.now()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración')
      throw err
    }
  }, [firestoreService, userSettings])

  // Obtener sugerencias de cierre
  const getClosureSuggestions = useCallback(() => {
    return getClosureDateSuggestions(businessDayCutoff)
  }, [businessDayCutoff])

  // Función para forzar actualización del día activo
  const forceUpdateActiveWorkingDay = useCallback(() => {
    const newDay = getBusinessDay(businessDayCutoff)
    setActiveWorkingDay(newDay)
  }, [businessDayCutoff])

  // Función para forzar inicio de nuevo día (reabrir el día)
  const forceStartNewDay = useCallback(async () => {
    try {
      setError(null)
      // Obtener el día comercial actual
      const newDay = getBusinessDay(businessDayCutoff)
      
      // Actualizar el día activo
      setActiveWorkingDay(newDay)
      
      // Limpiar el cierre del día actual si existe
      setTodayClosure(null)
      
      console.log('✅ Nuevo día iniciado:', newDay)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar nuevo día')
      throw err
    }
  }, [businessDayCutoff])

  // Función para cancelar cierre de día
  const cancelDayClosure = useCallback(async (closureDate: string) => {
    if (!firestoreService) return
    
    try {
      setError(null)
      
      // Verificar si la función existe
      if (typeof firestoreService.deleteDailyClosure !== 'function') {
        throw new Error('Función deleteDailyClosure no disponible. Por favor, recarga la página.')
      }
      
      // Eliminar el cierre del día de Firestore
      await firestoreService.deleteDailyClosure(closureDate)
      
      // Actualizar el estado local - remover de la lista de cierres
      setDailyClosures(prev => prev.filter(c => c.date !== closureDate))
      
      // Establecer el cierre actual a null (no restaurar)
      // Esto evita que el auto-guardado vuelva a crear el cierre
      setTodayClosure(null)
      
      // Forzar recálculo del día activo para asegurar que se muestre el formulario de cierre vacío
      const newDay = getBusinessDay(businessDayCutoff)
      setActiveWorkingDay(newDay)
      
      console.log('✅ Cierre cancelado para:', closureDate)
      console.log('✅ Formulario reseteado')
      console.log('✅ Día activo actualizado a:', newDay)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar cierre'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [firestoreService, businessDayCutoff])

  const value = {
    collections,
    payments,
    paymentMethods,
    loading,
    error,
    addCollection,
    addPayment,
    updateCollection,
    updatePayment,
    deleteCollection,
    deletePayment,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    // Daily closure
    todayClosure,
    todayTransactions,
    dailyClosures,
    saveTodayClosure,
    closeDailyBalance,
    handleClosureConflict,
    getConflictRecommendation,
    // Business Day
    activeWorkingDay,
    businessDayCutoff,
    userSettings,
    isExtendedHours: isExtendedHours(businessDayCutoff),
    updateBusinessDayCutoff,
    getClosureSuggestions,
    forceUpdateActiveWorkingDay,
    forceStartNewDay,
    cancelDayClosure,
  }

  return (
    <CashflowContext.Provider value={value}>
      {children}
    </CashflowContext.Provider>
  )
}

export function useFirestoreCashflow() {
  const context = useContext(CashflowContext)
  if (!context) {
    throw new Error("useFirestoreCashflow must be used within FirestoreCashflowProvider")
  }
  return context
}
