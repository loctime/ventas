import { useState, useEffect, useCallback } from "react"
import type { FirestoreService, PaymentMethod } from "@/lib/firestore-service"

export function useFirestorePaymentMethods(firestoreService: FirestoreService | null) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to real-time updates
  useEffect(() => {
    if (!firestoreService) return

    setLoading(true)
    setError(null)

    const unsubscribePaymentMethods = firestoreService.subscribeToPaymentMethods((data) => {
      setPaymentMethods(data)
      setLoading(false)
    })

    return () => {
      unsubscribePaymentMethods()
    }
  }, [firestoreService])

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

  return {
    paymentMethods,
    loading,
    error,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
  }
}

