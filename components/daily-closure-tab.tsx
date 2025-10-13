"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Plus, X, AlertCircle, CheckCircle, Save } from "lucide-react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import type { DailyExpense } from "@/lib/types"

export function DailyClosureTab() {
  const { 
    todayClosure, 
    todayTransactions, 
    saveTodayClosure, 
    closeDailyBalance,
    loading 
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

  // Calcular totales de Work Mode
  const workModeCollections = todayTransactions.filter(t => t.type === 'collection')
  const workModePayments = todayTransactions.filter(t => t.type === 'payment')
  
  const workModeCash = workModeCollections
    .filter(t => t.category === 'Efectivo' || t.category === 'cash')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const workModeCard = workModeCollections
    .filter(t => t.category === 'Tarjeta' || t.category === 'card')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const workModeTransfer = workModeCollections
    .filter(t => t.category === 'Transferencia' || t.category === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const workModeTotal = workModeCollections.reduce((sum, t) => sum + t.amount, 0)
  const workModeExpenses = workModePayments.reduce((sum, t) => sum + t.amount, 0)

  // Calcular totales del cierre
  const totalCounted = cashCounted + cardCounted + transferCounted
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const difference = totalCounted - workModeTotal
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
    if (!confirm("¿Estás seguro de finalizar el día? Esta acción no se puede deshacer.")) {
      return
    }

    setSaving(true)
    try {
      await saveTodayClosure({
        cashCounted,
        cardCounted,
        transferCounted,
        expenses,
        note
      })
      await closeDailyBalance()
      
      // Limpiar formulario
      setCashCounted(0)
      setCardCounted(0)
      setTransferCounted(0)
      setExpenses([])
      setNote("")
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  if (todayClosure?.status === 'closed') {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Día Cerrado</h2>
            <p className="text-muted-foreground">
              El día ya fue finalizado. Los cambios no se pueden realizar.
            </p>
            <div className="pt-4">
              <div className="text-4xl font-bold text-green-600">
                ${finalBalance.toLocaleString('es-AR')}
              </div>
              <p className="text-sm text-muted-foreground">Balance del día</p>
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
            <h2 className="text-2xl font-bold">Cierre del Día</h2>
            <p className="text-muted-foreground capitalize">{today}</p>
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
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          💰 Ingresos del Día
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">💵 Efectivo</label>
            <Input
              type="number"
              value={cashCounted || ""}
              onChange={(e) => setCashCounted(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="text-lg"
            />
            {workModeCash > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Registrado en Work Mode: ${workModeCash.toLocaleString('es-AR')}
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
              className="text-lg"
            />
            {workModeCard > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Registrado en Work Mode: ${workModeCard.toLocaleString('es-AR')}
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
              className="text-lg"
            />
            {workModeTransfer > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Registrado en Work Mode: ${workModeTransfer.toLocaleString('es-AR')}
              </p>
            )}
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Ingresos:</span>
              <span>${totalCounted.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Gastos del día */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📝 Gastos del Día
        </h3>

        {/* Agregar nuevo gasto */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Descripción del gasto"
              value={newExpenseDesc}
              onChange={(e) => setNewExpenseDesc(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
            />
            <Input
              type="number"
              placeholder="Monto"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
              className="w-32"
            />
            <Button onClick={handleAddExpense} size="icon">
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

        {workModeExpenses > 0 && (
          <div className="text-xs text-muted-foreground mb-2">
            Gastos registrados en Work Mode: ${workModeExpenses.toLocaleString('es-AR')}
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Gastos:</span>
            <span className="text-red-600">${totalExpenses.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </Card>

      {/* Comparación con Work Mode */}
      {workModeTotal > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📊 Comparación con Work Mode
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Registrado en Work Mode:</span>
              <span className="font-semibold">${workModeTotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Conteo Real:</span>
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
      <Card className="p-6 bg-primary/5">
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span>Total Ingresos:</span>
            <span className="font-semibold">${totalCounted.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Total Gastos:</span>
            <span className="font-semibold text-red-600">-${totalExpenses.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold pt-3 border-t-2">
            <span>Balance del Día:</span>
            <span className="text-green-600">${finalBalance.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </Card>

      {/* Botón de acción */}
      <Button
        onClick={handleFinalize}
        disabled={saving || loading || totalCounted === 0}
        className="w-full"
        size="lg"
      >
        {saving ? "Finalizando..." : "✓ Finalizar Día"}
      </Button>

      {todayTransactions.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {todayTransactions.length} transacciones registradas en Work Mode hoy
        </div>
      )}
    </div>
  )
}

