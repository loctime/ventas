export type TransactionType = "income" | "expense"
export type PaymentMethod = "cash" | "card" | "transfer" | string // Permitir métodos personalizados
export type RecurringFrequency = "weekly" | "monthly" | "yearly"

export interface CustomPaymentMethod {
  id: string
  name: string
  icon: string
  color: string
}

export interface Transaction {
  id: string
  type: TransactionType
  method: PaymentMethod
  amount: number
  note?: string
  date: number
  isRecurring?: boolean
  recurringFrequency?: RecurringFrequency
}

export interface RecurringTemplate {
  id: string
  method: PaymentMethod
  amount: number
  note?: string
  frequency: RecurringFrequency
  nextDue: number
}

// Tipos para el sistema de cierre diario
export interface DailyExpense {
  id: string
  description: string
  amount: number
}

export interface DailyClosure {
  id: string
  date: string // Formato: YYYY-MM-DD
  userId: string
  
  // Conteo real de caja
  cashCounted: number
  cardCounted: number
  transferCounted: number
  totalCounted: number
  
  // Gastos del día
  expenses: DailyExpense[]
  totalExpenses: number
  
  // Comparación con Work Mode
  workModeTransactionIds: string[] // IDs de transacciones del día
  workModeTotal: number
  difference: number // counted - workMode
  
  // Justificación de diferencias
  note?: string
  
  // Balance final
  finalBalance: number // totalCounted - totalExpenses
  
  status: "open" | "closed"
  createdAt: number
  closedAt?: number
}
