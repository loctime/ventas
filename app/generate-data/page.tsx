"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { FirestoreService } from "@/lib/firestore-service"
import type { DailyClosure, DailyExpense } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Calendar, Loader2, CheckCircle, AlertCircle } from "lucide-react"

// Función para generar un número aleatorio entre min y max
const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Función para generar gastos aleatorios
const generateRandomExpenses = (): DailyExpense[] => {
  const possibleExpenses = [
    { description: 'Pago proveedor', min: 5000, max: 20000 },
    { description: 'Servicios', min: 2000, max: 8000 },
    { description: 'Insumos', min: 3000, max: 15000 },
    { description: 'Mantenimiento', min: 1000, max: 5000 },
    { description: 'Combustible', min: 2000, max: 6000 },
    { description: 'Varios', min: 500, max: 3000 },
  ]

  const numExpenses = randomBetween(0, 4)
  const expenses: DailyExpense[] = []

  for (let i = 0; i < numExpenses; i++) {
    const expense = possibleExpenses[randomBetween(0, possibleExpenses.length - 1)]
    expenses.push({
      id: `expense_${Date.now()}_${i}_${Math.random()}`,
      description: expense.description,
      amount: randomBetween(expense.min, expense.max)
    })
  }

  return expenses
}

export default function GenerateDataPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)
  const [summary, setSummary] = useState<{
    totalDays: number
    totalIncome: number
    totalExpenses: number
    totalBalance: number
  } | null>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
  }

  const generateHistory = async () => {
    if (!user) {
      addLog('❌ Error: No hay usuario autenticado')
      return
    }

    setLoading(true)
    setProgress(0)
    setLogs([])
    setCompleted(false)
    setSummary(null)

    try {
      const firestoreService = new FirestoreService(user.uid)
      const today = new Date()
      const closures: Omit<DailyClosure, 'userId'>[] = []

      addLog('🚀 Iniciando generación de datos...')
      const numDays = 31
      setTotal(numDays)

      for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
        const date = new Date(today)
        date.setDate(date.getDate() - daysAgo)
        const dateStr = date.toISOString().split('T')[0]

        // Generar ingresos aleatorios con variación por día de la semana
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        
        const baseIncome = isWeekend ? 40000 : 25000
        const variance = isWeekend ? 20000 : 15000

        const totalIncome = randomBetween(baseIncome - variance, baseIncome + variance)
        const cashPercentage = randomBetween(30, 50) / 100
        const cardPercentage = randomBetween(30, 50) / 100

        const cashCounted = Math.round(totalIncome * cashPercentage)
        const cardCounted = Math.round(totalIncome * cardPercentage)
        const transferCounted = totalIncome - cashCounted - cardCounted

        const expenses = generateRandomExpenses()
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

        const hasDifference = Math.random() < 0.3
        const differenceAmount = hasDifference ? randomBetween(-2000, 3000) : 0
        const workModeTotal = totalIncome - differenceAmount

        const finalBalance = totalIncome - totalExpenses
        const status = daysAgo === 0 ? 'open' : (Math.random() < 0.9 ? 'closed' : 'open')

        const closure: Omit<DailyClosure, 'userId'> = {
          id: `${user.uid}_${dateStr}`,
          date: dateStr,
          cashCounted,
          cardCounted,
          transferCounted,
          totalCounted: totalIncome,
          expenses,
          totalExpenses,
          workModeTransactionIds: [],
          workModeTotal,
          difference: differenceAmount,
          note: hasDifference && Math.random() < 0.5 
            ? 'Diferencia justificada por ajustes de cambio'
            : undefined,
          finalBalance,
          status: status as 'open' | 'closed',
          createdAt: date.getTime(),
          closedAt: status === 'closed' ? date.getTime() + 3600000 : undefined
        }

        closures.push(closure)
        await firestoreService.saveDailyClosure(closure)
        
        setProgress(prev => prev + 1)
        addLog(`✅ ${dateStr} - Balance: $${finalBalance.toLocaleString('es-AR')}`)
        
        // Pequeña pausa para no saturar
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const summaryData = {
        totalDays: closures.length,
        totalIncome: closures.reduce((sum, c) => sum + c.totalCounted, 0),
        totalExpenses: closures.reduce((sum, c) => sum + c.totalExpenses, 0),
        totalBalance: closures.reduce((sum, c) => sum + c.finalBalance, 0)
      }

      setSummary(summaryData)
      setCompleted(true)
      addLog('🎉 ¡Generación completada exitosamente!')

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Autenticación Requerida</h2>
          <p className="text-muted-foreground mb-4">
            Debes estar autenticado para generar datos de ejemplo
          </p>
          <Button onClick={() => router.push('/')}>
            Ir al inicio
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Generar Datos de Ejemplo</h1>
            <p className="text-sm text-muted-foreground">
              Crea un mes completo de cierres diarios con datos aleatorios
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">¿Qué se generará?</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 31 días de cierres diarios (último mes)</li>
              <li>• Ingresos variables por día (más altos en fines de semana)</li>
              <li>• Distribución aleatoria entre efectivo, tarjeta y transferencias</li>
              <li>• Gastos aleatorios (0-4 gastos por día)</li>
              <li>• Algunos días con diferencias justificadas</li>
              <li>• 90% de días cerrados, 10% abiertos</li>
            </ul>
          </div>

          {!completed && (
            <Button 
              onClick={generateHistory} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando... ({progress}/{total})
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-5 w-5" />
                  Generar Historial de 1 Mes
                </>
              )}
            </Button>
          )}

          {completed && summary && (
            <div className="space-y-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    ¡Generación Completada!
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total de días:</p>
                    <p className="font-bold">{summary.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ingresos totales:</p>
                    <p className="font-bold text-green-600">
                      ${summary.totalIncome.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gastos totales:</p>
                    <p className="font-bold text-red-600">
                      ${summary.totalExpenses.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance final:</p>
                    <p className="font-bold text-green-600">
                      ${summary.totalBalance.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push('/')} 
                  className="flex-1"
                >
                  Ver Historial
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="flex-1"
                >
                  Generar Nuevamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {logs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Log de Generación</h3>
          <div className="bg-muted rounded p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

