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
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    // Detectar si la app ya está instalada
    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    // Verificar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')
    
    console.log('Verificando instalación:', {
      isStandalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: (window.navigator as any).standalone,
      referrer: document.referrer
    })
    
    if (isStandalone) {
      console.log('App ya está instalada, ocultando botón')
      setShowInstallButton(false)
    } else {
      console.log('App no está instalada, mostrando botón')
      setShowInstallButton(true)
    }

    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // Mostrar el prompt de instalación
        deferredPrompt.prompt()
        
        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice
        
        console.log('Resultado de la instalación:', outcome)
        
        if (outcome === 'accepted') {
          console.log('Usuario aceptó la instalación')
          setShowInstallButton(false)
          
          // Esperar un momento y verificar si realmente se instaló
          setTimeout(() => {
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://') ||
                              window.location.protocol === 'https:' && 
                              (window.screen.width < 1024 || window.screen.height < 1024)
            
            console.log('Verificando instalación real:', {
              isInstalled,
              displayMode: window.matchMedia('(display-mode: standalone)').matches,
              navigatorStandalone: (window.navigator as any).standalone,
              referrer: document.referrer,
              protocol: window.location.protocol,
              screenWidth: window.screen.width,
              screenHeight: window.screen.height
            })
            
            if (!isInstalled) {
              console.log('La instalación no se completó, mostrando instrucciones')
              // Mostrar instrucciones si no se instaló realmente
              const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
              const isAndroid = /Android/.test(navigator.userAgent)
              
              if (isIOS) {
                alert('Para completar la instalación en iOS:\n1. Toca el botón de compartir (📤) en la barra inferior\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"')
              } else if (isAndroid) {
                alert('Para completar la instalación en Android:\n1. Toca el menú del navegador (⋮) en la esquina superior derecha\n2. Busca "Instalar app" o "Agregar a pantalla de inicio"\n3. Confirma la instalación')
              }
            } else {
              console.log('App instalada correctamente')
            }
          }, 3000)
        } else {
          console.log('Usuario canceló la instalación')
        }
        
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Error durante la instalación:', error)
        alert('Hubo un error durante la instalación. Por favor, intenta nuevamente.')
      }
    } else {
      // No hay prompt nativo, mostrar instrucciones
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      
      if (isIOS) {
        alert('Para instalar en iOS:\n1. Toca el botón de compartir (📤) en la barra inferior\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"')
      } else if (isAndroid) {
        alert('Para instalar en Android:\n1. Toca el menú del navegador (⋮) en la esquina superior derecha\n2. Busca "Instalar app" o "Agregar a pantalla de inicio"\n3. Confirma la instalación')
      } else {
        alert('Para instalar esta app:\n1. Busca el ícono de instalación (⬇️) en la barra de direcciones\n2. O usa el menú del navegador para "Instalar"')
      }
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
