"use client"

import { useState } from "react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Save, CheckCircle } from "lucide-react"

export function SettingsTab() {
  const { businessDayCutoff, updateBusinessDayCutoff } = useFirestoreCashflow()
  const [selectedHour, setSelectedHour] = useState(businessDayCutoff)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await updateBusinessDayCutoff(selectedHour)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000) // Ocultar mensaje después de 3 segundos
    } catch (error) {
      console.error('Error al guardar configuración:', error)
    } finally {
      setSaving(false)
    }
  }

  const hours = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold big-number">Configuración</h2>
        <p className="text-muted-foreground">Personaliza el funcionamiento del sistema</p>
      </div>

      <Card className="modern-card p-6 scale-hover">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary floating-icon" />
          Horario de Cambio de Día
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          Configura a qué hora debe cambiar el día comercial. Todo antes de esta hora
          se considerará del día anterior.
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
          {hours.map((hour) => (
            <button
              key={hour}
              onClick={() => setSelectedHour(hour)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedHour === hour
                  ? 'border-primary bg-primary text-white shadow-lg scale-105'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <div className="text-sm font-bold">
                {hour.toString().padStart(2, '0')}:00
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 bg-muted/50 rounded-lg text-sm mb-4 border border-border">
          <div className="flex items-start gap-2">
            <div className="text-2xl">💡</div>
            <div>
              <strong className="block mb-1">Ejemplo:</strong>
              <p className="text-muted-foreground">
                Si seleccionas <strong>04:00</strong>, cualquier venta o cierre realizado
                entre las <strong>00:00 y las 03:59</strong> se contará como del día anterior.
                Esto es ideal para negocios que cierran después de medianoche.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm mb-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <div className="text-lg">ℹ️</div>
            <div className="text-blue-900 dark:text-blue-100">
              <strong>Configuración actual:</strong> El día cambia a las{' '}
              <strong>{businessDayCutoff.toString().padStart(2, '0')}:00</strong>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || selectedHour === businessDayCutoff}
          className="w-full modern-button text-base py-5"
        >
          {saving ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>

        {selectedHour !== businessDayCutoff && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Tienes cambios sin guardar
          </p>
        )}
      </Card>

      {/* Información adicional */}
      <Card className="modern-card p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 scale-hover">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <span>🔔</span>
          Cómo funciona el sistema
        </h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Al cerrar después de medianoche, podrás elegir qué día cerrar</li>
          <li>• El sistema te sugerirá el día correcto según tu configuración</li>
          <li>• Puedes elegir manualmente si la sugerencia no es correcta</li>
        </ul>
      </Card>
    </div>
  )
}

