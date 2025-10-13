#!/usr/bin/env node

/**
 * Script para simular una actualización del Service Worker en desarrollo
 * Útil para probar el flujo de actualización sin hacer un build completo
 */

const fs = require('fs')
const path = require('path')

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js')

function testServiceWorkerUpdate() {
  try {
    console.log('🧪 Simulando actualización del Service Worker...')
    
    // Generar timestamp único para la versión
    const timestamp = new Date().getTime()
    const version = `v${timestamp}`
    
    console.log(`📦 Versión de prueba: ${version}`)

    // Leer el archivo del Service Worker
    let swContent = fs.readFileSync(SW_PATH, 'utf8')

    // Reemplazar BUILD_TIMESTAMP con la versión de prueba
    swContent = swContent.replace(/BUILD_TIMESTAMP/g, version)

    // Escribir el archivo actualizado
    fs.writeFileSync(SW_PATH, swContent, 'utf8')

    console.log('✅ Service Worker actualizado para pruebas')
    console.log(`📄 Archivo: ${SW_PATH}`)
    console.log('')
    console.log('📝 Instrucciones:')
    console.log('   1. Abre la PWA en el navegador')
    console.log('   2. Espera 10 segundos')
    console.log('   3. Deberías ver la notificación de actualización')
    console.log('   4. Haz clic en "Actualizar Ahora"')
    console.log('')
    console.log('⚠️  IMPORTANTE: Después de probar, ejecuta:')
    console.log('   npm run restore-template')
    console.log('   (o el script restore-sw-template.js)')
    
  } catch (error) {
    console.error('❌ Error al simular actualización:', error)
    process.exit(1)
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testServiceWorkerUpdate()
}

module.exports = testServiceWorkerUpdate

