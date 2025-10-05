"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Smartphone, CheckCircle, X } from "lucide-react"

interface InstallModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isInstalling?: boolean
  isInstalled?: boolean
}

export function InstallModal({ isOpen, onClose, onConfirm, isInstalling = false, isInstalled = false }: InstallModalProps) {
  const [step, setStep] = useState<'confirm' | 'installing' | 'success'>('confirm')

  const handleConfirm = () => {
    setStep('installing')
    onConfirm()
  }

  const handleClose = () => {
    setStep('confirm')
    onClose()
  }

  if (isInstalled) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              ¡Instalación Exitosa!
            </DialogTitle>
            <DialogDescription>
              La aplicación se ha instalado correctamente en tu dispositivo. 
              Ahora puedes acceder a ella desde tu pantalla de inicio.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose} className="w-full">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            Instalar Aplicación
          </DialogTitle>
          <DialogDescription>
            Instala esta aplicación en tu dispositivo para acceder rápidamente 
            y usarla sin conexión a internet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Smartphone className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Beneficios de la instalación:</p>
              <ul className="mt-1 text-blue-700 space-y-1">
                <li>• Acceso rápido desde la pantalla de inicio</li>
                <li>• Funciona sin conexión a internet</li>
                <li>• Experiencia como aplicación nativa</li>
                <li>• Notificaciones y actualizaciones automáticas</li>
              </ul>
            </div>
          </div>

          {step === 'installing' && (
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Instalando aplicación...</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isInstalling}
            className="flex-1 bg-blue-500 hover:bg-blue-600"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Instalando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Instalar Ahora
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
