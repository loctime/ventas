#!/usr/bin/env node

/**
 * Script para restaurar el template del Service Worker después del build
 * Esto asegura que el archivo sw.js en git siempre tenga el placeholder BUILD_TIMESTAMP
 */

const fs = require('fs')
const path = require('path')

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js')

function restoreServiceWorkerTemplate() {
  try {
    console.log('🔄 Restaurando template del Service Worker...')

    // Leer el archivo del Service Worker
    let swContent = fs.readFileSync(SW_PATH, 'utf8')

    // Reemplazar cualquier versión con BUILD_TIMESTAMP
    swContent = swContent.replace(/const SW_VERSION = "v\d+"/g, 'const SW_VERSION = "BUILD_TIMESTAMP"')

    // Escribir el archivo restaurado
    fs.writeFileSync(SW_PATH, swContent, 'utf8')

    console.log('✅ Template del Service Worker restaurado')
    console.log('📄 Listo para commit con placeholder BUILD_TIMESTAMP')
    
  } catch (error) {
    console.error('❌ Error al restaurar template:', error)
    process.exit(1)
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  restoreServiceWorkerTemplate()
}

module.exports = restoreServiceWorkerTemplate

