"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle } from "lucide-react"
import { formatDateLong } from "@/lib/utils/business-day"

interface ClosureDateSelectorProps {
  open: boolean
  onClose: () => void
  suggestedDate: string
  alternateDate: string | null
  onConfirm: (selectedDate: string) => void
  businessDay: string
  calendarDay: string
}

export function ClosureDateSelectorDialog({
  open,
  onClose,
  suggestedDate,
  alternateDate,
  onConfirm,
  businessDay,
  calendarDay,
}: ClosureDateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState(suggestedDate)

  const handleConfirm = () => {
    onConfirm(selectedDate)
    onClose()
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            ¿Qué día deseas cerrar?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Son las {new Date().toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} - Selecciona el día que deseas cerrar
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          {/* Opción sugerida */}
          <button
            onClick={() => setSelectedDate(suggestedDate)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedDate === suggestedDate
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-sm text-muted-foreground mb-1">
                  Día Comercial (Recomendado)
                </div>
                <div className="text-lg font-bold capitalize">
                  {formatDateLong(suggestedDate)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Según tu horario de cierre configurado
                </div>
              </div>
              {selectedDate === suggestedDate && (
                <div className="ml-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          </button>

          {/* Opción alternativa */}
          {alternateDate && (
            <button
              onClick={() => setSelectedDate(alternateDate)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedDate === alternateDate
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-muted-foreground mb-1">
                    Fecha Alternativa
                  </div>
                  <div className="text-lg font-bold capitalize">
                    {formatDateLong(alternateDate)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Fecha del calendario actual
                  </div>
                </div>
                {selectedDate === alternateDate && (
                  <div className="ml-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          )}

          {/* Info adicional */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-900 dark:text-blue-100">
              El día comercial se calcula según tu horario configurado. 
              Puedes cambiarlo en la configuración.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirmar y Cerrar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

