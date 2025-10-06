"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true ||
                        document.referrer.includes('android-app://')
    
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Verificar si el navegador soporta PWA
    const supportsPWA = 'serviceWorker' in navigator
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    console.log('PWA Install Check:', {
      isStandalone,
      supportsPWA,
      isMobile,
      userAgent: navigator.userAgent
    })
    
    // Mostrar botón si soporta PWA y no está instalado
    if (supportsPWA && !isStandalone) {
      console.log('Mostrando botón de instalación')
      setIsInstallable(true)
    } else {
      console.log('No se puede instalar:', { supportsPWA, isStandalone })
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installPWA = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice
        
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true)
          setIsInstallable(false)
          setDeferredPrompt(null)
          return true
        }
        return false
      } catch (error) {
        console.error('Error installing PWA:', error)
        return false
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
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    installPWA
  }
}
