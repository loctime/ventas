"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Plus, X, AlertCircle, CheckCircle, Save } from "lucide-react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import type { DailyExpense } from "@/lib/types"
import { ClosureDateSelectorDialog } from "./closure-date-selector-dialog"
import { ClosureConflictDialog } from "./closure-conflict-dialog"
import { formatDateLong, getBusinessDay } from "@/lib/utils/business-day"

export function DailyClosureTab() {
  const { 
    todayClosure, 
    todayTransactions, 
    dailyClosures,
    saveTodayClosure, 
    closeDailyBalance,
    handleClosureConflict,
    getConflictRecommendation,
    getClosureByDate,
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
  
  // Estados para diálogo de conflictos
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictData, setConflictData] = useState<any>(null)
  
  // Estado para mostrar mensaje de datos restaurados
  const [showRestoredMessage, setShowRestoredMessage] = useState(false)
  const hasLoadedInitialData = useRef(false)
  
  // Estados para gastos frecuentes
  const [frequentExpenses, setFrequentExpenses] = useState<{[key: string]: number}>({})
  const [showExpenseSuggestions, setShowExpenseSuggestions] = useState(false)
  const [showInputSuggestions, setShowInputSuggestions] = useState(false)

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
  
  // Calcular balance final - usar datos del cierre guardado si el día está cerrado
  const finalBalance = todayClosure?.status === 'closed' 
    ? (todayClosure.totalCounted - todayClosure.totalExpenses)
    : (totalCounted - totalExpenses)

  // Función para obtener gastos frecuentes del historial
  const getFrequentExpenses = useCallback(() => {
    if (!dailyClosures || dailyClosures.length === 0) return {}

    const expenseCount: {[key: string]: {count: number, lastAmount: number}} = {}
    
    // Analizar todos los cierres históricos
    dailyClosures.forEach(closure => {
      closure.expenses.forEach(expense => {
        const key = expense.description.toLowerCase().trim()
        if (expenseCount[key]) {
          expenseCount[key].count += 1
          expenseCount[key].lastAmount = expense.amount
        } else {
          expenseCount[key] = {
            count: 1,
            lastAmount: expense.amount
          }
        }
      })
    })

    // Filtrar gastos que aparecen al menos 2 veces y convertir a formato simple
    const frequent: {[key: string]: number} = {}
    Object.entries(expenseCount).forEach(([description, data]) => {
      if (data.count >= 2) {
        // Capitalizar primera letra de cada palabra
        const capitalizedDescription = description
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        frequent[capitalizedDescription] = data.lastAmount
      }
    })

    return frequent
  }, [dailyClosures])

  // Cargar datos existentes si hay un cierre guardado
  useEffect(() => {
    if (todayClosure && todayClosure.status === 'open') {
      // Solo cargar y mostrar mensaje si es la primera vez o si hay datos previos guardados
      const hasExistingData = todayClosure.cashCounted > 0 || 
                             todayClosure.cardCounted > 0 || 
                             todayClosure.transferCounted > 0 || 
                             todayClosure.expenses.length > 0
      
      // Solo actualizar estados si no hemos cargado datos aún O si los valores son diferentes
      const isDifferent = 
        cashCounted !== todayClosure.cashCounted ||
        cardCounted !== todayClosure.cardCounted ||
        transferCounted !== todayClosure.transferCounted ||
        expenses.length !== todayClosure.expenses.length ||
        note !== (todayClosure.note || "")
      
      if (!hasLoadedInitialData.current && hasExistingData) {
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
        
        hasLoadedInitialData.current = true
      } else if (hasLoadedInitialData.current && isDifferent && !hasExistingData) {
        // Si ya habíamos cargado datos y ahora no hay datos, resetear el flag
        hasLoadedInitialData.current = false
      }
    } else if (!todayClosure || todayClosure.status !== 'open') {
      // Resetear el flag cuando no hay cierre abierto
      hasLoadedInitialData.current = false
    }
  }, [todayClosure])

  // Cargar gastos frecuentes cuando se cargan los cierres
  useEffect(() => {
    const frequent = getFrequentExpenses()
    setFrequentExpenses(frequent)
  }, [getFrequentExpenses])

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

  // Función para agregar gasto frecuente
  const handleQuickExpense = (description: string, amount: number) => {
    const newExpense: DailyExpense = {
      id: crypto.randomUUID(),
      description,
      amount
    }
    setExpenses(prev => [...prev, newExpense])
    
    // Actualizar el monto más reciente para este gasto frecuente
    setFrequentExpenses(prev => ({
      ...prev,
      [description]: amount
    }))
  }

  // Función para obtener sugerencias basadas en el input
  const getInputSuggestions = () => {
    if (!newExpenseDesc || newExpenseDesc.length < 2) return []
    
    const query = newExpenseDesc.toLowerCase().trim()
    return Object.entries(frequentExpenses).filter(([description]) =>
      description.toLowerCase().includes(query)
    )
  }

  // Función para seleccionar sugerencia del input
  const handleSelectSuggestion = (description: string, amount: number) => {
    setNewExpenseDesc(description)
    setNewExpenseAmount(amount.toString())
    setShowInputSuggestions(false)
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

    // Verificar si ya existe un cierre para esta fecha
    console.log('🔍 Iniciando verificación de conflicto para fecha:', suggestions.suggestedDate)
    const existingClosure = await checkExistingClosure(suggestions.suggestedDate)
    
    console.log('🔍 Verificando conflicto:', {
      date: suggestions.suggestedDate,
      existingClosure,
      status: existingClosure?.status,
      shouldShowDialog: existingClosure && existingClosure.status === 'closed',
      allClosures: dailyClosures.map(c => ({ date: c.date, status: c.status }))
    })
    
    if (existingClosure && existingClosure.status === 'closed') {
      // Hay un conflicto, mostrar diálogo
      const recommendation = getConflictRecommendation(existingClosure)
      console.log('⚠️ Conflicto detectado, mostrando diálogo:', recommendation)
      
      setConflictData({
        existingClosure,
        newClosureData: {
          ...closureData,
          finalBalance: (cashCounted + cardCounted + transferCounted) - expenses.reduce((sum, e) => sum + e.amount, 0)
        },
        recommendedAction: recommendation
      })
      setShowConflictDialog(true)
      return
    } else {
      console.log('✅ No hay conflicto, procediendo con cierre normal')
    }

    // Si no hay conflicto, cerrar directamente
    await finalizeClosure(closureData, suggestions.suggestedDate)
  }

  // Función para verificar si existe un cierre para una fecha
  const checkExistingClosure = async (dateStr: string) => {
    return await getClosureByDate(dateStr)
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

  const handleDateSelected = async (selectedDate: string) => {
    if (pendingClosure) {
      console.log('📅 Fecha seleccionada:', selectedDate)
      
      // Verificar si ya existe un cierre para esta fecha
      const existingClosure = await checkExistingClosure(selectedDate)
      
      console.log('🔍 Verificando conflicto para fecha seleccionada:', {
        date: selectedDate,
        existingClosure,
        status: existingClosure?.status
      })
      
      if (existingClosure && existingClosure.status === 'closed') {
        // Hay un conflicto, mostrar diálogo
        const recommendation = getConflictRecommendation(existingClosure)
        console.log('⚠️ Conflicto detectado en fecha seleccionada:', recommendation)
        
        setConflictData({
          existingClosure,
          newClosureData: {
            ...pendingClosure,
            finalBalance: (pendingClosure.cashCounted + pendingClosure.cardCounted + pendingClosure.transferCounted) - pendingClosure.expenses.reduce((sum, e) => sum + e.amount, 0),
            closureDate: selectedDate
          },
          recommendedAction: recommendation
        })
        setShowConflictDialog(true)
        setShowDateSelector(false)
        setPendingClosure(null)
        return
      }
      
      // Si no hay conflicto, proceder normalmente
      finalizeClosure(pendingClosure, selectedDate)
    }
  }

  // Manejar confirmación de conflicto
  const handleConflictConfirm = async (action: string, rememberChoice: boolean) => {
    if (!conflictData) return

    try {
      await handleClosureConflict(
        action,
        {
          ...conflictData.newClosureData,
          closureDate: activeWorkingDay
        },
        conflictData.existingClosure,
        rememberChoice
      )
      
      // Solo limpiar formulario si NO es modo "edit"
      if (action !== 'edit') {
        setCashCounted(0)
        setCardCounted(0)
        setTransferCounted(0)
        setExpenses([])
        setNote("")
      }
      
      // Cerrar diálogos
      setShowConflictDialog(false)
      setConflictData(null)
    } catch (error) {
      console.error('Error al manejar conflicto:', error)
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
                ⚠️ <strong>Cancelar Cierre:</strong> Elimina el cierre del historial y reinicia el formulario
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
              inputMode="decimal"
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
              inputMode="decimal"
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
              inputMode="decimal"
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

        {/* Gastos frecuentes */}
        {Object.keys(frequentExpenses).length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">Gastos Frecuentes</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExpenseSuggestions(!showExpenseSuggestions)}
                className="text-xs"
              >
                {showExpenseSuggestions ? 'Ocultar' : 'Mostrar'} ({Object.keys(frequentExpenses).length})
              </Button>
            </div>
            
            {showExpenseSuggestions && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(frequentExpenses).map(([description, lastAmount]) => (
                  <Button
                    key={description}
                    variant="outline"
                    onClick={() => handleQuickExpense(description, lastAmount)}
                    className="h-auto p-3 flex flex-col items-start gap-1 modern-button"
                  >
                    <span className="font-medium text-left">{description}</span>
                    <span className="text-xs text-muted-foreground">
                      Último: ${lastAmount.toLocaleString('es-AR')}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agregar nuevo gasto */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Descripción del gasto"
                  value={newExpenseDesc}
                  onChange={(e) => {
                    setNewExpenseDesc(e.target.value)
                    setShowInputSuggestions(e.target.value.length >= 2)
                  }}
                  onFocus={() => setShowInputSuggestions(newExpenseDesc.length >= 2)}
                  onBlur={() => setTimeout(() => setShowInputSuggestions(false), 200)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
                  className="modern-input"
                />
                
                {/* Sugerencias en tiempo real */}
                {showInputSuggestions && getInputSuggestions().length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {getInputSuggestions().map(([description, amount]) => (
                      <button
                        key={description}
                        onClick={() => handleSelectSuggestion(description, amount)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                      >
                        <div className="font-medium">{description}</div>
                        <div className="text-xs text-muted-foreground">
                          Último: ${amount.toLocaleString('es-AR')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input
                type="number"
                inputMode="decimal"
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

      {/* Diálogo de conflicto de cierres */}
      {showConflictDialog && conflictData && (
        <ClosureConflictDialog
          open={showConflictDialog}
          existingClosure={conflictData.existingClosure}
          newClosureData={conflictData.newClosureData}
          recommendedAction={conflictData.recommendedAction}
          onClose={() => {
            setShowConflictDialog(false)
            setConflictData(null)
          }}
          onConfirm={handleConflictConfirm}
        />
      )}
    </div>
  )
}

