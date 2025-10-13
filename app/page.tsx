"use client"

import { useState } from "react"
import { DailyClosureTab } from "@/components/daily-closure-tab"
import { WorkModeWrapper } from "@/components/work-mode-wrapper"
import { HistoryTab } from "@/components/history-tab"
import { FirestoreCashflowProvider } from "@/contexts/firestore-cashflow-context"
import { LoginPage } from "@/components/login-page"
import { UserHeader } from "@/components/user-header"
import { useAuth } from "@/contexts/auth-context"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { DollarSign, Wrench, History } from "lucide-react"

type Tab = "closure" | "workmode" | "history"

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
          {activeTab === "workmode" && <WorkModeWrapper />}
          {activeTab === "history" && <HistoryTab />}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-card border-t sticky bottom-0 z-40">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-2 py-2">
              <button
                onClick={() => setActiveTab("closure")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
                  activeTab === "closure"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-xs font-medium">Cierre</span>
              </button>

              <button
                onClick={() => setActiveTab("workmode")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
                  activeTab === "workmode"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench className="h-6 w-6" />
                <span className="text-xs font-medium">Work Mode</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
                  activeTab === "history"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="h-6 w-6" />
                <span className="text-xs font-medium">Historial</span>
              </button>
            </div>
          </div>
        </nav>

      </div>
    </FirestoreCashflowProvider>
  )
}
