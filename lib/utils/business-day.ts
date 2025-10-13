/**
 * Sistema híbrido de día comercial con confirmación manual
 * Combina hora de corte automática con confirmación manual cuando es necesario
 */

export interface BusinessDayConfig {
  cutoffHour: number
}

/**
 * Obtiene el día comercial basado en hora de corte
 */
export function getBusinessDay(cutoffHour: number = 4): string {
  const now = new Date()
  const currentHour = now.getHours()
  
  // Durante horario de trabajo normal (6:00 AM a 10:00 PM), siempre usar día actual
  if (currentHour >= 6 && currentHour <= 22) {
    return now.toISOString().split('T')[0]
  }
  
  // Solo en horario nocturno (10:00 PM a 6:00 AM) usar la lógica de corte
  if (currentHour < cutoffHour) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }
  
  return now.toISOString().split('T')[0]
}

/**
 * Verifica si estamos después de medianoche
 */
export function isAfterMidnight(): boolean {
  const currentHour = new Date().getHours()
  return currentHour >= 0 && currentHour < 12 // Entre 00:00 y 11:59
}

/**
 * Verifica si estamos en horario extendido (después de medianoche, antes de hora de corte)
 */
export function isExtendedHours(cutoffHour: number = 4): boolean {
  const currentHour = new Date().getHours()
  return currentHour < cutoffHour
}

/**
 * Obtiene sugerencias de fechas para cerrar
 */
export function getClosureDateSuggestions(cutoffHour: number = 4): {
  suggestedDate: string
  alternateDate: string | null
  isAfterMidnight: boolean
  businessDay: string
  calendarDay: string
  message: string
} {
  const now = new Date()
  const currentHour = now.getHours()
  const calendarDay = now.toISOString().split('T')[0]
  const businessDay = getBusinessDay(cutoffHour)
  const afterMidnight = isAfterMidnight()
  
  // Calcular día anterior (para opción alternativa)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  // Caso 1: Horario de trabajo normal (6:00 AM a 10:00 PM) - Solo hay una opción lógica
  if (currentHour >= 6 && currentHour <= 22) {
    return {
      suggestedDate: calendarDay,
      alternateDate: null,
      isAfterMidnight: false,
      businessDay,
      calendarDay,
      message: `Cerrando el día ${formatDateShort(calendarDay)}`
    }
  }
  
  // Caso 1b: Antes de medianoche pero fuera del horario normal - Solo hay una opción lógica
  if (!afterMidnight) {
    return {
      suggestedDate: calendarDay,
      alternateDate: null,
      isAfterMidnight: false,
      businessDay,
      calendarDay,
      message: `Cerrando el día ${formatDateShort(calendarDay)}`
    }
  }
  
  // Caso 2: Después de medianoche pero antes de hora de corte
  // El día comercial es ayer, pero podríamos querer cerrar hoy
  if (currentHour < cutoffHour) {
    return {
      suggestedDate: yesterdayStr, // Sugerimos ayer (día comercial)
      alternateDate: calendarDay,   // Alternativa: hoy
      isAfterMidnight: true,
      businessDay,
      calendarDay,
      message: `¿Qué día deseas cerrar?`
    }
  }
  
  // Caso 3: Después de la hora de corte (ya es un nuevo día comercial)
  // Pero podríamos querer cerrar el día anterior
  return {
    suggestedDate: calendarDay,    // Sugerimos hoy
    alternateDate: yesterdayStr,    // Alternativa: ayer
    isAfterMidnight: true,
    businessDay,
    calendarDay,
    message: `¿Qué día deseas cerrar?`
  }
}

function formatDateShort(dateStr: string): string {
  // Parsear la fecha correctamente para evitar problemas de zona horaria
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month es 0-indexado
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

export function formatDateLong(dateStr: string): string {
  // Parsear la fecha correctamente para evitar problemas de zona horaria
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month es 0-indexado
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

