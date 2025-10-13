# Script de Generación de Datos de Ejemplo

Este script genera un historial completo de 1 mes con datos aleatorios para probar la funcionalidad de la aplicación.

## 🎯 Cómo Usar

### Método 1: Página Web (Recomendado)

1. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

2. Navega a: **http://localhost:3000/generate-data**

3. Haz clic en el botón **"Generar Historial de 1 Mes"**

4. Espera a que se complete la generación (aprox. 30 segundos)

5. Ve al historial para ver los datos generados

### Método 2: Consola del Navegador (Alternativo)

Si prefieres ejecutar el script directamente desde la consola:

1. Abre la aplicación y autentícate

2. Abre la consola del navegador (F12)

3. Obtén tu User ID (puedes usar el contexto de auth o Firebase Console)

4. Importa y ejecuta:
   ```javascript
   const { generateSampleHistory } = await import('./scripts/generate-sample-history.ts')
   await generateSampleHistory('TU_USER_ID_AQUI')
   ```

## 📊 Datos Generados

El script genera:

- **31 días** de cierres diarios (último mes completo)
- **Ingresos variables** según día de la semana:
  - Lunes-Viernes: $10,000 - $40,000
  - Fines de semana: $20,000 - $60,000
- **Distribución de pagos**:
  - 30-50% Efectivo
  - 30-50% Tarjeta
  - Resto en Transferencias
- **Gastos aleatorios**: 0-4 gastos por día
- **Diferencias simuladas**: ~30% de días con diferencias justificadas
- **Estados**: 90% cerrados, 10% abiertos

## 🧹 Limpiar Datos

Si quieres eliminar los datos generados, puedes hacerlo desde Firebase Console:

1. Ir a Firestore Database
2. Buscar la colección `dailyClosures`
3. Filtrar por tu userId
4. Eliminar los documentos generados

## ⚠️ Advertencia

Este script es solo para **desarrollo y pruebas**. No usar en producción con datos reales.

