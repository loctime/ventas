"use client"

import { Card } from "./ui/card"
import { Input } from "./ui/input"

interface DailyIncomeSectionProps {
  cashCounted: number
  cardCounted: number
  transferCounted: number
  registeredCash: number
  registeredCard: number
  registeredTransfer: number
  onCashChange: (value: number) => void
  onCardChange: (value: number) => void
  onTransferChange: (value: number) => void
}

export function DailyIncomeSection({
  cashCounted,
  cardCounted,
  transferCounted,
  registeredCash,
  registeredCard,
  registeredTransfer,
  onCashChange,
  onCardChange,
  onTransferChange
}: DailyIncomeSectionProps) {
  const totalCounted = cashCounted + cardCounted + transferCounted

  return (
    <Card className="modern-card p-4 scale-hover">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        <span className="floating-icon">💰</span>
        Ingresos del Día
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">💵 Efectivo</label>
          <Input
            type="number"
            inputMode="decimal"
            value={cashCounted || ""}
            onChange={(e) => onCashChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="text-lg modern-input"
          />
          {registeredCash > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Ventas registradas: ${registeredCash.toLocaleString('es-AR')}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">💳 Tarjeta</label>
          <Input
            type="number"
            inputMode="decimal"
            value={cardCounted || ""}
            onChange={(e) => onCardChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="text-lg modern-input"
          />
          {registeredCard > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Ventas registradas: ${registeredCard.toLocaleString('es-AR')}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">🏦 Transferencias</label>
          <Input
            type="number"
            inputMode="decimal"
            value={transferCounted || ""}
            onChange={(e) => onTransferChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="text-lg modern-input"
          />
          {registeredTransfer > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Ventas registradas: ${registeredTransfer.toLocaleString('es-AR')}
            </p>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Ingresos:</span>
            <span className="success-gradient">${totalCounted.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

