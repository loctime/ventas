import { useState, useEffect, useCallback } from "react"
import type { FirestoreService, Transaction } from "@/lib/firestore-service"

export function useFirestoreTransactions(firestoreService: FirestoreService | null) {
  const [collections, setCollections] = useState<Transaction[]>([])
  const [payments, setPayments] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    return () => {
      unsubscribeCollections()
      unsubscribePayments()
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

  return {
    collections,
    payments,
    loading,
    error,
    addCollection,
    updateCollection,
    deleteCollection,
    addPayment,
    updatePayment,
    deletePayment
  }
}

