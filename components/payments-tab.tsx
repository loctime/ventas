"use client"

import { useState } from "react"
import { PaymentMethodButton } from "./payment-method-button"
import { TransactionModal } from "./transaction-modal"
import { AddPaymentMethodModal } from "./add-payment-method-modal"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import type { PaymentMethod } from "@/lib/firestore-service"

export function PaymentsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | string>("cash")
  const { addPayment, paymentMethods, loading, error } = useFirestoreCashflow()

  const handleMethodClick = (method: PaymentMethod | string | "add") => {
    if (method === "add") {
      setIsAddMethodModalOpen(true)
      return
    }
    setSelectedMethod(method)
    setIsModalOpen(true)
  }

  const handleSubmit = async (
    amount: number,
    note?: string,
    isRecurring?: boolean,
    frequency?: "weekly" | "monthly" | "yearly",
  ) => {
    const methodName = typeof selectedMethod === "object" ? selectedMethod.name : selectedMethod
    await addPayment({
      amount,
      description: note || "",
      category: methodName,
      date: new Date()
    })
  }

  // Crear array de métodos disponibles
  const defaultMethods = [
    { id: "cash", name: "Efectivo", type: "cash" as const, isDefault: true },
    { id: "card", name: "Tarjeta", type: "card" as const, isDefault: true },
    { id: "transfer", name: "Transferencia", type: "transfer" as const, isDefault: true }
  ]
  const allMethods = [...defaultMethods, ...paymentMethods]
  
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
