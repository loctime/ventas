"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Plus, X, AlertCircle, CheckCircle, Save } from "lucide-react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import type { DailyExpense } from "@/lib/types"
import { ClosureDateSelectorDialog } from "./closure-date-selector-dialog"
import { formatDateLong, getBusinessDay } from "@/lib/utils/business-day"

export function DailyClosureTab() {
  const { 
    todayClosure, 
    todayTransactions, 
    saveTodayClosure, 
    closeDailyBalance,
    loading,
    activeWorkingDay,
    isExtendedHours,
    getClosureSuggestions,
    businessDayCutoff,
    forceStartNewDay,
    cancelDayClosure,
  } = useFirestoreCashflow()

  const [cashCounted, setCashCounted] = useState(0)
  const [cardCounted, setCardCounted] = useState(0)
  const [transferCounted, setTransferCounted] = useState(0)
  const [expenses, setExpenses] = useState<DailyExpense[]>([])
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Campos para agregar nuevo gasto
  const [newExpenseDesc, setNewExpenseDesc] = useState("")
  const [newExpenseAmount, setNewExpenseAmount] = useState("")

  // Estados para selector de fecha
  const [showDateSelector, setShowDateSelector] = useState(false)
  const [pendingClosure, setPendingClosure] = useState<any>(null)
  
  // Estado para mostrar mensaje de datos restaurados
  const [showRestoredMessage, setShowRestoredMessage] = useState(false)

  // Calcular totales de transacciones registradas
  const registeredCollections = todayTransactions.filter(t => t.type === 'collection')
  const registeredPayments = todayTransactions.filter(t => t.type === 'payment')
  
  const registeredCash = registeredCollections
    .filter(t => t.category === 'Efectivo' || t.category === 'cash')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const registeredCard = registeredCollections
    .filter(t => t.category === 'Tarjeta' || t.category === 'card')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const registeredTransfer = registeredCollections
    .filter(t => t.category === 'Transferencia' || t.category === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const registeredTotal = registeredCollections.reduce((sum, t) => sum + t.amount, 0)
  const registeredExpenses = registeredPayments.reduce((sum, t) => sum + t.amount, 0)

  // Calcular totales del cierre
  const totalCounted = cashCounted + cardCounted + transferCounted
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const difference = totalCounted - registeredTotal
  const finalBalance = totalCounted - totalExpenses

  // Cargar datos existentes si hay un cierre guardado
  useEffect(() => {
    if (todayClosure && todayClosure.status === 'open') {
      setCashCounted(todayClosure.cashCounted)
      setCardCounted(todayClosure.cardCounted)
      setTransferCounted(todayClosure.transferCounted)
      setExpenses(todayClosure.expenses)
      setNote(todayClosure.note || "")
      setLastSaved(new Date(todayClosure.createdAt || Date.now()))
      
      console.log('📝 Datos del cierre cargados para edición:', {
        cashCounted: todayClosure.cashCounted,
        cardCounted: todayClosure.cardCounted,
        transferCounted: todayClosure.transferCounted,
        expenses: todayClosure.expenses.length,
        note: todayClosure.note
      })
      
      // Mostrar mensaje de datos restaurados por 5 segundos
      setShowRestoredMessage(true)
      setTimeout(() => setShowRestoredMessage(false), 5000)
    }
  }, [todayClosure])

  // Auto-guardar cada 3 segundos cuando hay cambios
  useEffect(() => {
    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Si el día ya está cerrado, no auto-guardar
    if (todayClosure?.status === 'closed') {
      return
    }

    // Solo auto-guardar si hay algún valor ingresado
    const hasData = cashCounted > 0 || cardCounted > 0 || transferCounted > 0 || expenses.length > 0

    if (hasData) {
      saveTimeoutRef.current = setTimeout(async () => {
        setAutoSaving(true)
        try {
          await saveTodayClosure({
            cashCounted,
            cardCounted,
            transferCounted,
            expenses,
            note
          })
          setLastSaved(new Date())
        } catch (error) {
          console.error('Error al auto-guardar:', error)
        } finally {
          setAutoSaving(false)
        }
      }, 3000) // 3 segundos de delay
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [cashCounted, cardCounted, transferCounted, expenses, note, todayClosure?.status, saveTodayClosure])

  const handleAddExpense = () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount) return

    const expense: DailyExpense = {
      id: Date.now().toString(),
      description: newExpenseDesc.trim(),
      amount: parseFloat(newExpenseAmount)
    }

    setExpenses([...expenses, expense])
    setNewExpenseDesc("")
    setNewExpenseAmount("")
  }

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const handleFinalize = async () => {
    // Preparar datos del cierre
    const closureData = {
      cashCounted,
      cardCounted,
      transferCounted,
      expenses,
      note
    }

    // Obtener sugerencias de fecha
    const suggestions = getClosureSuggestions()

    // Si hay fecha alternativa (estamos después de medianoche), mostrar selector
    if (suggestions.alternateDate) {
      setPendingClosure(closureData)
      setShowDateSelector(true)
      return
    }

    // Si no hay alternativa, cerrar directamente
    await finalizeClosure(closureData, suggestions.suggestedDate)
  }

  const finalizeClosure = async (closureData: any, selectedDate: string) => {
    if (!confirm(`¿Estás seguro de finalizar el día ${formatDateLong(selectedDate)}? Esta acción no se puede deshacer.`)) {
      return
    }

    setSaving(true)
    try {
      await saveTodayClosure({
        ...closureData,
        closureDate: selectedDate
      })
      await closeDailyBalance(selectedDate)
      
      // Limpiar formulario
      setCashCounted(0)
      setCardCounted(0)
      setTransferCounted(0)
      setExpenses([])
      setNote("")
      setPendingClosure(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDateSelected = (selectedDate: string) => {
    if (pendingClosure) {
      finalizeClosure(pendingClosure, selectedDate)
    }
  }

  const formatDate = (dateStr: string) => {
    // Parsear la fecha correctamente para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month es 0-indexado
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (todayClosure?.status === 'closed') {
    // Calcular cuándo comenzará el próximo día
    const getNextDayInfo = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const cutoffHour = businessDayCutoff || 4
      
      let nextDayStart: Date
      let nextDayMessage: string
      
      if (currentHour < cutoffHour) {
        // Estamos en horario extendido, el próximo día comenzará a las hora de corte
        nextDayStart = new Date(now)
        nextDayStart.setHours(cutoffHour, 0, 0, 0)
        nextDayMessage = `El próximo día comenzará a las ${cutoffHour.toString().padStart(2, '0')}:00`
      } else {
        // Estamos en horario normal, el próximo día comenzará mañana a las hora de corte
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
    const closedDate = todayClosure.date
    
    // Función para forzar inicio de nuevo día
    const handleForceStart = async () => {
      if (confirm('¿Estás seguro de iniciar un nuevo día? Esto cambiará al día comercial actual.')) {
        try {
          await forceStartNewDay()
          // Los cambios se aplicarán automáticamente via el contexto
          console.log('✅ Nuevo día iniciado exitosamente')
        } catch (error) {
          console.error('Error al forzar inicio:', error)
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          alert(`Error al iniciar nuevo día: ${errorMessage}`)
        }
      }
    }
    
    // Función para cancelar cierre
    const handleCancelClosure = async () => {
      if (confirm('⚠️ ADVERTENCIA: Esto eliminará el cierre del día del historial y permitirá editarlo nuevamente. ¿Estás seguro?')) {
        try {
          await cancelDayClosure(closedDate)
          // Los cambios se aplicarán automáticamente via el contexto
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
                Día cerrado: {formatDate(closedDate)}
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                {formatDateLong(closedDate)}
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
                ⚠️ <strong>Cancelar Cierre:</strong> Restaura los datos para editarlos nuevamente
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        {/* Mensaje de datos restaurados */}
        {showRestoredMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                ✅ Datos restaurados - Puedes editar el cierre nuevamente
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold big-number">Cierre del Día </h2>
            <p className="text-muted-foreground capitalize">
              {activeWorkingDay ? formatDate(activeWorkingDay) : 'Cargando...'}
            </p>
            {/* Advertencia de horario extendido */}
            {isExtendedHours && activeWorkingDay && (
              <div className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>
                  Horario extendido - Fecha actual: {new Date().toLocaleDateString('es-ES')}
                </span>
              </div>
            )}
          </div>
          
          {/* Indicador de auto-guardado */}
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {autoSaving ? (
              <>
                <Save className="h-3 w-3 animate-pulse" />
                <span>Guardando...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Guardado {lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Ingresos del día */}
      <Card className="modern-card p-6 scale-hover">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="floating-icon">💰</span>
          Ingresos del Día
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">💵 Efectivo</label>
            <Input
              type="number"
              value={cashCounted || ""}
              onChange={(e) => setCashCounted(parseFloat(e.target.value) || 0)}
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
              value={cardCounted || ""}
              onChange={(e) => setCardCounted(parseFloat(e.target.value) || 0)}
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
              value={transferCounted || ""}
              onChange={(e) => setTransferCounted(parseFloat(e.target.value) || 0)}
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

      {/* Gastos del día */}
      <Card className="modern-card p-6 scale-hover">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="floating-icon">📝</span>
          Gastos del Día
        </h3>

        {/* Agregar nuevo gasto */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Descripción del gasto"
              value={newExpenseDesc}
              onChange={(e) => setNewExpenseDesc(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
              className="modern-input"
            />
            <Input
              type="number"
              placeholder="Monto"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
              className="w-32 modern-input"
            />
            <Button onClick={handleAddExpense} size="icon" className="modern-button">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista de gastos */}
        <div className="space-y-2 mb-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">{expense.description}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">${expense.amount.toLocaleString('es-AR')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveExpense(expense.id)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {expenses.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay gastos agregados
            </p>
          )}
        </div>

        {registeredExpenses > 0 && (
          <div className="text-xs text-muted-foreground mb-2">
            Gastos registrados anteriormente: ${registeredExpenses.toLocaleString('es-AR')}
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Gastos:</span>
            <span className="danger-gradient">${totalExpenses.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </Card>

        {/* Comparación con ventas registradas (opcional) */}
      {registeredTotal > 0 && (
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
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Propina que di, venta no registrada, etc."
                rows={3}
              />
            </div>
          )}
        </Card>
      )}

      {/* Resumen final */}
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

      {/* Botón de acción */}
      <Button
        onClick={handleFinalize}
        disabled={saving || loading || totalCounted === 0}
        className="w-full modern-button text-lg py-6"
        size="lg"
      >
        {saving ? "Finalizando..." : "✓ Finalizar Día"}
      </Button>

      {todayTransactions.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {todayTransactions.length} transacción{todayTransactions.length !== 1 ? 'es' : ''} registrada{todayTransactions.length !== 1 ? 's' : ''} hoy
        </div>
      )}

      {/* Diálogo de selección de fecha */}
      {showDateSelector && (
        <ClosureDateSelectorDialog
          open={showDateSelector}
          onClose={() => {
            setShowDateSelector(false)
            setPendingClosure(null)
          }}
          {...getClosureSuggestions()}
          onConfirm={handleDateSelected}
        />
      )}
    </div>
  )
}

