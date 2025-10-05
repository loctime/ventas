"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Transaction, RecurringTemplate, PaymentMethod, TransactionType, CustomPaymentMethod } from "@/lib/types"
import { storage } from "@/lib/storage"

interface CashflowContextType {
  transactions: Transaction[]
  recurringTemplates: RecurringTemplate[]
  customPaymentMethods: CustomPaymentMethod[]
  addTransaction: (
    type: TransactionType,
    method: PaymentMethod,
    amount: number,
    note?: string,
    isRecurring?: boolean,
    recurringFrequency?: "weekly" | "monthly" | "yearly",
  ) => void
  deleteTransaction: (id: string) => void
  addCustomPaymentMethod: (method: Omit<CustomPaymentMethod, "id">) => void
  deleteCustomPaymentMethod: (id: string) => void
}

const CashflowContext = createContext<CashflowContextType | undefined>(undefined)

export function CashflowProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([])
  const [customPaymentMethods, setCustomPaymentMethods] = useState<CustomPaymentMethod[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTransactions(storage.getTransactions())
    setRecurringTemplates(storage.getRecurringTemplates())
    setCustomPaymentMethods(storage.getCustomPaymentMethods())
  }, [])

  useEffect(() => {
    if (mounted) {
      storage.saveTransactions(transactions)
    }
  }, [transactions, mounted])

  useEffect(() => {
    if (mounted) {
      storage.saveRecurringTemplates(recurringTemplates)
    }
  }, [recurringTemplates, mounted])

  useEffect(() => {
    if (mounted) {
      storage.saveCustomPaymentMethods(customPaymentMethods)
    }
  }, [customPaymentMethods, mounted])

  const addTransaction = useCallback((
    type: TransactionType,
    method: PaymentMethod,
    amount: number,
    note?: string,
    isRecurring?: boolean,
    recurringFrequency?: "weekly" | "monthly" | "yearly",
  ) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      method,
      amount,
      note,
      date: Date.now(),
      isRecurring,
      recurringFrequency,
    }

    setTransactions((prev) => [newTransaction, ...prev])

    if (isRecurring && recurringFrequency) {
      const nextDue = calculateNextDue(recurringFrequency)
      const template: RecurringTemplate = {
        id: crypto.randomUUID(),
        method,
        amount,
        note,
        frequency: recurringFrequency,
        nextDue,
      }
      setRecurringTemplates((prev) => [...prev, template])
    }
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addCustomPaymentMethod = useCallback((method: Omit<CustomPaymentMethod, "id">) => {
    const newMethod: CustomPaymentMethod = {
      ...method,
      id: crypto.randomUUID(),
    }
    setCustomPaymentMethods((prev) => [...prev, newMethod])
  }, [])

  const deleteCustomPaymentMethod = useCallback((id: string) => {
    setCustomPaymentMethods((prev) => prev.filter((m) => m.id !== id))
    // También eliminar transacciones que usen este método
    setTransactions((prev) => prev.filter((t) => t.method !== id))
  }, [])

  return (
    <CashflowContext.Provider
      value={{
        transactions,
        recurringTemplates,
        customPaymentMethods,
        addTransaction,
        deleteTransaction,
        addCustomPaymentMethod,
        deleteCustomPaymentMethod,
      }}
    >
      {children}
    </CashflowContext.Provider>
  )
}

export function useCashflow() {
  const context = useContext(CashflowContext)
  if (!context) {
    throw new Error("useCashflow must be used within CashflowProvider")
  }
  return context
}

function calculateNextDue(frequency: "weekly" | "monthly" | "yearly"): number {
  const now = new Date()
  switch (frequency) {
    case "weekly":
      return now.setDate(now.getDate() + 7)
    case "monthly":
      return now.setMonth(now.getMonth() + 1)
    case "yearly":
      return now.setFullYear(now.getFullYear() + 1)
  }
}
