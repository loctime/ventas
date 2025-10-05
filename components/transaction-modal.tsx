"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PaymentMethod, TransactionType } from "@/lib/types"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  type: TransactionType
  method: PaymentMethod
  onSubmit: (amount: number, note?: string, isRecurring?: boolean, frequency?: "weekly" | "monthly" | "yearly") => void
}

export function TransactionModal({ isOpen, onClose, type, method, onSubmit }: TransactionModalProps) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return

    onSubmit(
      numAmount,
      note || undefined,
      type === "expense" ? isRecurring : undefined,
      type === "expense" && isRecurring ? frequency : undefined,
    )

    setAmount("")
    setNote("")
    setIsRecurring(false)
    setFrequency("monthly")
    onClose()
  }

  const methodLabels: Record<PaymentMethod, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
  }
  const methodLabel = methodLabels[method]
  const typeLabel = type === "income" ? "Cobro" : "Pago"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-balance">
            Agregar {typeLabel} - {methodLabel}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold">
              Monto *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl h-14 text-center"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-base font-semibold">
              Nota (opcional)
            </Label>
            <Input
              id="note"
              type="text"
              placeholder="Agregar una nota..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12"
            />
          </div>

          {type === "expense" && (
            <>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="recurring" className="text-base font-semibold">
                  Pago Recurrente
                </Label>
                <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>

              {isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-base font-semibold">
                    Frecuencia
                  </Label>
                  <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold"
            style={{
              backgroundColor: type === "income" ? "var(--income)" : "var(--expense)",
              color: type === "income" ? "var(--income-foreground)" : "var(--expense-foreground)",
            }}
          >
            Agregar {typeLabel}
          </Button>
        </form>
      </div>
    </div>
  )
}
