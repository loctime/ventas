"use client"

import { useState, useMemo } from "react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import { calculateTotals, groupTransactionsByPeriod, formatCurrency } from "@/lib/utils/firestore-calculations"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Banknote, CreditCard, ArrowRightLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import type { Transaction } from "@/lib/firestore-service"

const methodIcons: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
}

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
}

const getMethodInfo = (category: string) => {
  return {
    icon: methodIcons[category] || Banknote,
    label: methodLabels[category] || category
  }
}

export function HistoryTab() {
  const { collections, payments, loading, error } = useFirestoreCashflow()
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month")
  const [filter, setFilter] = useState<"all" | "collection" | "payment">("all")

  const allTransactions = useMemo(() => {
    const collectionsWithType = collections.map(t => ({ ...t, type: 'collection' as const }))
    const paymentsWithType = payments.map(t => ({ ...t, type: 'payment' as const }))
    return [...collectionsWithType, ...paymentsWithType].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [collections, payments])

  const filteredTransactions = useMemo(() => 
    filter === "all" ? allTransactions : allTransactions.filter((t) => t.type === filter),
    [allTransactions, filter]
  )

  const groupedTransactions = useMemo(() => 
    groupTransactionsByPeriod(filteredTransactions, period),
    [filteredTransactions, period]
  )
  
  const totals = useMemo(() => 
    calculateTotals(filteredTransactions),
    [filteredTransactions]
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-balance mb-2">Historial de Transacciones</h2>
        <p className="text-muted-foreground text-pretty">Visualiza y analiza tu flujo de caja a lo largo del tiempo</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" style={{ color: "var(--income)" }} />
            Total Ingresos
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--income)" }}>
            {formatCurrency(totals.income)}
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4" style={{ color: "var(--expense)" }} />
            Total Gastos
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--expense)" }}>
            {formatCurrency(totals.expenses)}
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Balance
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              color: totals.balance >= 0 ? "var(--income)" : "var(--expense)",
            }}
          >
            {formatCurrency(totals.balance)}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Por Día</SelectItem>
            <SelectItem value="week">Por Semana</SelectItem>
            <SelectItem value="month">Por Mes</SelectItem>
            <SelectItem value="year">Por Año</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las Transacciones</SelectItem>
            <SelectItem value="income">Solo Ingresos</SelectItem>
            <SelectItem value="expense">Solo Gastos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="space-y-6">
        {groupedTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No hay transacciones aún</p>
            <p className="text-sm text-muted-foreground mt-2">Comienza agregando cobros o pagos</p>
          </Card>
        ) : (
          groupedTransactions.map(({ period, transactions, totals }) => (
            <div key={period} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{period}</h3>
                <div className="text-sm text-muted-foreground">
                  {transactions.length} transacción{transactions.length !== 1 ? "es" : ""}
                </div>
              </div>

              <Card className="divide-y">
                {transactions.map((transaction) => {
                  const methodInfo = getMethodInfo(transaction.category)
                  const Icon = methodInfo.icon
                  const isCustomIcon = typeof Icon === "string"
                  
                  return (
                    <div key={transaction.id} className="p-4 flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: transaction.type === "income" ? "var(--income)" : "var(--expense)",
                          color:
                            transaction.type === "income" ? "var(--income-foreground)" : "var(--expense-foreground)",
                        }}
                      >
                        {isCustomIcon ? (
                          <span className="text-lg">{Icon}</span>
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{methodInfo.label}</div>
                        {transaction.note && (
                          <div className="text-sm text-muted-foreground truncate">{transaction.note}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleString("es-ES")}
                        </div>
                      </div>

                      <div
                        className="text-lg font-bold flex-shrink-0"
                        style={{
                          color: transaction.type === "income" ? "var(--income)" : "var(--expense)",
                        }}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  )
                })}
              </Card>

              <div className="flex justify-between text-sm px-2">
                <span className="text-muted-foreground">Total del Período:</span>
                <span
                  className="font-semibold"
                  style={{
                    color: totals.balance >= 0 ? "var(--income)" : "var(--expense)",
                  }}
                >
                  {formatCurrency(totals.balance)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
