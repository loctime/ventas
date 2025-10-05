"use client"

import { useState, useEffect } from "react"
import { CollectionsTab } from "@/components/collections-tab"
import { PaymentsTab } from "@/components/payments-tab"
import { HistoryTab } from "@/components/history-tab"
import { FirestoreCashflowProvider } from "@/contexts/firestore-cashflow-context"
import { LoginPage } from "@/components/login-page"
import { UserHeader } from "@/components/user-header"
import { InstallModal } from "@/components/install-modal"
import { useAuth } from "@/contexts/auth-context"
import { TrendingUp, TrendingDown, History } from "lucide-react"

type Tab = "collections" | "payments" | "history"

export default function CashflowApp() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("collections")
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detectar si la app se puede instalar
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt event fired', e)
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    // Detectar si la app ya está instalada
    const handleAppInstalled = () => {
      console.log('App installed')
      setShowInstallButton(false)
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    // Verificar si ya está instalada (modo standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')
    
    console.log('Is standalone:', isStandalone)
    console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches)
    console.log('Navigator standalone:', (window.navigator as any).standalone)
    
    // Verificar si el navegador soporta PWA y puede instalar
    const supportsPWA = 'serviceWorker' in navigator
    const canInstall = supportsPWA && !isStandalone
    
    // Detectar navegadores que soportan instalación automática
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    const isEdge = /Edg/.test(navigator.userAgent)
    const isFirefox = /Firefox/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    console.log('Navegador detectado:', { isChrome, isEdge, isFirefox, isSafari })
    console.log('Soporta PWA:', supportsPWA)
    console.log('Puede instalar:', canInstall)
    
    if (isStandalone) {
      console.log('App ya está instalada, ocultando botón')
      setShowInstallButton(false)
    } else if (canInstall) {
      console.log('Navegador soporta instalación, mostrando botón')
      setShowInstallButton(true)
    } else {
      console.log('Navegador no soporta instalación PWA, ocultando botón')
      setShowInstallButton(false)
    }

    // Registrar service worker para mejorar la instalabilidad
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration)
        })
        .catch((error) => {
          console.log('Error registrando Service Worker:', error)
        })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = () => {
    setShowInstallModal(true)
  }

  const handleInstallConfirm = async () => {
    setIsInstalling(true)
    
    try {
      if (deferredPrompt) {
        console.log('Activando prompt de instalación nativo')
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        console.log('Resultado de la instalación:', outcome)
        
        if (outcome === 'accepted') {
          console.log('¡App instalada exitosamente!')
          setIsInstalled(true)
          setShowInstallButton(false)
          setShowInstallModal(false)
        } else {
          console.log('Usuario canceló la instalación')
          setIsInstalling(false)
        }
        
        setDeferredPrompt(null)
      } else {
        // No hay prompt nativo disponible
        console.log('No hay prompt nativo disponible')
        setIsInstalling(false)
        
        // Mostrar instrucciones específicas según el navegador
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isAndroid = /Android/.test(navigator.userAgent)
        const isChrome = /Chrome/.test(navigator.userAgent)
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
        
        let message = ''
        
        if (isIOS) {
          message = 'Para instalar en iOS:\n1. Toca el botón de compartir (📤)\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"'
        } else if (isAndroid && isChrome) {
          message = 'Para instalar en Android:\n1. Toca el menú del navegador (⋮)\n2. Busca "Instalar app" o "Agregar a pantalla de inicio"\n3. Confirma la instalación'
        } else if (isSafari) {
          message = 'Para instalar en Safari:\n1. Ve al menú "Compartir"\n2. Selecciona "Agregar a pantalla de inicio"\n3. Confirma la instalación'
        } else {
          message = 'Para instalar esta app:\n1. Busca el ícono de instalación (⬇️) en la barra de direcciones\n2. O usa el menú del navegador para "Instalar"'
        }
        
        alert(message)
        setShowInstallModal(false)
      }
    } catch (error) {
      console.error('Error durante la instalación:', error)
      alert('Hubo un error durante la instalación. Por favor, intenta nuevamente.')
      setIsInstalling(false)
    }
  }

  const handleInstallModalClose = () => {
    setShowInstallModal(false)
    setIsInstalling(false)
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

        {/* Modal de Instalación */}
        <InstallModal
          isOpen={showInstallModal}
          onClose={handleInstallModalClose}
          onConfirm={handleInstallConfirm}
          isInstalling={isInstalling}
          isInstalled={isInstalled}
        />
      </div>
    </FirestoreCashflowProvider>
  )
}
