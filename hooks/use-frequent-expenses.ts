import { useCallback, useEffect, useState } from "react"
import type { DailyClosure } from "@/lib/types"

export function useFrequentExpenses(dailyClosures: DailyClosure[]) {
  const [frequentExpenses, setFrequentExpenses] = useState<{[key: string]: number}>({})

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

  useEffect(() => {
    const frequent = getFrequentExpenses()
    setFrequentExpenses(frequent)
  }, [getFrequentExpenses])

  return frequentExpenses
}

