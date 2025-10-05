"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone } from "lucide-react"

interface InstallButtonProps {
  onInstallClick: () => void
  showInstallButton: boolean
}

export function InstallButton({ onInstallClick, showInstallButton }: InstallButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Mostrar el botón después de un pequeño delay para asegurar que la UI esté lista
    const timer = setTimeout(() => {
      setIsVisible(showInstallButton)
    }, 100)

    return () => clearTimeout(timer)
  }, [showInstallButton])

  if (!isVisible) return null

  return (
    <Button
      onClick={onInstallClick}
      size="sm"
      variant="outline"
      className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
    >
      <Download className="h-4 w-4 mr-2" />
      Instalar App
    </Button>
  )
}
