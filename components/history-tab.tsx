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
  ChevronDown,
  ArrowLeft,
  Calendar
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { DailyClosure } from "@/lib/types"

// Tipos para la agrupación
interface DayGroup {
  date: string
  closure: DailyClosure
}

interface WeekGroup {
  weekNumber: number
  weekLabel: string
  days: DayGroup[]
  totalIncome: number
  totalExpenses: number
  totalBalance: number
}

interface MonthGroup {
  monthKey: string
  monthLabel: string
  year: number
  weeks: WeekGroup[]
  totalIncome: number
  totalExpenses: number
  totalBalance: number
}

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

  // Obtener el número de semana del mes (1-4 o 5)
  const getWeekOfMonth = (date: Date): number => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const dayOfMonth = date.getDate()
    const dayOfWeek = firstDayOfMonth.getDay()
    
    return Math.ceil((dayOfMonth + dayOfWeek) / 7)
  }

  // Agrupar cierres por Mes > Semana > Día
  const groupClosuresByPeriod = (): MonthGroup[] => {
    const groups: { [key: string]: MonthGroup } = {}

    dailyClosures.forEach((closure) => {
      const date = new Date(closure.date)
      const year = date.getFullYear()
      const month = date.getMonth()
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      const weekNumber = getWeekOfMonth(date)
      
      // Crear grupo de mes si no existe
      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey,
          monthLabel,
          year,
          weeks: [],
          totalIncome: 0,
          totalExpenses: 0,
          totalBalance: 0
        }
      }

      // Buscar o crear semana
      let week = groups[monthKey].weeks.find(w => w.weekNumber === weekNumber)
      if (!week) {
        week = {
          weekNumber,
          weekLabel: `Semana ${weekNumber}`,
          days: [],
          totalIncome: 0,
          totalExpenses: 0,
          totalBalance: 0
        }
        groups[monthKey].weeks.push(week)
      }

      // Agregar día
      week.days.push({
        date: closure.date,
        closure
      })

      // Acumular totales
      week.totalIncome += closure.totalCounted
      week.totalExpenses += closure.totalExpenses
      week.totalBalance += closure.finalBalance

      groups[monthKey].totalIncome += closure.totalCounted
      groups[monthKey].totalExpenses += closure.totalExpenses
      groups[monthKey].totalBalance += closure.finalBalance
    })

    // Convertir a array y ordenar
    const result = Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    
    // Ordenar semanas dentro de cada mes
    result.forEach(month => {
      month.weeks.sort((a, b) => b.weekNumber - a.weekNumber)
      // Ordenar días dentro de cada semana
      month.weeks.forEach(week => {
        week.days.sort((a, b) => b.date.localeCompare(a.date))
      })
    })

    return result
  }

  const groupedData = groupClosuresByPeriod()

  if (selectedClosure) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <Button 
          variant="ghost" 
          onClick={() => setSelectedClosure(null)}
          className="mb-2 modern-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div>
          <h2 className="text-2xl font-bold capitalize big-number">{formatDate(selectedClosure.date)}</h2>
          <p className="text-muted-foreground">
            {selectedClosure.status === 'closed' ? 'Día cerrado' : 'Día abierto'}
          </p>
        </div>

        {/* Ingresos detallados */}
        <Card className="modern-card pt-3 px-6 pb-6 scale-hover">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="floating-icon">💰</span>
            Ingresos del Día
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
              <span className="success-gradient">${selectedClosure.totalCounted.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </Card>

        {/* Gastos */}
        <Card className="modern-card p-6 scale-hover">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="floating-icon">📝</span>
            Gastos del Día
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
                <span className="danger-gradient">${selectedClosure.totalExpenses.toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Verificación */}
        {selectedClosure.workModeTotal > 0 && (
          <Card className="modern-card p-6 scale-hover">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="floating-icon">📊</span>
              Verificación
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
        <Card className="modern-card p-6 bg-gradient-to-br from-green-50 to-blue-50 scale-hover">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Balance del Día</h3>
            <div className="text-3xl font-bold success-gradient">
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
        <h2 className="text-2xl font-bold big-number">Historial de Cierres</h2>
        <p className="text-muted-foreground">Organizado por mes, semana y día</p>
      </div>

      {loading && (
        <Card className="modern-card p-8 text-center scale-hover">
          <p className="text-muted-foreground">Cargando...</p>
        </Card>
      )}

      {!loading && dailyClosures.length === 0 && (
        <Card className="modern-card p-8 text-center scale-hover">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4 floating-icon" />
          <p className="text-muted-foreground">No hay cierres registrados aún</p>
          <p className="text-sm text-muted-foreground mt-2">
            Los cierres diarios aparecerán aquí organizados por mes y semana
          </p>
        </Card>
      )}

      {!loading && groupedData.length > 0 && (
        <div className="space-y-4">
          {groupedData.map((month) => (
            <Collapsible key={month.monthKey} defaultOpen={groupedData.indexOf(month) === 0}>
              <Card className="modern-card overflow-hidden scale-hover">
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 hover:bg-accent transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <h3 className="text-lg font-bold capitalize">{month.monthLabel}</h3>
                          <p className="text-xs text-muted-foreground">
                            {month.weeks.length} {month.weeks.length === 1 ? 'semana' : 'semanas'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Balance Total</div>
                          <div className="text-xl font-bold text-green-600">
                            ${month.totalBalance.toLocaleString('es-AR')}
                          </div>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </div>
                    
                    <div className="flex gap-6 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Ingresos:</span>
                        <span className="font-semibold">${month.totalIncome.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">Gastos:</span>
                        <span className="font-semibold">${month.totalExpenses.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t bg-muted/30 p-4 space-y-3">
                    {month.weeks.map((week) => (
                      <Collapsible key={`${month.monthKey}-week-${week.weekNumber}`}>
                        <Card className="modern-card overflow-hidden scale-hover">
                          <CollapsibleTrigger className="w-full">
                            <div className="p-3 hover:bg-white/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-primary" />
                                  <div className="text-left">
                                    <h4 className="font-semibold">{week.weekLabel}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {week.days.length} {week.days.length === 1 ? 'día' : 'días'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Balance</div>
                                    <div className="text-lg font-bold text-green-600">
                                      ${week.totalBalance.toLocaleString('es-AR')}
                                    </div>
                                  </div>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t bg-background p-3 space-y-2">
                              {week.days.map((day) => (
                                <Card 
                                  key={day.closure.id}
                                  className="modern-card p-3 cursor-pointer hover:bg-white/50 transition-colors scale-hover"
                                  onClick={() => setSelectedClosure(day.closure)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold capitalize text-sm">
                                          {formatShortDate(day.closure.date)}
                                        </span>
                                        {day.closure.status === 'closed' ? (
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                                        )}
                                      </div>
                                      
                                      <div className="flex gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <TrendingUp className="h-3 w-3" />
                                          <span>${day.closure.totalCounted.toLocaleString('es-AR')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <TrendingDown className="h-3 w-3" />
                                          <span>${day.closure.totalExpenses.toLocaleString('es-AR')}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <div className="text-xs text-muted-foreground">Balance</div>
                                        <div className="font-bold text-green-600">
                                          ${day.closure.finalBalance.toLocaleString('es-AR')}
                                        </div>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </div>

                                  {day.closure.difference !== 0 && (
                                    <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs">
                                      <AlertCircle className={`h-3 w-3 ${day.closure.difference < 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                                      <span className="text-muted-foreground">
                                        Diferencia: 
                                        <span className={`font-semibold ml-1 ${day.closure.difference < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                          {day.closure.difference >= 0 ? '+' : ''}${day.closure.difference.toLocaleString('es-AR')}
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}
