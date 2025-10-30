"use client"

import { useState, useEffect } from "react"
import { DailyClosureTab } from "@/components/daily-closure-tab"
import { HistoryTab } from "@/components/history-tab"
import { SettingsTab } from "@/components/settings-tab"
import { FirestoreCashflowProvider } from "@/contexts/firestore-cashflow-context"
import { LoginPage } from "@/components/login-page"
import { UserHeader } from "@/components/user-header"
import { useAuth } from "@/contexts/auth-context"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { DollarSign, History, Settings } from "lucide-react"
import type { DailyClosure } from "@/lib/types"

type Tab = "closure" | "history" | "settings"

export default function CashflowApp() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("closure")
  const [selectedClosure, setSelectedClosure] = useState<DailyClosure | null>(null)
  const { isInstallable, isInstalled, installPWA } = usePWAInstall()
  const [isScrolling, setIsScrolling] = useState(false)

  const handleInstallClick = async () => {
    const installed = await installPWA()
    if (installed) {
      console.log("PWA instalada exitosamente")
    }
  }

  // Detectar scroll para reducir tamaño del footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      setIsScrolling(scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          onBackClick={selectedClosure ? () => setSelectedClosure(null) : undefined}
        />

        {/* Main Content */}
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-2 pb-28">
          {activeTab === "closure" && <DailyClosureTab />}
          {activeTab === "history" && <HistoryTab selectedClosure={selectedClosure} onSelectedClosureChange={setSelectedClosure} />}
          {activeTab === "settings" && <SettingsTab />}
        </main>

        {/* Bottom Navigation - Modern Glass Design */}
        <nav className={`glass-nav fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolling ? 'scale-90' : ''}`}>
          <div className="container max-w-4xl mx-auto px-4">
            <div className={`grid grid-cols-3 gap-2 transition-all duration-300 ${isScrolling ? 'py-2' : 'py-3'}`}>
              <button
                onClick={() => setActiveTab("closure")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl smooth-transition ${
                  activeTab === "closure"
                    ? "modern-button text-white shadow-lg scale-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 scale-hover"
                }`}
              >
                <DollarSign className={`transition-all duration-300 ${isScrolling ? 'h-5 w-5' : 'h-6 w-6'}`} />
                <span className={`font-semibold transition-all duration-300 ${isScrolling ? 'text-[10px]' : 'text-xs'}`}>Cierre</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl smooth-transition ${
                  activeTab === "history"
                    ? "modern-button text-white shadow-lg scale-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 scale-hover"
                }`}
              >
                <History className={`transition-all duration-300 ${isScrolling ? 'h-5 w-5' : 'h-6 w-6'}`} />
                <span className={`font-semibold transition-all duration-300 ${isScrolling ? 'text-[10px]' : 'text-xs'}`}>Historial</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl smooth-transition ${
                  activeTab === "settings"
                    ? "modern-button text-white shadow-lg scale-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 scale-hover"
                }`}
              >
                <Settings className={`transition-all duration-300 ${isScrolling ? 'h-5 w-5' : 'h-6 w-6'}`} />
                <span className={`font-semibold transition-all duration-300 ${isScrolling ? 'text-[10px]' : 'text-xs'}`}>Config.</span>
              </button>
            </div>
          </div>
        </nav>

      </div>
    </FirestoreCashflowProvider>
  )
}
