"use client"

import { useState } from "react"
import { DailyClosureTab } from "@/components/daily-closure-tab"
import { HistoryTab } from "@/components/history-tab"
import { SettingsTab } from "@/components/settings-tab"
import { FirestoreCashflowProvider } from "@/contexts/firestore-cashflow-context"
import { LoginPage } from "@/components/login-page"
import { UserHeader } from "@/components/user-header"
import { useAuth } from "@/contexts/auth-context"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { DollarSign, History, Settings } from "lucide-react"

type Tab = "closure" | "history" | "settings"

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
          {activeTab === "settings" && <SettingsTab />}
        </main>

        {/* Bottom Navigation - Modern Glass Design */}
        <nav className="glass-nav sticky bottom-0 z-40">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-2 py-3">
              <button
                onClick={() => setActiveTab("closure")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl smooth-transition ${
                  activeTab === "closure"
                    ? "modern-button text-white shadow-lg scale-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 scale-hover"
                }`}
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-xs font-semibold">Cierre</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl smooth-transition ${
                  activeTab === "history"
                    ? "modern-button text-white shadow-lg scale-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 scale-hover"
                }`}
              >
                <History className="h-6 w-6" />
                <span className="text-xs font-semibold">Historial</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl smooth-transition ${
                  activeTab === "settings"
                    ? "modern-button text-white shadow-lg scale-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 scale-hover"
                }`}
              >
                <Settings className="h-6 w-6" />
                <span className="text-xs font-semibold">Config.</span>
              </button>
            </div>
          </div>
        </nav>

      </div>
    </FirestoreCashflowProvider>
  )
}
