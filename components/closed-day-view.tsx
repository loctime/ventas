"use client"

import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { CheckCircle } from "lucide-react"
import { formatDateLong } from "@/lib/utils/business-day"
import type { DailyClosure } from "@/lib/types"

interface ClosedDayViewProps {
  closure: DailyClosure
  businessDayCutoff: number
  onForceStart: () => Promise<void>
  onCancelClosure: () => Promise<void>
}

export function ClosedDayView({ 
  closure, 
  businessDayCutoff,
  onForceStart,
  onCancelClosure 
}: ClosedDayViewProps) {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getNextDayInfo = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const cutoffHour = businessDayCutoff || 4
    
    let nextDayStart: Date
    let nextDayMessage: string
    
    if (currentHour < cutoffHour) {
      nextDayStart = new Date(now)
      nextDayStart.setHours(cutoffHour, 0, 0, 0)
      nextDayMessage = `El próximo día comenzará a las ${cutoffHour.toString().padStart(2, '0')}:00`
    } else {
      nextDayStart = new Date(now)
      nextDayStart.setDate(nextDayStart.getDate() + 1)
      nextDayStart.setHours(cutoffHour, 0, 0, 0)
      nextDayMessage = `El próximo día comenzará mañana a las ${cutoffHour.toString().padStart(2, '0')}:00`
    }
    
    return {
      nextDayStart,
      message: nextDayMessage,
      timeUntilNextDay: nextDayStart.getTime() - now.getTime()
    }
  }

  const nextDayInfo = getNextDayInfo()
  const finalBalance = closure.totalCounted - closure.totalExpenses

  const handleForceStart = async () => {
    if (confirm('¿Estás seguro de iniciar un nuevo día? Esto cambiará al día comercial actual.')) {
      try {
        await onForceStart()
        console.log('✅ Nuevo día iniciado exitosamente')
      } catch (error) {
        console.error('Error al forzar inicio:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        alert(`Error al iniciar nuevo día: ${errorMessage}`)
      }
    }
  }

  const handleCancelClosure = async () => {
    if (confirm('⚠️ ADVERTENCIA: Esto eliminará el cierre del día del historial y permitirá editarlo nuevamente. ¿Estás seguro?')) {
      try {
        await onCancelClosure()
        console.log('✅ Cierre cancelado exitosamente')
      } catch (error) {
        console.error('Error al cancelar cierre:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        alert(`Error al cancelar cierre: ${errorMessage}`)
      }
    }
  }

  return (
    <div className="space-y-4">
      <Card className="modern-card p-6 scale-hover">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto floating-icon" />
          <h2 className="text-2xl font-bold big-number">Día Cerrado</h2>
          
          {/* Información del día cerrado */}
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-900 dark:text-green-100 font-medium">
              Día cerrado: {formatDate(closure.date)}
            </p>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              {formatDateLong(closure.date)}
            </p>
          </div>
          
          {/* Balance del día */}
          <div className="pt-4">
            <div className="text-4xl font-bold success-gradient">
              ${finalBalance.toLocaleString('es-AR')}
            </div>
            <p className="text-sm text-muted-foreground">Balance del día</p>
          </div>
          
          {/* Información del próximo día */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-blue-900 dark:text-blue-100 font-medium">
              Próximo día comercial
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
              {nextDayInfo.message}
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-2">
              {nextDayInfo.nextDayStart.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })} a las {nextDayInfo.nextDayStart.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-3 justify-center pt-4">
            <Button 
              onClick={handleForceStart}
              variant="outline"
              className="modern-button"
            >
              🚀 Forzar Inicio
            </Button>
            <Button 
              onClick={handleCancelClosure}
              variant="destructive"
              className="modern-button"
            >
              ⚠️ Cancelar Cierre
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Los cambios al día cerrado requieren confirmación adicional
          </p>
          
          {/* Mensaje informativo sobre las acciones */}
          <div className="text-xs text-center space-y-1 mt-2">
            <p className="text-blue-600 dark:text-blue-400">
              💡 <strong>Forzar Inicio:</strong> Inicia un nuevo día comercial
            </p>
            <p className="text-orange-600 dark:text-orange-400">
              ⚠️ <strong>Cancelar Cierre:</strong> Elimina el cierre del historial y reinicia el formulario
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

