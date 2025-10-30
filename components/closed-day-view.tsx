"use client"

import { useState } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
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
  const [isLoadingCancel, setIsLoadingCancel] = useState(false)
  const [isLoadingForce, setIsLoadingForce] = useState(false)
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
      setIsLoadingForce(true)
      try {
        await onForceStart()
        console.log('✅ Nuevo día iniciado exitosamente')
      } catch (error) {
        console.error('Error al forzar inicio:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        alert(`Error al iniciar nuevo día: ${errorMessage}`)
      } finally {
        setIsLoadingForce(false)
      }
    }
  }

  const handleCancelClosure = async () => {
    if (confirm('⚠️ ADVERTENCIA: Esto reabrirá el cierre para que puedas editarlo nuevamente. Todos los datos se conservarán. ¿Estás seguro?')) {
      setIsLoadingCancel(true)
      try {
        await onCancelClosure()
        console.log('✅ Cierre cancelado exitosamente')
        // Mantener el loader un poco más para que se carguen los datos
        setTimeout(() => setIsLoadingCancel(false), 1000)
      } catch (error) {
        console.error('Error al cancelar cierre:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        alert(`Error al cancelar cierre: ${errorMessage}`)
        setIsLoadingCancel(false)
      }
    } else {
      setIsLoadingCancel(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Header compacto */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Día Cerrado</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {formatDate(closure.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de ingresos y gastos */}
      <Card className="modern-card p-4 scale-hover">
        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Ingresos</p>
            <p className="text-lg font-bold text-green-600">
              ${closure.totalCounted.toLocaleString('es-AR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Gastos</p>
            <p className="text-lg font-bold text-red-600">
              ${closure.totalExpenses.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
        
        {/* Balance final destacado */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Balance del Día</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-600">
            ${finalBalance.toLocaleString('es-AR')}
          </p>
        </div>
      </Card>

      {/* Información del próximo día compacta */}
      <Card className="modern-card p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <span className="text-lg">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-0.5">
              Próximo día
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
              {nextDayInfo.message}
            </p>
          </div>
        </div>
      </Card>

      {/* Botones de acción compactos */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          onClick={handleForceStart}
          variant="outline"
          className="modern-button text-sm"
          disabled={isLoadingForce || isLoadingCancel}
        >
          {isLoadingForce ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <span className="mr-1">🚀</span>
              Forzar Inicio
            </>
          )}
        </Button>
        <Button 
          onClick={handleCancelClosure}
          variant="destructive"
          className="modern-button text-sm"
          disabled={isLoadingCancel || isLoadingForce}
        >
          {isLoadingCancel ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <span className="mr-1">⚠️</span>
              Cancelar Cierre
            </>
          )}
        </Button>
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-center text-muted-foreground">
        Los cambios requieren confirmación adicional
      </p>
    </div>
  )
}

