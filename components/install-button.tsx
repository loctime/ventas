"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, CheckCircle } from "lucide-react"

interface InstallButtonProps {
  onInstallClick: () => void
  showInstallButton: boolean
}

export function InstallButton({ onInstallClick, showInstallButton }: InstallButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Mostrar el botón después de un pequeño delay para asegurar que la UI esté lista
    const timer = setTimeout(() => {
      setIsVisible(showInstallButton)
    }, 100)

    return () => clearTimeout(timer)
  }, [showInstallButton])

  const handleClick = async () => {
    setIsInstalling(true)
    try {
      await onInstallClick()
      // Si llegamos aquí sin error, asumimos que la instalación fue exitosa
      setTimeout(() => {
        setIsInstalled(true)
        setIsInstalling(false)
        // Ocultar el botón después de 3 segundos
        setTimeout(() => {
          setIsVisible(false)
        }, 3000)
      }, 1000)
    } catch (error) {
      console.error('Error durante la instalación:', error)
      setIsInstalling(false)
    }
  }

  if (!isVisible) return null

  if (isInstalled) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 bg-green-500 text-white border-0 hover:bg-green-600"
        disabled
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        ¡Instalada!
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
      disabled={isInstalling}
    >
      {isInstalling ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Instalando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Instalar App
        </>
      )}
    </Button>
  )
}
