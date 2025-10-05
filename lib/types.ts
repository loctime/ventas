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
