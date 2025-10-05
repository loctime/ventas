import type { Transaction } from "../firestore-service"

export function calculateTotals(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.type === "collection").reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === "payment").reduce((sum, t) => sum + t.amount, 0)

  return {
    income,
    expenses,
    balance: income - expenses,
  }
}

export function groupTransactionsByPeriod(transactions: Transaction[], period: "day" | "week" | "month" | "year") {
  const grouped = new Map<string, Transaction[]>()

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date)
    let key: string

    switch (period) {
      case "day":
        key = date.toLocaleDateString()
        break
      case "week":
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toLocaleDateString()
        break
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        break
      case "year":
        key = String(date.getFullYear())
        break
    }

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(transaction)
  })

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([period, transactions]) => ({
      period,
      transactions: transactions.sort((a, b) => b.date.getTime() - a.date.getTime()),
      totals: calculateTotals(transactions),
    }))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}
