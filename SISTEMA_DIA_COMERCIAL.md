# Sistema de Día Comercial - Documentación

## 🎯 Descripción

Sistema híbrido que combina **automatización inteligente** con **control manual** para manejar cierres de día después de medianoche. Ideal para negocios que operan en horarios nocturnos (restaurantes, bares, etc.).

## ✨ Características Implementadas

### 1. **Hora de Corte Configurable**
- El usuario puede configurar a qué hora cambia el día comercial (0-11 AM)
- Por defecto: **4:00 AM**
- Ejemplo: Si configuras 4:00 AM, cualquier actividad entre 00:00-03:59 se cuenta como del día anterior

### 2. **Detección Automática de Día**
- El sistema calcula automáticamente el "día comercial" basado en la hora de corte
- Se actualiza automáticamente cada minuto
- Muestra advertencias visuales cuando estás en "horario extendido"

### 3. **Selector de Fecha al Cerrar**
- Si cierras después de medianoche, el sistema pregunta qué día deseas cerrar
- Muestra dos opciones:
  - **Día Comercial (Recomendado)**: Según tu configuración
  - **Fecha Alternativa**: Fecha del calendario actual
- Incluye explicación clara de cada opción

### 4. **Persistencia de Configuración**
- La configuración se guarda en Firestore
- Sincronización en tiempo real entre dispositivos
- Cada usuario tiene su propia configuración

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
```
lib/utils/business-day.ts           - Lógica de día comercial
components/closure-date-selector-dialog.tsx  - Diálogo selector de fecha
components/settings-tab.tsx         - Pestaña de configuración
```

### Archivos Modificados
```
lib/types.ts                        - Agregados UserSettings y ClosureDateSuggestion
lib/firestore-service.ts            - Métodos para configuración de usuario
contexts/firestore-cashflow-context.tsx  - Lógica híbrida de día comercial
components/daily-closure-tab.tsx    - Integración con selector de fecha
app/page.tsx                        - Agregada pestaña de configuración
```

## 🚀 Cómo Usar

### Configurar Hora de Corte

1. Ve a la pestaña **"Config."** en la barra inferior
2. Selecciona la hora a la que debe cambiar el día (0-11)
3. Presiona **"Guardar Configuración"**
4. La configuración se aplica inmediatamente

### Cerrar un Día

**Caso 1: Antes de Medianoche**
- El sistema cierra el día actual automáticamente
- No se muestra selector de fecha

**Caso 2: Después de Medianoche (antes de hora de corte)**
1. Presiona **"✓ Finalizar Día"**
2. Aparece un diálogo preguntando qué día cerrar
3. Opciones:
   - **Día Comercial**: El día anterior (recomendado)
   - **Fecha Alternativa**: El día de hoy
4. Selecciona y confirma

**Caso 3: Después de la Hora de Corte**
- Ya es un nuevo día comercial
- Puedes cerrar el día actual o el anterior

## 🔄 Flujo de Trabajo Típico

### Escenario: Restaurante que cierra a las 2 AM

**Configuración**:
- Hora de corte: **4:00 AM**

**Lunes a las 23:00**
- Día comercial: Lunes ✓
- Al cerrar: Se cierra "Lunes"

**Martes a las 01:30** (horario extendido)
- Día comercial: Lunes ✓ (porque es antes de las 4 AM)
- Al cerrar: Aparece selector
  - Opción 1: Lunes (recomendado)
  - Opción 2: Martes
- Se muestra advertencia: "Horario extendido"

**Martes a las 05:00**
- Día comercial: Martes ✓
- Al cerrar: Se cierra "Martes"

## 💡 Indicadores Visuales

### En Cierre del Día
```
🟡 Horario extendido - Fecha actual: 14/10/2025
```
Aparece cuando estás trabajando después de medianoche pero antes de la hora de corte.

### En Selector de Fecha
- Botón resaltado en azul para la opción seleccionada
- Íconos claros: 📅 Calendario
- Descripción de cada opción
- Hora actual mostrada en el título

## 🗄️ Estructura de Datos

### UserSettings (Firestore)
```typescript
{
  userId: string
  businessDayCutoffHour: number  // 0-23
  createdAt: number
  updatedAt: number
}
```

**Colección**: `userSettings`
**Documento ID**: `{userId}`

### DailyClosure (Sin cambios)
Se mantiene la estructura existente, solo se usa `closureDate` para especificar qué día se está cerrando.

## 🔧 Funciones Principales

### getBusinessDay(cutoffHour)
Calcula el día comercial actual basado en la hora de corte.

### getClosureDateSuggestions(cutoffHour)
Retorna sugerencias de qué día cerrar cuando estás después de medianoche.

### isExtendedHours(cutoffHour)
Verifica si estás en horario extendido.

### updateBusinessDayCutoff(hour)
Actualiza la configuración de hora de corte del usuario.

## 🎨 Mejoras de UX

1. **Auto-guardado**: Sigue funcionando normalmente
2. **Advertencias visuales**: Muestra cuando estás en horario extendido
3. **Selector intuitivo**: Dos opciones claras con descripciones
4. **Confirmación doble**: Pide confirmación antes de finalizar
5. **Feedback inmediato**: Muestra "¡Guardado!" al cambiar configuración

## 🐛 Casos Edge Manejados

✅ Usuario cierra después de medianoche
✅ Usuario olvida cerrar un día
✅ Cambio de día mientras la app está abierta
✅ Múltiples dispositivos con diferentes zonas horarias
✅ Recarga de página no pierde el día activo
✅ Cambio de configuración se aplica inmediatamente

## 🔐 Seguridad

- Configuración por usuario (aislada)
- Reglas de Firestore recomendadas:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📱 Responsive

- Diseño móvil optimizado
- Navegación inferior con 3 pestañas
- Diálogos adaptables a pantallas pequeñas
- Grid de horas responsive (4 columnas en móvil, 6 en desktop)

## 🚀 Próximas Mejoras Posibles

- [ ] Notificación cuando cambia el día comercial
- [ ] Historial de cambios de configuración
- [ ] Presets (Restaurante, Bar, Café, etc.)
- [ ] Diferentes horas de corte por día de la semana
- [ ] Exportar/Importar configuración

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, por favor reporta en el proyecto.

**Implementado**: Octubre 2025
**Versión**: 1.0.0

