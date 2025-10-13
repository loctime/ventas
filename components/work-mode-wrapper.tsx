"use client"

import { useState } from "react"
import { CollectionsTab } from "./collections-tab"
import { PaymentsTab } from "./payments-tab"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import { Card } from "./ui/card"

type WorkModeTab = "collections" | "payments"

export function WorkModeWrapper() {
  const [activeTab, setActiveTab] = useState<WorkModeTab>("collections")
  const { todayTransactions } = useFirestoreCashflow()

  // Calcular totales de hoy
  const todayCollections = todayTransactions
    .filter(t => t.type === 'collection')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const todayPayments = todayTransactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0)

  const todayBalance = todayCollections - todayPayments

  return (
    <div className="space-y-4">
      {/* Banner informativo */}
      {todayCollections > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Registrado hoy en Work Mode</p>
              <p className="text-xs text-muted-foreground">
                {todayTransactions.length} transacciones
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                ${todayBalance.toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-muted-foreground">
                ${todayCollections.toLocaleString('es-AR')} - ${todayPayments.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Contenido de los tabs */}
      <div>
        {activeTab === "collections" && <CollectionsTab />}
        {activeTab === "payments" && <PaymentsTab />}
      </div>

      {/* Sub-navegación para Work Mode */}
      <div className="bg-card border rounded-lg">
        <div className="grid grid-cols-2 gap-2 p-2">
          <button
            onClick={() => setActiveTab("collections")}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
              activeTab === "collections"
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-medium">Cobros</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
              activeTab === "payments"
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingDown className="h-5 w-5" />
            <span className="text-xs font-medium">Pagos</span>
          </button>
        </div>
      </div>
    </div>
  )
}

