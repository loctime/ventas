"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./auth-context"
import { FirestoreService, Transaction, PaymentMethod } from "@/lib/firestore-service"
import type { DailyClosure, DailyExpense } from "@/lib/types"

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
  }) => Promise<void>
  closeDailyBalance: () => Promise<void>
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

    // Subscribe to today's closure
    const today = new Date().toISOString().split('T')[0]
    const unsubscribeTodayClosure = firestoreService.subscribeToDailyClosure(today, (data) => {
      setTodayClosure(data)
    })

    // Subscribe to all daily closures
    const unsubscribeDailyClosures = firestoreService.subscribeToDailyClosures((data) => {
      setDailyClosures(data)
    })

    // Get today's transactions
    firestoreService.getTransactionsForDate(today).then((data) => {
      setTodayTransactions(data)
    })

    return () => {
      unsubscribeCollections()
      unsubscribePayments()
      unsubscribePaymentMethods()
      unsubscribeTodayClosure()
      unsubscribeDailyClosures()
    }
  }, [firestoreService])

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
  }) => {
    if (!firestoreService || !user) return
    
    try {
      setError(null)
      const today = new Date().toISOString().split('T')[0]
      
      // Calculate totals
      const totalCounted = data.cashCounted + data.cardCounted + data.transferCounted
      const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0)
      
      // Calculate work mode totals
      const workModeTotal = todayTransactions
        .filter(t => t.type === 'collection')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const difference = totalCounted - workModeTotal
      const finalBalance = totalCounted - totalExpenses

      const closure: Omit<DailyClosure, 'userId'> = {
        id: `${user.uid}_${today}`,
        date: today,
        cashCounted: data.cashCounted,
        cardCounted: data.cardCounted,
        transferCounted: data.transferCounted,
        totalCounted,
        expenses: data.expenses,
        totalExpenses,
        workModeTransactionIds: todayTransactions.map(t => t.id || ''),
        workModeTotal,
        difference,
        note: data.note,
        finalBalance,
        status: 'open',
        createdAt: Date.now()
      }

      await firestoreService.saveDailyClosure(closure)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cierre')
      throw err
    }
  }, [firestoreService, user, todayTransactions])

  const closeDailyBalance = useCallback(async () => {
    if (!firestoreService) return
    
    try {
      setError(null)
      const today = new Date().toISOString().split('T')[0]
      await firestoreService.closeDailyBalance(today)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar el día')
      throw err
    }
  }, [firestoreService])

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
