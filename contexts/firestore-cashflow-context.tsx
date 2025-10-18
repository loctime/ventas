"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"
import { FirestoreService, Transaction, PaymentMethod } from "@/lib/firestore-service"
import type { DailyClosure, DailyExpense, UserSettings } from "@/lib/types"
import { useFirestoreTransactions } from "@/hooks/use-firestore-transactions"
import { useFirestorePaymentMethods } from "@/hooks/use-firestore-payment-methods"
import { useFirestoreDailyClosures } from "@/hooks/use-firestore-daily-closures"
import { useFirestoreBusinessDay } from "@/hooks/use-firestore-business-day"

interface CashflowContextType {
  // Transactions
  collections: Transaction[]
  payments: Transaction[]
  addCollection: (transaction: Omit<Transaction, 'id' | 'type'>) => Promise<void>
  addPayment: (transaction: Omit<Transaction, 'id' | 'type'>) => Promise<void>
  updateCollection: (id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) => Promise<void>
  updatePayment: (id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  deletePayment: (id: string) => Promise<void>
  
  // Payment Methods
  paymentMethods: PaymentMethod[]
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
  getClosureByDate: (dateStr: string) => Promise<DailyClosure | null>
  updateClosurePreferences: (behavior: string, threshold: number) => Promise<void>
  cancelDayClosure: (closureDate: string) => Promise<void>
  
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
  
  // General
  loading: boolean
  error: string | null
}

const CashflowContext = createContext<CashflowContextType | undefined>(undefined)

export function FirestoreCashflowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [firestoreService, setFirestoreService] = useState<FirestoreService | null>(null)

  // Initialize Firestore service when user is available
  useEffect(() => {
    if (user?.uid) {
      const service = new FirestoreService(user.uid)
      setFirestoreService(service)
    } else {
      setFirestoreService(null)
    }
  }, [user])

  // Use custom hooks for different features
  const transactionsHook = useFirestoreTransactions(firestoreService)
  const paymentMethodsHook = useFirestorePaymentMethods(firestoreService)
  const businessDayHook = useFirestoreBusinessDay(firestoreService)
  const dailyClosuresHook = useFirestoreDailyClosures({
    firestoreService,
    userId: user?.uid,
    activeWorkingDay: businessDayHook.activeWorkingDay,
    userSettings: businessDayHook.userSettings
  })

  // Combine loading and error states
  const loading = transactionsHook.loading || paymentMethodsHook.loading
  const error = transactionsHook.error || paymentMethodsHook.error || businessDayHook.error || dailyClosuresHook.error

  const value: CashflowContextType = {
    // Transactions
    collections: transactionsHook.collections,
    payments: transactionsHook.payments,
    addCollection: transactionsHook.addCollection,
    addPayment: transactionsHook.addPayment,
    updateCollection: transactionsHook.updateCollection,
    updatePayment: transactionsHook.updatePayment,
    deleteCollection: transactionsHook.deleteCollection,
    deletePayment: transactionsHook.deletePayment,
    
    // Payment Methods
    paymentMethods: paymentMethodsHook.paymentMethods,
    addPaymentMethod: paymentMethodsHook.addPaymentMethod,
    updatePaymentMethod: paymentMethodsHook.updatePaymentMethod,
    deletePaymentMethod: paymentMethodsHook.deletePaymentMethod,
    
    // Daily Closure
    todayClosure: dailyClosuresHook.todayClosure,
    todayTransactions: dailyClosuresHook.todayTransactions,
    dailyClosures: dailyClosuresHook.dailyClosures,
    saveTodayClosure: dailyClosuresHook.saveTodayClosure,
    closeDailyBalance: dailyClosuresHook.closeDailyBalance,
    handleClosureConflict: dailyClosuresHook.handleClosureConflict,
    getConflictRecommendation: dailyClosuresHook.getConflictRecommendation,
    getClosureByDate: dailyClosuresHook.getClosureByDate,
    updateClosurePreferences: businessDayHook.updateClosurePreferences,
    cancelDayClosure: dailyClosuresHook.cancelDayClosure,
    
    // Business Day
    activeWorkingDay: businessDayHook.activeWorkingDay,
    businessDayCutoff: businessDayHook.businessDayCutoff,
    userSettings: businessDayHook.userSettings,
    isExtendedHours: businessDayHook.isExtendedHours,
    updateBusinessDayCutoff: businessDayHook.updateBusinessDayCutoff,
    getClosureSuggestions: businessDayHook.getClosureSuggestions,
    forceUpdateActiveWorkingDay: businessDayHook.forceUpdateActiveWorkingDay,
    forceStartNewDay: businessDayHook.forceStartNewDay,
    
    // General
    loading,
    error
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
