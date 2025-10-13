"use client"

import { useState } from "react"
import { DailyClosureTab } from "@/components/daily-closure-tab"
import { HistoryTab } from "@/components/history-tab"
import { FirestoreCashflowProvider } from "@/contexts/firestore-cashflow-context"
import { LoginPage } from "@/components/login-page"
import { UserHeader } from "@/components/user-header"
import { useAuth } from "@/contexts/auth-context"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { DollarSign, History } from "lucide-react"

type Tab = "closure" | "history"

export default function CashflowApp() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("closure")
  const { isInstallable, isInstalled, installPWA } = usePWAInstall()

  const handleInstallClick = async () => {
    const installed = await installPWA()
    if (installed) {
      console.log("PWA instalada exitosamente")
    }
  }

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Mostrar login si no está autenticado
  if (!user) {
    return <LoginPage />
  }

  return (
    <FirestoreCashflowProvider>
      <div className="min-h-screen flex flex-col">
        {/* Header con usuario */}
        <UserHeader 
          showInstallButton={!isInstalled && isInstallable}
          onInstallClick={handleInstallClick}
        />

        {/* Main Content */}
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-6">
          {activeTab === "closure" && <DailyClosureTab />}
          {activeTab === "history" && <HistoryTab />}
        </main>

        {/* Bottom Navigation - Super Simple */}
        <nav className="bg-card border-t sticky bottom-0 z-40">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-2 gap-3 py-3">
              <button
                onClick={() => setActiveTab("closure")}
                className={`flex flex-col items-center gap-2 py-4 px-4 rounded-lg transition-colors ${
                  activeTab === "closure"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <DollarSign className="h-7 w-7" />
                <span className="text-sm font-semibold">Cierre del Día</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex flex-col items-center gap-2 py-4 px-4 rounded-lg transition-colors ${
                  activeTab === "history"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <History className="h-7 w-7" />
                <span className="text-sm font-semibold">Historial</span>
              </button>
            </div>
          </div>
        </nav>

      </div>
    </FirestoreCashflowProvider>
  )
}
