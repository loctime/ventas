/**
 * Script para generar datos de historial de ejemplo de 1 mes
 * 
 * Uso:
 * 1. Asegúrate de estar logueado en la aplicación
 * 2. Abre la consola del navegador en la app
 * 3. Copia y pega este código
 * 4. Ejecuta: await generateSampleHistory(userId)
 */

import { FirestoreService } from '@/lib/firestore-service'
import type { DailyClosure, DailyExpense } from '@/lib/types'

// Función para generar un número aleatorio entre min y max
const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Función para generar gastos aleatorios
const generateRandomExpenses = (): DailyExpense[] => {
  const possibleExpenses = [
    { description: 'Pago proveedor', min: 5000, max: 20000 },
    { description: 'Servicios', min: 2000, max: 8000 },
    { description: 'Insumos', min: 3000, max: 15000 },
    { description: 'Mantenimiento', min: 1000, max: 5000 },
    { description: 'Combustible', min: 2000, max: 6000 },
    { description: 'Varios', min: 500, max: 3000 },
  ]

  const numExpenses = randomBetween(0, 4) // 0 a 4 gastos por día
  const expenses: DailyExpense[] = []

  for (let i = 0; i < numExpenses; i++) {
    const expense = possibleExpenses[randomBetween(0, possibleExpenses.length - 1)]
    expenses.push({
      id: `expense_${Date.now()}_${i}`,
      description: expense.description,
      amount: randomBetween(expense.min, expense.max)
    })
  }

  return expenses
}

// Función principal para generar el historial
export async function generateSampleHistory(userId: string) {
  const firestoreService = new FirestoreService(userId)
  
  // Generar datos para los últimos 30 días
  const today = new Date()
  const closures: Omit<DailyClosure, 'userId'>[] = []

  console.log('🚀 Generando datos de historial de 1 mes...')

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    const dateStr = date.toISOString().split('T')[0]

    // Generar ingresos aleatorios con variación por día de la semana
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Fin de semana: más ingresos
    const baseIncome = isWeekend ? 40000 : 25000
    const variance = isWeekend ? 20000 : 15000

    // Distribución de ingresos
    const totalIncome = randomBetween(baseIncome - variance, baseIncome + variance)
    const cashPercentage = randomBetween(30, 50) / 100
    const cardPercentage = randomBetween(30, 50) / 100
    const transferPercentage = 1 - cashPercentage - cardPercentage

    const cashCounted = Math.round(totalIncome * cashPercentage)
    const cardCounted = Math.round(totalIncome * cardPercentage)
    const transferCounted = totalIncome - cashCounted - cardCounted

    // Generar gastos
    const expenses = generateRandomExpenses()
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Simular ventas registradas (Work Mode) con pequeñas diferencias
    const hasDifference = Math.random() < 0.3 // 30% de días con diferencia
    const differenceAmount = hasDifference ? randomBetween(-2000, 3000) : 0
    const workModeTotal = totalIncome - differenceAmount

    const finalBalance = totalIncome - totalExpenses

    // 90% de días cerrados, 10% abiertos
    const status = daysAgo === 0 ? 'open' : (Math.random() < 0.9 ? 'closed' : 'open')

    const closure: Omit<DailyClosure, 'userId'> = {
      id: `${userId}_${dateStr}`,
      date: dateStr,
      cashCounted,
      cardCounted,
      transferCounted,
      totalCounted: totalIncome,
      expenses,
      totalExpenses,
      workModeTransactionIds: [], // No generamos transacciones reales
      workModeTotal,
      difference: differenceAmount,
      note: hasDifference && Math.random() < 0.5 
        ? 'Diferencia justificada por ajustes de cambio'
        : undefined,
      finalBalance,
      status: status as 'open' | 'closed',
      createdAt: date.getTime(),
      closedAt: status === 'closed' ? date.getTime() + 3600000 : undefined // +1 hora
    }

    closures.push(closure)
  }

  // Guardar todos los cierres
  console.log(`💾 Guardando ${closures.length} cierres diarios...`)
  
  for (const closure of closures) {
    await firestoreService.saveDailyClosure(closure)
    console.log(`✅ Guardado: ${closure.date}`)
  }

  console.log('🎉 ¡Historial generado exitosamente!')
  console.log(`📊 Resumen:`)
  console.log(`   - Total de días: ${closures.length}`)
  console.log(`   - Ingresos totales: $${closures.reduce((sum, c) => sum + c.totalCounted, 0).toLocaleString('es-AR')}`)
  console.log(`   - Gastos totales: $${closures.reduce((sum, c) => sum + c.totalExpenses, 0).toLocaleString('es-AR')}`)
  console.log(`   - Balance total: $${closures.reduce((sum, c) => sum + c.finalBalance, 0).toLocaleString('es-AR')}`)
}

