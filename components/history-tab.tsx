"use client"

import { useState } from "react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import { formatCurrency } from "@/lib/utils/firestore-calculations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CalendarDays, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ArrowLeft
} from "lucide-react"
import type { DailyClosure } from "@/lib/types"

export function HistoryTab() {
  const { dailyClosures, loading } = useFirestoreCashflow()
  const [selectedClosure, setSelectedClosure] = useState<DailyClosure | null>(null)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (selectedClosure) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <Button 
          variant="ghost" 
          onClick={() => setSelectedClosure(null)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div>
          <h2 className="text-2xl font-bold capitalize">{formatDate(selectedClosure.date)}</h2>
          <p className="text-muted-foreground">
            {selectedClosure.status === 'closed' ? 'Día cerrado' : 'Día abierto'}
          </p>
        </div>

        {/* Ingresos detallados */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            💰 Ingresos del Día
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">💵 Efectivo:</span>
              <span className="font-semibold">${selectedClosure.cashCounted.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">💳 Tarjeta:</span>
              <span className="font-semibold">${selectedClosure.cardCounted.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">🏦 Transferencias:</span>
              <span className="font-semibold">${selectedClosure.transferCounted.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Total Ingresos:</span>
              <span className="text-green-600">${selectedClosure.totalCounted.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </Card>

        {/* Gastos */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📝 Gastos del Día
          </h3>
          {selectedClosure.expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No se registraron gastos
            </p>
          ) : (
            <div className="space-y-2">
              {selectedClosure.expenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>{expense.description}</span>
                  <span className="font-semibold text-red-600">
                    -${expense.amount.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Total Gastos:</span>
                <span className="text-red-600">${selectedClosure.totalExpenses.toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Verificación */}
        {selectedClosure.workModeTotal > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📊 Verificación
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ventas registradas:</span>
                <span className="font-semibold">${selectedClosure.workModeTotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conteo real:</span>
                <span className="font-semibold">${selectedClosure.totalCounted.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Diferencia:</span>
                <div className="flex items-center gap-2">
                  {selectedClosure.difference !== 0 && (
                    <AlertCircle className={`h-4 w-4 ${selectedClosure.difference < 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                  )}
                  <span className={`font-bold ${
                    selectedClosure.difference < 0 ? 'text-red-600' : 
                    selectedClosure.difference > 0 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {selectedClosure.difference >= 0 ? '+' : ''}${selectedClosure.difference.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
            
            {selectedClosure.note && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Nota:</p>
                <p className="text-sm text-muted-foreground">{selectedClosure.note}</p>
              </div>
            )}
          </Card>
        )}

        {/* Balance final */}
        <Card className="p-6 bg-primary/5">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Balance del Día</h3>
            <div className="text-3xl font-bold text-green-600">
              ${selectedClosure.finalBalance.toLocaleString('es-AR')}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Vista principal del historial
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Historial de Cierres</h2>
        <p className="text-muted-foreground">Revisa los cierres diarios anteriores</p>
      </div>

      {loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </Card>
      )}

      {!loading && dailyClosures.length === 0 && (
        <Card className="p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay cierres registrados aún</p>
          <p className="text-sm text-muted-foreground mt-2">
            Los cierres diarios aparecerán aquí
          </p>
        </Card>
      )}

      {!loading && dailyClosures.length > 0 && (
        <div className="space-y-3">
          {dailyClosures.map((closure) => (
            <Card 
              key={closure.id}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedClosure(closure)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold capitalize">{formatShortDate(closure.date)}</span>
                    {closure.status === 'closed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>${closure.totalCounted.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      <span>${closure.totalExpenses.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Balance</div>
                    <div className="text-lg font-bold text-green-600">
                      ${closure.finalBalance.toLocaleString('es-AR')}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {closure.difference !== 0 && (
                <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs">
                  <AlertCircle className={`h-3 w-3 ${closure.difference < 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                  <span className="text-muted-foreground">
                    Diferencia: 
                    <span className={`font-semibold ml-1 ${closure.difference < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {closure.difference >= 0 ? '+' : ''}${closure.difference.toLocaleString('es-AR')}
                    </span>
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
