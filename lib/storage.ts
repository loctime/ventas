import type { Transaction, RecurringTemplate, CustomPaymentMethod } from "./types"

const TRANSACTIONS_KEY = "cashflow_transactions"
const RECURRING_KEY = "cashflow_recurring"
const CUSTOM_PAYMENT_METHODS_KEY = "cashflow_custom_payment_methods"

export const storage = {
  getTransactions: (): Transaction[] => {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  saveTransactions: (transactions: Transaction[]): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
    } catch (error) {
      console.error("[controlVentas] Failed to save transactions:", error)
    }
  },

  getRecurringTemplates: (): RecurringTemplate[] => {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(RECURRING_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  saveRecurringTemplates: (templates: RecurringTemplate[]): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(RECURRING_KEY, JSON.stringify(templates))
    } catch (error) {
      console.error("[controlVentas] Failed to save recurring templates:", error)
    }
  },

  getCustomPaymentMethods: (): CustomPaymentMethod[] => {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(CUSTOM_PAYMENT_METHODS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  saveCustomPaymentMethods: (methods: CustomPaymentMethod[]): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(CUSTOM_PAYMENT_METHODS_KEY, JSON.stringify(methods))
    } catch (error) {
      console.error("[controlVentas] Failed to save custom payment methods:", error)
    }
  },
}