// Para usar en el navegador, exportar una versión que obtenga el userId automáticamente
export function generateSampleHistoryForCurrentUser() {
  // Esta función se puede llamar desde la consola del navegador
  const script = `
    // Función para generar el historial de ejemplo
    async function generateSampleHistory() {
      // Obtener el userId del contexto de auth
      const userId = localStorage.getItem('userId') || prompt('Ingresa tu User ID:');
      
      if (!userId) {
        console.error('❌ No se pudo obtener el User ID');
        return;
      }

      const { FirestoreService } = await import('/lib/firestore-service.ts');
      
      const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      
      const generateRandomExpenses = () => {
        const possibleExpenses = [
          { description: 'Pago proveedor', min: 5000, max: 20000 },
          { description: 'Servicios', min: 2000, max: 8000 },
          { description: 'Insumos', min: 3000, max: 15000 },
          { description: 'Mantenimiento', min: 1000, max: 5000 },
          { description: 'Combustible', min: 2000, max: 6000 },
          { description: 'Varios', min: 500, max: 3000 },
        ];

        const numExpenses = randomBetween(0, 4);
        const expenses = [];

        for (let i = 0; i < numExpenses; i++) {
          const expense = possibleExpenses[randomBetween(0, possibleExpenses.length - 1)];
          expenses.push({
            id: \`expense_\${Date.now()}_\${i}\`,
            description: expense.description,
            amount: randomBetween(expense.min, expense.max)
          });
        }

        return expenses;
      };

      const firestoreService = new FirestoreService(userId);
      const today = new Date();
      const closures = [];

      console.log('🚀 Generando datos de historial de 1 mes...');

      for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];

        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const baseIncome = isWeekend ? 40000 : 25000;
        const variance = isWeekend ? 20000 : 15000;

        const totalIncome = randomBetween(baseIncome - variance, baseIncome + variance);
        const cashPercentage = randomBetween(30, 50) / 100;
        const cardPercentage = randomBetween(30, 50) / 100;
        const transferPercentage = 1 - cashPercentage - cardPercentage;

        const cashCounted = Math.round(totalIncome * cashPercentage);
        const cardCounted = Math.round(totalIncome * cardPercentage);
        const transferCounted = totalIncome - cashCounted - cardCounted;

        const expenses = generateRandomExpenses();
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        const hasDifference = Math.random() < 0.3;
        const differenceAmount = hasDifference ? randomBetween(-2000, 3000) : 0;
        const workModeTotal = totalIncome - differenceAmount;

        const finalBalance = totalIncome - totalExpenses;
        const status = daysAgo === 0 ? 'open' : (Math.random() < 0.9 ? 'closed' : 'open');

        const closure = {
          id: \`\${userId}_\${dateStr}\`,
          date: dateStr,
          cashCounted,
          cardCounted,
          transferCounted,
          totalCounted: totalIncome,
          expenses,
          totalExpenses,
          workModeTransactionIds: [],
          workModeTotal,
          difference: differenceAmount,
          note: hasDifference && Math.random() < 0.5 
            ? 'Diferencia justificada por ajustes de cambio'
            : undefined,
          finalBalance,
          status,
          createdAt: date.getTime(),
          closedAt: status === 'closed' ? date.getTime() + 3600000 : undefined
        };

        closures.push(closure);
      }

      console.log(\`💾 Guardando \${closures.length} cierres diarios...\`);
      
      for (const closure of closures) {
        await firestoreService.saveDailyClosure(closure);
        console.log(\`✅ Guardado: \${closure.date}\`);
      }

      console.log('🎉 ¡Historial generado exitosamente!');
      console.log(\`📊 Resumen:\`);
      console.log(\`   - Total de días: \${closures.length}\`);
      console.log(\`   - Ingresos totales: $\${closures.reduce((sum, c) => sum + c.totalCounted, 0).toLocaleString('es-AR')}\`);
      console.log(\`   - Gastos totales: $\${closures.reduce((sum, c) => sum + c.totalExpenses, 0).toLocaleString('es-AR')}\`);
      console.log(\`   - Balance total: $\${closures.reduce((sum, c) => sum + c.finalBalance, 0).toLocaleString('es-AR')}\`);
    }

    // Ejecutar
    await generateSampleHistory();
  `;

  return script;
}

