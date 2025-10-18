"use client"

import { Card } from "./ui/card"

interface ClosureSummaryProps {
  totalCounted: number
  totalExpenses: number
  finalBalance: number
}

export function ClosureSummary({ totalCounted, totalExpenses, finalBalance }: ClosureSummaryProps) {
  return (
    <Card className="modern-card p-6 bg-gradient-to-br from-blue-50 to-purple-50 scale-hover">
      <div className="space-y-3">
        <div className="flex justify-between text-lg">
          <span>Total Ingresos:</span>
          <span className="font-semibold success-gradient">${totalCounted.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span>Total Gastos:</span>
          <span className="font-semibold danger-gradient">-${totalExpenses.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between text-2xl font-bold pt-3 border-t-2">
          <span>Balance del Día:</span>
          <span className="success-gradient">${finalBalance.toLocaleString('es-AR')}</span>
        </div>
      </div>
    </Card>
  )
}

