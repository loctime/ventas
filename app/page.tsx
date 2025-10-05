"use client"

import { useState, useEffect } from "react"
import { CollectionsTab } from "@/components/collections-tab"
import { PaymentsTab } from "@/components/payments-tab"
import { HistoryTab } from "@/components/history-tab"
import { FirestoreCashflowProvider } from "@/contexts/firestore-cashflow-context"
import { LoginPage } from "@/components/login-page"
import { UserHeader } from "@/components/user-header"
import { useAuth } from "@/contexts/auth-context"
import { TrendingUp, TrendingDown, History } from "lucide-react"

type Tab = "collections" | "payments" | "history"

export default function CashflowApp() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("collections")
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Detectar si la app se puede instalar
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    // Detectar si la app ya está instalada
    const handleAppInstalled = () => {
      console.log('App installed')
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    // Verificar si ya está instalada (modo standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')
    
    console.log('Is standalone:', isStandalone)
    console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches)
    console.log('Navigator standalone:', (window.navigator as any).standalone)
    
    // Verificar si el navegador soporta PWA
    const supportsPWA = 'serviceWorker' in navigator && 'PushManager' in window
    
    if (isStandalone) {
      console.log('App ya está instalada, ocultando botón')
      setShowInstallButton(false)
    } else if (supportsPWA) {
      console.log('Navegador soporta PWA, mostrando botón de instalación')
      setShowInstallButton(true)
    } else {
      console.log('Navegador no soporta PWA completamente, pero mostrando botón para instrucciones')
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    try {
      if (deferredPrompt) {
        // Usar el prompt nativo si está disponible
        console.log('Mostrando prompt de instalación nativo')
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        console.log('Resultado de la instalación:', outcome)
        
        if (outcome === 'accepted') {
          console.log('Usuario aceptó la instalación')
          setShowInstallButton(false)
        } else {
          console.log('Usuario canceló la instalación')
        }
        
        setDeferredPrompt(null)
      } else {
        // Fallback: mostrar instrucciones de instalación manual
        console.log('Mostrando instrucciones de instalación manual')
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isAndroid = /Android/.test(navigator.userAgent)
        const isDesktop = !isIOS && !isAndroid
        
        let message = ''
        
        if (isIOS) {
          message = 'Para instalar esta app en iOS:\n\n1. Toca el botón de compartir (📤) en la barra inferior\n2. Desplázate hacia abajo y selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar" para confirmar'
        } else if (isAndroid) {
          message = 'Para instalar esta app en Android:\n\n1. Toca el menú del navegador (⋮) en la esquina superior derecha\n2. Busca y selecciona "Instalar app" o "Agregar a pantalla de inicio"\n3. Confirma la instalación'
        } else {
          message = 'Para instalar esta app en tu computadora:\n\n1. Busca el ícono de instalación (⬇️) en la barra de direcciones\n2. O usa el menú del navegador (⋮) y selecciona "Instalar [nombre de la app]"\n3. Confirma la instalación'
        }
        
        alert(message)
      }
    } catch (error) {
      console.error('Error durante la instalación:', error)
      alert('Hubo un error al intentar instalar la aplicación. Por favor, intenta nuevamente.')
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
          showInstallButton={showInstallButton}
          onInstallClick={handleInstallClick}
        />

        {/* Main Content */}
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-6">
          {activeTab === "collections" && <CollectionsTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "history" && <HistoryTab />}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-card border-t sticky bottom-0 z-40">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-2 py-2">
              <button
                onClick={() => setActiveTab("collections")}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
                  activeTab === "collections"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="h-6 w-6" />
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
                <TrendingDown className="h-6 w-6" />
                <span className="text-xs font-medium">Pagos</span>
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
