"use client"

import { useState } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Plus, X } from "lucide-react"
import type { DailyExpense } from "@/lib/types"

interface DailyExpensesSectionProps {
  expenses: DailyExpense[]
  frequentExpenses: {[key: string]: number}
  registeredExpenses: number
  onAddExpense: (description: string, amount: number) => void
  onRemoveExpense: (id: string) => void
  onQuickExpense: (description: string, amount: number) => void
}

export function DailyExpensesSection({
  expenses,
  frequentExpenses,
  registeredExpenses,
  onAddExpense,
  onRemoveExpense,
  onQuickExpense
}: DailyExpensesSectionProps) {
  const [newExpenseDesc, setNewExpenseDesc] = useState("")
  const [newExpenseAmount, setNewExpenseAmount] = useState("")
  const [showExpenseSuggestions, setShowExpenseSuggestions] = useState(false)
  const [showInputSuggestions, setShowInputSuggestions] = useState(false)

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const handleAddExpense = () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount) return

    onAddExpense(newExpenseDesc.trim(), parseFloat(newExpenseAmount))
    setNewExpenseDesc("")
    setNewExpenseAmount("")
  }

  const getInputSuggestions = () => {
    if (!newExpenseDesc || newExpenseDesc.length < 2) return []
    
    const query = newExpenseDesc.toLowerCase().trim()
    return Object.entries(frequentExpenses).filter(([description]) =>
      description.toLowerCase().includes(query)
    )
  }

  const handleSelectSuggestion = (description: string, amount: number) => {
    setNewExpenseDesc(description)
    setNewExpenseAmount(amount.toString())
    setShowInputSuggestions(false)
  }

  return (
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
                  onClick={() => onQuickExpense(description, lastAmount)}
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
                onClick={() => onRemoveExpense(expense.id)}
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
  )
}

