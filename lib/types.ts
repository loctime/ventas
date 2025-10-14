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
  
  // Campos para múltiples cierres
  closureNumber?: number // Número de cierre del día (1, 2, 3...)
  parentDate?: string // Fecha padre para cierres unificados
  unifiedFrom?: string[] // IDs de cierres que se unificaron en este
}

// Configuración de usuario
export interface UserSettings {
  userId: string
  businessDayCutoffHour: number // Hora de corte (0-23), por defecto 4
  createdAt: number
  updatedAt: number
  
  // Preferencias para conflictos de cierre
  closureConflictBehavior?: 'ask' | 'always_unify' | 'always_multiple' | 'always_replace'
  unifiedClosureThreshold?: number // Minutos para considerar unificar automáticamente
}

// Helper para sugerir días al cerrar
export interface ClosureDateSuggestion {
  suggestedDate: string // Fecha sugerida por el sistema
  alternateDate: string | null // Fecha alternativa si aplica
  isAfterMidnight: boolean // Si estamos después de las 00:00
  businessDay: string // Día comercial según hora de corte
  calendarDay: string // Día del calendario actual
  message: string
}

// Tipos para manejo de conflictos de cierre
export interface ClosureConflictData {
  existingClosure: DailyClosure
  newClosureData: {
    cashCounted: number
    cardCounted: number
    transferCounted: number
    expenses: DailyExpense[]
    note?: string
    finalBalance: number
  }
  recommendedAction: 'unify' | 'multiple' | 'replace'
}

export type ClosureConflictAction = 'unify' | 'multiple' | 'replace' | 'edit'
