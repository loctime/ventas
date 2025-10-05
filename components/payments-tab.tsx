"use client"

import { useState } from "react"
import { PaymentMethodButton } from "./payment-method-button"
import { TransactionModal } from "./transaction-modal"
import { AddPaymentMethodModal } from "./add-payment-method-modal"
import { useCashflow } from "@/contexts/cashflow-context"
import type { PaymentMethod, CustomPaymentMethod } from "@/lib/types"

export function PaymentsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | CustomPaymentMethod>("cash")
  const { addTransaction, customPaymentMethods } = useCashflow()

  const handleMethodClick = (method: PaymentMethod | CustomPaymentMethod | "add") => {
    if (method === "add") {
      setIsAddMethodModalOpen(true)
      return
    }
    setSelectedMethod(method)
    setIsModalOpen(true)
  }

  const handleSubmit = (
    amount: number,
    note?: string,
    isRecurring?: boolean,
    frequency?: "weekly" | "monthly" | "yearly",
  ) => {
    const methodId = typeof selectedMethod === "object" ? selectedMethod.id : selectedMethod
    addTransaction("expense", methodId, amount, note, isRecurring, frequency)
  }

  // Crear array de métodos disponibles
  const defaultMethods: PaymentMethod[] = ["cash", "card", "transfer"]
  const allMethods = [...defaultMethods, ...customPaymentMethods]
  
  // Organizar en cuadrícula 2x2, llenando con botón "Agregar" si es necesario
  const displayMethods = [...allMethods]
  if (displayMethods.length < 4) {
    displayMethods.push("add" as any)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-balance">Registrar Pago</h2>
      <p className="text-muted-foreground text-pretty">Selecciona un método de pago para registrar un gasto</p>

      <div className="grid grid-cols-2 gap-4 pt-4">
        {displayMethods.slice(0, 4).map((method, index) => (
          <PaymentMethodButton 
            key={typeof method === "object" ? method.id : method} 
            method={method} 
            onClick={() => handleMethodClick(method)} 
            variant="expense" 
          />
        ))}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="expense"
        method={typeof selectedMethod === "object" ? selectedMethod.id : selectedMethod}
        onSubmit={handleSubmit}
      />

      <AddPaymentMethodModal
        isOpen={isAddMethodModalOpen}
        onClose={() => setIsAddMethodModalOpen(false)}
      />
    </div>
  )
}
