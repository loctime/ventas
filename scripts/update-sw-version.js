#!/usr/bin/env node

/**
 * Script para actualizar la versión del Service Worker automáticamente
 * Se ejecuta antes del build para generar un timestamp único
 */

const fs = require('fs')
const path = require('path')

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js')

function updateServiceWorkerVersion() {
  try {
    // Generar timestamp único para la versión
    const timestamp = new Date().getTime()
    const version = `v${timestamp}`
    
    console.log('🔧 Actualizando versión del Service Worker...')
    console.log(`📦 Nueva versión: ${version}`)

    // Leer el archivo del Service Worker
    let swContent = fs.readFileSync(SW_PATH, 'utf8')

    // Reemplazar BUILD_TIMESTAMP con la versión actual
    swContent = swContent.replace(/BUILD_TIMESTAMP/g, version)

    // Escribir el archivo actualizado
    fs.writeFileSync(SW_PATH, swContent, 'utf8')

    console.log('✅ Service Worker actualizado exitosamente')
    console.log(`📄 Archivo: ${SW_PATH}`)
    
  } catch (error) {
    console.error('❌ Error al actualizar Service Worker:', error)
    process.exit(1)
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  updateServiceWorkerVersion()
}

module.exports = updateServiceWorkerVersion

