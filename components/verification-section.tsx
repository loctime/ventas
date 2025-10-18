"use client"

import { Card } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { AlertCircle } from "lucide-react"

interface VerificationSectionProps {
  registeredTotal: number
  totalCounted: number
  difference: number
  note: string
  onNoteChange: (note: string) => void
}

export function VerificationSection({
  registeredTotal,
  totalCounted,
  difference,
  note,
  onNoteChange
}: VerificationSectionProps) {
  if (registeredTotal === 0) return null

  return (
    <Card className="modern-card p-6 scale-hover">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="floating-icon">📊</span>
        Verificación
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Ventas registradas:</span>
          <span className="font-semibold">${registeredTotal.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between">
          <span>Conteo real:</span>
          <span className="font-semibold">${totalCounted.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-semibold">Diferencia:</span>
          <div className="flex items-center gap-2">
            {difference !== 0 && (
              <AlertCircle className={`h-4 w-4 ${difference < 0 ? 'text-red-500' : 'text-yellow-500'}`} />
            )}
            <span className={`font-bold ${difference < 0 ? 'text-red-600' : difference > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {difference >= 0 ? '+' : ''}${difference.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {difference !== 0 && (
        <div className="mt-4">
          <label className="text-sm font-medium">Nota / Justificación:</label>
          <Textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Ej: Propina que di, venta no registrada, etc."
            rows={3}
          />
        </div>
      )}
    </Card>
  )
}

