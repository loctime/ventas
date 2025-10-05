# Configuración para Producción

## Variables de Entorno en Vercel

Para que la aplicación funcione correctamente en producción, necesitas configurar las siguientes variables de entorno en tu proyecto de Vercel:

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyByJkvCz1HfwV7J5rpauSN_-2a_KtUhpaE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ventas-1f6f6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ventas-1f6f6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ventas-1f6f6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=232405243003
NEXT_PUBLIC_FIREBASE_APP_ID=1:232405243003:web:1d443722c7aa20f85d3ede
```

## Pasos para Desplegar en Vercel

1. **Conectar el repositorio a Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub

2. **Configurar variables de entorno**
   - En el dashboard de Vercel, ve a tu proyecto
   - Ve a Settings > Environment Variables
   - Agrega cada una de las variables de Firebase listadas arriba

3. **Configurar dominio autorizado en Firebase**
   - Ve a [Firebase Console](https://console.firebase.google.com)
   - Selecciona tu proyecto `ventas-1f6f6`
   - Ve a Authentication > Settings > Authorized domains
   - Agrega tu dominio de Vercel (ejemplo: `tu-app.vercel.app`)

4. **Desplegar**
   - Haz push a tu rama principal
   - Vercel desplegará automáticamente

## Funcionalidades Implementadas

### ✅ Autenticación con Google
- Login/logout con Google Auth
- Protección de rutas
- Persistencia de sesión

### ✅ PWA (Progressive Web App)
- Instalable en dispositivos móviles y desktop
- Botón de instalación automático
- Manifest.json configurado
- Service Worker listo

### ✅ Responsive Design
- Optimizado para móvil y desktop
- UI moderna con Tailwind CSS
- Componentes accesibles

### ✅ Funcionalidades de Negocio
- Gestión de cobros
- Gestión de pagos
- Historial de transacciones
- Almacenamiento local con IndexedDB

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start
```

## Estructura del Proyecto

```
ventas/
├── app/                    # App Router de Next.js
├── components/            # Componentes reutilizables
├── contexts/             # Contextos de React (Auth, Cashflow)
├── lib/                  # Utilidades y configuración
├── public/               # Archivos estáticos
└── styles/               # Estilos globales
```

## Tecnologías Utilizadas

- **Next.js 15** - Framework React
- **Firebase Auth** - Autenticación
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconos
- **IndexedDB** - Almacenamiento local
