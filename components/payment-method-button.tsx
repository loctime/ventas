"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Banknote, CreditCard, ArrowRightLeft, Plus } from "lucide-react"
import type { PaymentMethod, CustomPaymentMethod } from "@/lib/types"

interface PaymentMethodButtonProps {
  method: PaymentMethod | "add" | CustomPaymentMethod
  onClick: () => void
  variant: "income" | "expense"
}

const defaultIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
  add: Plus,
}

const defaultLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  add: "Agregar",
}

export function PaymentMethodButton({ method, onClick, variant }: PaymentMethodButtonProps) {
  const isCustomMethod = typeof method === "object" && "id" in method
  const isAddButton = method === "add"

  let icon, label, backgroundColor, textColor

  if (isAddButton) {
    icon = defaultIcons.add
    label = defaultLabels.add
    backgroundColor = variant === "income" ? "var(--income)" : "var(--expense)"
    textColor = variant === "income" ? "var(--income-foreground)" : "var(--expense-foreground)"
  } else if (isCustomMethod) {
    icon = method.icon
    label = method.name
    backgroundColor = method.color
    textColor = "white"
  } else {
    const IconComponent = defaultIcons[method as keyof typeof defaultIcons]
    icon = IconComponent
    label = defaultLabels[method as keyof typeof defaultLabels]
    backgroundColor = variant === "income" ? "var(--income)" : "var(--expense)"
    textColor = variant === "income" ? "var(--income-foreground)" : "var(--expense-foreground)"
  }

  return (
    <Button
      onClick={onClick}
      className="h-32 flex flex-col gap-3 text-lg font-semibold relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {isCustomMethod ? (
        <span className="text-4xl">{icon}</span>
      ) : (
        <>{React.createElement(icon, { className: "h-10 w-10" })}</>
      )}
      <span className="text-sm leading-tight">{label}</span>
    </Button>
  )
}
