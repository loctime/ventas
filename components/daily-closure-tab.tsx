"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { AlertCircle, CheckCircle, Save } from "lucide-react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import type { DailyExpense } from "@/lib/types"
import { ClosureDateSelectorDialog } from "./closure-date-selector-dialog"
import { ClosureConflictDialog } from "./closure-conflict-dialog"
import { formatDateLong } from "@/lib/utils/business-day"
import { useFrequentExpenses } from "@/hooks/use-frequent-expenses"
import { ClosedDayView } from "./closed-day-view"
import { DailyIncomeSection } from "./daily-income-section"
import { DailyExpensesSection } from "./daily-expenses-section"
import { VerificationSection } from "./verification-section"
import { ClosureSummary } from "./closure-summary"

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

  // Estados del formulario
  const [cashCounted, setCashCounted] = useState(0)
  const [cardCounted, setCardCounted] = useState(0)
  const [transferCounted, setTransferCounted] = useState(0)
  const [expenses, setExpenses] = useState<DailyExpense[]>([])
  const [note, setNote] = useState("")
  
  // Estados de guardado
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Estados para diálogos
  const [showDateSelector, setShowDateSelector] = useState(false)
  const [pendingClosure, setPendingClosure] = useState<any>(null)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictData, setConflictData] = useState<any>(null)
  
  // Estado para carga inicial
  const hasLoadedInitialData = useRef(false)

  // Hook personalizado para gastos frecuentes
  const frequentExpenses = useFrequentExpenses(dailyClosures)

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
  
  // Calcular balance final
  const finalBalance = todayClosure?.status === 'closed' 
    ? (todayClosure.totalCounted - todayClosure.totalExpenses)
    : (totalCounted - totalExpenses)

  // Cargar datos existentes si hay un cierre guardado
  useEffect(() => {
    if (todayClosure && todayClosure.status === 'open') {
      const hasExistingData = todayClosure.cashCounted > 0 || 
                             todayClosure.cardCounted > 0 || 
                             todayClosure.transferCounted > 0 || 
                             todayClosure.expenses.length > 0
      
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
        hasLoadedInitialData.current = true
      } else if (hasLoadedInitialData.current && isDifferent && !hasExistingData) {
        hasLoadedInitialData.current = false
      }
    } else if (!todayClosure || todayClosure.status !== 'open') {
      hasLoadedInitialData.current = false
    }
  }, [todayClosure])

  // Auto-guardar cada 3 segundos cuando hay cambios
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (todayClosure?.status === 'closed') {
      return
    }

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
      }, 3000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [cashCounted, cardCounted, transferCounted, expenses, note, todayClosure?.status, saveTodayClosure])

  // Handlers para gastos
  const handleAddExpense = (description: string, amount: number) => {
    const expense: DailyExpense = {
      id: Date.now().toString(),
      description,
      amount
    }
    setExpenses([...expenses, expense])
  }

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const handleQuickExpense = (description: string, amount: number) => {
    const newExpense: DailyExpense = {
      id: crypto.randomUUID(),
      description,
      amount
    }
    setExpenses(prev => [...prev, newExpense])
  }

  // Handler para finalizar cierre
  const handleFinalize = async () => {
    const closureData = {
      cashCounted,
      cardCounted,
      transferCounted,
      expenses,
      note
    }

    const suggestions = getClosureSuggestions()

    if (suggestions.alternateDate) {
      setPendingClosure(closureData)
      setShowDateSelector(true)
      return
    }

    const existingClosure = await getClosureByDate(suggestions.suggestedDate)
    
    if (existingClosure && existingClosure.status === 'closed') {
      const recommendation = getConflictRecommendation(existingClosure)
      
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
    }

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
      const existingClosure = await getClosureByDate(selectedDate)
      
      if (existingClosure && existingClosure.status === 'closed') {
        const recommendation = getConflictRecommendation(existingClosure)
        
        setConflictData({
          existingClosure,
          newClosureData: {
            ...pendingClosure,
            finalBalance: (pendingClosure.cashCounted + pendingClosure.cardCounted + pendingClosure.transferCounted) - pendingClosure.expenses.reduce((sum: number, e: DailyExpense) => sum + e.amount, 0),
            closureDate: selectedDate
          },
          recommendedAction: recommendation
        })
        setShowConflictDialog(true)
        setShowDateSelector(false)
        setPendingClosure(null)
        return
      }
      
      finalizeClosure(pendingClosure, selectedDate)
    }
  }

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
      
      if (action !== 'edit') {
        setCashCounted(0)
        setCardCounted(0)
        setTransferCounted(0)
        setExpenses([])
        setNote("")
      }
      
      setShowConflictDialog(false)
      setConflictData(null)
    } catch (error) {
      console.error('Error al manejar conflicto:', error)
    }
  }

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

  // Vista de día cerrado
  if (todayClosure?.status === 'closed') {
    return (
      <ClosedDayView
        closure={todayClosure}
        businessDayCutoff={businessDayCutoff}
        onForceStart={forceStartNewDay}
        onCancelClosure={() => cancelDayClosure(todayClosure.date)}
      />
    )
  }

  // Vista principal de cierre
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
      <DailyIncomeSection
        cashCounted={cashCounted}
        cardCounted={cardCounted}
        transferCounted={transferCounted}
        registeredCash={registeredCash}
        registeredCard={registeredCard}
        registeredTransfer={registeredTransfer}
        onCashChange={setCashCounted}
        onCardChange={setCardCounted}
        onTransferChange={setTransferCounted}
      />

      {/* Gastos del día */}
      <DailyExpensesSection
        expenses={expenses}
        frequentExpenses={frequentExpenses}
        registeredExpenses={registeredExpenses}
        onAddExpense={handleAddExpense}
        onRemoveExpense={handleRemoveExpense}
        onQuickExpense={handleQuickExpense}
      />

      {/* Verificación */}
      <VerificationSection
        registeredTotal={registeredTotal}
        totalCounted={totalCounted}
        difference={difference}
        note={note}
        onNoteChange={setNote}
      />

      {/* Resumen final */}
      <ClosureSummary
        totalCounted={totalCounted}
        totalExpenses={totalExpenses}
        finalBalance={finalBalance}
      />

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
