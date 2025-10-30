"use client"

import { useState } from "react"
import { useFirestoreCashflow } from "@/contexts/firestore-cashflow-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Save, CheckCircle, Settings, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SettingsTab() {
  const { 
    businessDayCutoff, 
    updateBusinessDayCutoff,
    updateClosurePreferences,
    userSettings 
  } = useFirestoreCashflow()
  
  const [selectedHour, setSelectedHour] = useState(businessDayCutoff)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Estados para preferencias de cierre
  const [conflictBehavior, setConflictBehavior] = useState(
    userSettings?.closureConflictBehavior || 'ask'
  )
  const [unifiedThreshold, setUnifiedThreshold] = useState(
    userSettings?.unifiedClosureThreshold || 120 // 2 horas en minutos
  )

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      // Guardar configuración de hora de corte
      await updateBusinessDayCutoff(selectedHour)
      
      // Guardar preferencias de cierre si hay cambios
      if (userSettings && (
        userSettings.closureConflictBehavior !== conflictBehavior ||
        userSettings.unifiedClosureThreshold !== unifiedThreshold * 60 * 1000 // Convertir a milisegundos
      )) {
        await updateClosurePreferences(conflictBehavior, unifiedThreshold)
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000) // Ocultar mensaje después de 3 segundos
    } catch (error) {
      console.error('Error al guardar configuración:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetClosurePreferences = async () => {
    if (!confirm('¿Estás seguro de resetear las preferencias de cierre? Esto volverá a mostrar el diálogo de conflicto en futuros cierres.')) {
      return
    }

    setSaving(true)
    try {
      setConflictBehavior('ask')
      setUnifiedThreshold(120) // 2 horas por defecto
      
      // Actualizar las preferencias en Firestore
      await updateClosurePreferences('ask', 120)
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error al resetear preferencias:', error)
    } finally {
      setSaving(false)
    }
  }

  const hours = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-2xl font-bold big-number">Configuración</h2>
        <p className="text-muted-foreground">Personaliza el funcionamiento del sistema</p>
      </div>

      <Card className="modern-card p-4 scale-hover">
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

      {/* Configuración de Preferencias de Cierre */}
      <Card className="modern-card p-6 scale-hover">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary floating-icon" />
          Preferencias de Cierre
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          Configura cómo manejar conflictos cuando intentas cerrar un día que ya tiene un cierre.
        </p>

        <div className="space-y-6">
          {/* Comportamiento por defecto */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comportamiento por defecto
            </label>
            <Select value={conflictBehavior} onValueChange={setConflictBehavior}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona comportamiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ask">Preguntar siempre</SelectItem>
                <SelectItem value="always_unify">Siempre unificar</SelectItem>
                <SelectItem value="always_multiple">Siempre crear múltiples</SelectItem>
                <SelectItem value="always_replace">Siempre reemplazar</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {conflictBehavior === 'ask' && 'Te preguntará cada vez que haya un conflicto'}
              {conflictBehavior === 'always_unify' && 'Combinará automáticamente los cierres'}
              {conflictBehavior === 'always_multiple' && 'Creará automáticamente cierres separados'}
              {conflictBehavior === 'always_replace' && 'Reemplazará automáticamente el cierre anterior'}
            </p>
          </div>

          {/* Umbral de unificación */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Umbral para unificación automática
            </label>
            <div className="flex items-center gap-4">
              <Select value={unifiedThreshold.toString()} onValueChange={(value) => setUnifiedThreshold(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="180">3 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                  <SelectItem value="480">8 horas</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Si los cierres están separados por menos tiempo, se recomendará unificar
              </span>
            </div>
          </div>

          {/* Estado actual */}
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900 dark:text-green-100 text-sm">
                Estado actual
              </span>
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <p><strong>Comportamiento:</strong> {conflictBehavior === 'ask' ? 'Preguntar siempre' : 
                conflictBehavior === 'always_unify' ? 'Siempre unificar' :
                conflictBehavior === 'always_multiple' ? 'Siempre crear múltiples' :
                'Siempre reemplazar'}</p>
              <p><strong>Umbral de unificación:</strong> {unifiedThreshold} minutos</p>
              {conflictBehavior !== 'ask' && (
                <p className="text-orange-600 dark:text-orange-400 font-medium">
                  ⚠️ El sistema aplicará automáticamente esta acción sin preguntar
                </p>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  💡 Información sobre los comportamientos:
                </p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                  <li><strong>Unificar:</strong> Combina los datos de ambos cierres en uno solo</li>
                  <li><strong>Múltiples:</strong> Mantiene cierres separados con numeración (ej: Cierre #1, #2)</li>
                  <li><strong>Reemplazar:</strong> Elimina el cierre anterior y crea uno nuevo</li>
                  <li><strong>Preguntar:</strong> Siempre muestra el diálogo para que elijas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            onClick={resetClosurePreferences}
            disabled={saving}
            variant="outline"
            size="sm"
          >
            🔄 Resetear Preferencias
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="modern-button"
          >
            {saving ? (
              <>
                <Save className="h-4 w-4 animate-pulse mr-2" />
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
                Guardar Preferencias
              </>
            )}
          </Button>
        </div>
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
          <li>• Si marcas "Recordar elección" en el diálogo, el sistema aplicará automáticamente la misma acción</li>
          <li>• Puedes resetear las preferencias aquí para volver a ver el diálogo de conflicto</li>
        </ul>
      </Card>
    </div>
  )
}

