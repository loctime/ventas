"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./auth-context"
import { FirestoreService, Transaction, PaymentMethod } from "@/lib/firestore-service"

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

    return () => {
      unsubscribeCollections()
      unsubscribePayments()
      unsubscribePaymentMethods()
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
