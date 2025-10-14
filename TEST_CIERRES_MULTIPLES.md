# 🧪 Test de Cierres Múltiples

## 📋 **Pasos para Probar Cada Modo**

### **1. 🔄 Modo "Reemplazar"**
1. Haz un cierre del día 13 con $1000
2. Fuerza abrir
3. Haz otro cierre del día 13 con $1500
4. **Selecciona "Reemplazar"**
5. **Resultado esperado**: Solo queda el cierre de $1500

### **2. ➕ Modo "Crear Múltiples"**
1. Haz un cierre del día 13 con $1000
2. Fuerza abrir
3. Haz otro cierre del día 13 con $1500
4. **Selecciona "Crear Cierre Adicional"**
5. **Resultado esperado**: Dos cierres separados (Cierre #1: $1000, Cierre #2: $1500)

### **3. 🔗 Modo "Unificar"**
1. Haz un cierre del día 13 con $1000
2. Fuerza abrir
3. Haz otro cierre del día 13 con $1500
4. **Selecciona "Unificar Cierres"**
5. **Resultado esperado**: Un solo cierre con $2500 (suma de ambos)

### **4. ✏️ Modo "Editar"**
1. Haz un cierre del día 13 con $1000
2. Fuerza abrir
3. Haz otro cierre del día 13 con $1500
4. **Selecciona "Editar Cierre Anterior"**
5. **Resultado esperado**: El formulario se carga con los datos del cierre anterior ($1000) para editar

## 🔍 **Qué Verificar en Consola**

Para cada modo, deberías ver logs como:
- `🔄 Ejecutando acción de conflicto: [modo]`
- `[Modo específico]: [descripción]`
- `✅ [Resultado exitoso]`

## 📊 **Cómo Verificar en Firestore**

1. Ve a Firebase Console
2. Abre Firestore
3. Busca la colección `dailyClosures`
4. Verifica que los documentos tengan la estructura correcta

### **Estructura esperada:**
```javascript
// Cierre único
{
  id: "userId_2025-10-13",
  date: "2025-10-13",
  finalBalance: 1500,
  status: "closed"
}

// Cierres múltiples
{
  id: "userId_2025-10-13_1",
  date: "2025-10-13",
  closureNumber: 1,
  finalBalance: 1000,
  status: "closed"
}
{
  id: "userId_2025-10-13_2", 
  date: "2025-10-13",
  closureNumber: 2,
  finalBalance: 1500,
  status: "closed"
}
```

## ⚠️ **Problemas Conocidos a Verificar**

1. **Modo "multiple"**: Verificar que se asigne correctamente el `closureNumber`
2. **Modo "unify"**: Verificar que se sumen correctamente todos los campos
3. **Modo "edit"**: Verificar que el cierre anterior vuelva a estado "open"
4. **Modo "replace"**: Verificar que se elimine completamente el cierre anterior

## 🎯 **Resultado Esperado**

Si todos los modos funcionan correctamente:
- ✅ El diálogo se muestra cuando hay conflicto
- ✅ Cada modo ejecuta su lógica específica
- ✅ Los datos se guardan correctamente en Firestore
- ✅ El historial muestra los cierres correctos
- ✅ El balance del día se calcula correctamente
