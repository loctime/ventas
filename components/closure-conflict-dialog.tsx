"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Switch } from "./ui/switch"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { DailyClosure } from "@/lib/types"

interface ClosureData {
  cashCounted: number
  cardCounted: number
  transferCounted: number
  expenses: any[]
  note?: string
  finalBalance: number
}

interface ClosureConflictDialogProps {
  open: boolean
  existingClosure: DailyClosure
  newClosureData: ClosureData
  recommendedAction: 'unify' | 'multiple' | 'replace'
  onClose: () => void
  onConfirm: (action: string, rememberChoice: boolean) => void
}

export function ClosureConflictDialog({
  existingClosure,
  newClosureData,
  recommendedAction,
  onClose,
  onConfirm
}: ClosureConflictDialogProps) {
  const [selectedAction, setSelectedAction] = useState(recommendedAction)
  const [rememberChoice, setRememberChoice] = useState(false)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'unify':
        return {
          title: '🔗 Unificar Cierres',
          description: 'Combinar ambos cierres en uno solo',
          details: 'Se sumarán todos los ingresos y gastos en un único cierre del día',
          balance: existingClosure.finalBalance + newClosureData.finalBalance,
          color: 'text-purple-600'
        }
      case 'multiple':
        return {
          title: '➕ Crear Cierre Adicional',
          description: 'Mantener ambos cierres separados',
          details: 'Se crearán dos cierres independientes para el mismo día',
          balance: `${existingClosure.finalBalance.toLocaleString()} + ${newClosureData.finalBalance.toLocaleString()}`,
          color: 'text-green-600'
        }
      case 'replace':
        return {
          title: '🔄 Reemplazar Cierre',
          description: 'Eliminar el cierre anterior y crear uno nuevo',
          details: 'Se perderá el cierre anterior, solo quedará el nuevo',
          balance: newClosureData.finalBalance,
          color: 'text-orange-600'
        }
      default:
        return {
          title: '✏️ Editar Cierre Anterior',
          description: 'Cancelar el cierre anterior para editarlo',
          details: 'El cierre anterior volverá a estado abierto para modificaciones',
          balance: 'Editable',
          color: 'text-blue-600'
        }
    }
  }

  const actionInfo = getActionDescription(selectedAction)

  const handleConfirm = () => {
    onConfirm(selectedAction, rememberChoice)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Conflicto de Cierre
          </DialogTitle>
          <DialogDescription>
            Ya existe un cierre para este día. Elige cómo proceder:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen de cierres */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <h4 className="font-semibold text-sm text-muted-foreground">Cierre Existente</h4>
              <p className="text-2xl font-bold text-blue-600">
                ${existingClosure.finalBalance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(existingClosure.closedAt || existingClosure.createdAt)}
              </p>
              <div className="text-xs text-blue-600 mt-1">
                {existingClosure.cashCounted > 0 && `Efectivo: $${existingClosure.cashCounted.toLocaleString()}`}
                {existingClosure.cardCounted > 0 && ` • Tarjeta: $${existingClosure.cardCounted.toLocaleString()}`}
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-sm text-muted-foreground">Nuevo Cierre</h4>
              <p className="text-2xl font-bold text-green-600">
                ${newClosureData.finalBalance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Ahora
              </p>
              <div className="text-xs text-green-600 mt-1">
                {newClosureData.cashCounted > 0 && `Efectivo: $${newClosureData.cashCounted.toLocaleString()}`}
                {newClosureData.cardCounted > 0 && ` • Tarjeta: $${newClosureData.cardCounted.toLocaleString()}`}
              </div>
            </div>
          </div>

          {/* Recomendación */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">💡</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Recomendación del sistema
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {recommendedAction === 'unify' 
                ? 'Los cierres son muy cercanos en tiempo. Se recomienda unificar para mantener un registro limpio.'
                : recommendedAction === 'multiple'
                ? 'Los cierres tienen suficiente diferencia temporal. Se recomienda mantener separados para mejor trazabilidad.'
                : 'Se recomienda reemplazar el cierre anterior ya que parece ser una corrección.'}
            </p>
          </div>

          {/* Opciones de acción */}
          <div className="space-y-3">
            <h4 className="font-medium">Selecciona una acción:</h4>
            
            {[
              { value: 'unify', icon: '🔗' },
              { value: 'multiple', icon: '➕' },
              { value: 'replace', icon: '🔄' },
              { value: 'edit', icon: '✏️' }
            ].map((option) => (
              <div
                key={option.value}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAction === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAction(option.value)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={selectedAction === option.value}
                    onChange={() => setSelectedAction(option.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium">
                        {getActionDescription(option.value).title}
                      </span>
                      {option.value === recommendedAction && (
                        <Badge variant="secondary" className="text-xs">
                          Recomendado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getActionDescription(option.value).description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getActionDescription(option.value).details}
                    </p>
                    <div className="mt-2">
                      <span className={`text-sm font-semibold ${getActionDescription(option.value).color}`}>
                        Balance resultante: {
                          typeof getActionDescription(option.value).balance === 'number'
                            ? `$${getActionDescription(option.value).balance.toLocaleString()}`
                            : getActionDescription(option.value).balance
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Switch para recordar elección */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Recordar esta elección</span>
            </div>
            <Switch
              checked={rememberChoice}
              onCheckedChange={setRememberChoice}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Si activas esta opción, el sistema aplicará automáticamente la misma acción en futuros conflictos similares.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="modern-button">
            Confirmar Acción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
