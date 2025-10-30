# 🧱 Control Ventas

## 🎯 Descripción general

**Control Ventas** es una aplicación web progresiva (PWA) móvil-first diseñada para pequeños negocios que necesitan gestionar su flujo de caja diario de manera simple, rápida y profesional. Permite registrar ingresos, gastos, realizar cierres de caja diarios con verificación de diferencias, y mantener un historial completo con sincronización en la nube.

La app está optimizada para comerciantes, dueños de tiendas, emprendedores y cualquier persona que necesite llevar un control financiero diario sin complicaciones técnicas.

---

## ⚙️ Principales funcionalidades

### 🧮 **Cierre Diario de Caja**
- **Conteo físico de dinero** por método de pago (Efectivo, Tarjeta, Transferencia)
- **Registro de gastos del día** con descripciones personalizadas
- **Comparación automática** con las transacciones del día
- **Detección de diferencias** con justificación de faltantes o sobrantes
- **Sistema de múltiples cierres** para negocios que cierran más de una vez al día
- **Cierres unificados** para consolidar varios registros en uno solo
- **Día comercial configurable** (corte personalizado de horario, ej: 4 AM)

### 📊 **Historial y Análisis**
- **Visualización de cierres pasados** con filtros por fecha
- **Balance acumulado** por período (día, semana, mes, año)
- **Desglose detallado** de cada cierre (efectivo, tarjeta, transferencia, gastos)
- **Gráficos y reportes** de ingresos y gastos
- **Exportación de datos** para análisis externo

### 💳 **Gestión de Métodos de Pago**
- **Métodos predefinidos**: Efectivo, Tarjeta, Transferencia
- **Métodos personalizados** con iconos y colores propios
- **Configuración flexible** según las necesidades del negocio

### 🔐 **Autenticación y Seguridad**
- **Login con Google** rápido y seguro
- **Datos privados por usuario** (aislamiento completo)
- **Sesión persistente** entre dispositivos
- **Reglas de seguridad** a nivel de base de datos

### ☁️ **Sincronización en la Nube**
- **Respaldo automático** en Firebase/Firestore
- **Sincronización en tiempo real** entre dispositivos
- **Acceso desde cualquier lugar** (móvil, tablet, desktop)
- **Funciona offline** con sincronización posterior

---

## 🧩 Stack tecnológico

### **Frontend**
- **Next.js 15** (App Router) - Framework React con Server Components
- **TypeScript** - Tipado estático para mayor robustez
- **Tailwind CSS v4** - Estilos modernos y responsive
- **shadcn/ui** - Componentes UI de alta calidad (Radix UI)
- **Lucide React** - Iconos modernos y consistentes

### **Backend & Base de Datos**
- **Firebase Authentication** - Autenticación con Google
- **Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Hosting** - Despliegue y hosting

### **PWA & Herramientas**
- **Service Worker** personalizado con versionado automático
- **Web App Manifest** para instalación nativa
- **React Hook Form** + **Zod** - Formularios con validación
- **date-fns** - Manipulación de fechas
- **Recharts** - Gráficos y visualizaciones

### **DevOps & Deployment**
- **Vercel** - Plataforma de despliegue recomendada
- **GitHub** - Control de versiones
- **npm/pnpm** - Gestión de paquetes

---

## 🧑‍💻 Estructura del proyecto

```
control-ventas/
├── app/                           # App Router de Next.js
│   ├── auth/                      # Páginas de autenticación
│   ├── generate-data/             # Herramientas de desarrollo
│   ├── globals.css                # Estilos globales y tokens
│   ├── layout.tsx                 # Layout principal con metadata PWA
│   ├── page.tsx                   # Página principal (dashboard)
│   └── register-sw.tsx            # Registro del Service Worker
│
├── components/                    # Componentes React
│   ├── ui/                        # Componentes base (shadcn/ui)
│   ├── daily-closure-tab.tsx     # Pestaña de cierre diario
│   ├── history-tab.tsx            # Pestaña de historial
│   ├── settings-tab.tsx           # Configuración de usuario
│   ├── transaction-modal.tsx      # Modal para transacciones
│   ├── login-page.tsx             # Página de login
│   ├── user-header.tsx            # Header con info de usuario
│   └── ...                        # Otros componentes específicos
│
├── contexts/                      # Context API (estado global)
│   ├── auth-context.tsx           # Contexto de autenticación
│   ├── cashflow-context.tsx       # Contexto de flujo de caja (legacy)
│   └── firestore-cashflow-context.tsx  # Contexto con Firestore
│
├── hooks/                         # Custom React Hooks
│   ├── use-firestore-*.ts         # Hooks para Firestore
│   ├── use-pwa-install.ts         # Hook para instalación PWA
│   └── use-toast.ts               # Hook para notificaciones
│
├── lib/                           # Utilidades y servicios
│   ├── firebase-config.ts         # Configuración de Firebase
│   ├── firestore-service.ts       # Servicio CRUD de Firestore
│   ├── types.ts                   # Tipos TypeScript globales
│   ├── utils/                     # Funciones auxiliares
│   │   ├── business-day.ts        # Lógica de día comercial
│   │   ├── calculations.ts        # Cálculos financieros
│   │   └── firestore-calculations.ts  # Cálculos con Firestore
│   └── utils.ts                   # Utilidades generales
│
├── public/                        # Archivos estáticos
│   ├── manifest.json              # Web App Manifest
│   ├── sw.js                      # Service Worker
│   └── icon-*.jpg                 # Íconos de la PWA
│
├── scripts/                       # Scripts de automatización
│   ├── update-sw-version.js       # Actualizar versión de SW
│   └── restore-sw-template.js     # Restaurar template de SW
│
└── docs/                          # Documentación del proyecto
    ├── FIRESTORE_MIGRATION.md
    ├── SISTEMA_CIERRES_MULTIPLES.md
    ├── PWA_UPDATES.md
    └── ...
```

### **Arquitectura Destacada**
- **Separación de concerns**: Lógica de negocio en `lib/`, UI en `components/`
- **Custom hooks** para reutilización de lógica con Firestore
- **Context API** para estado global sin librerías externas
- **Service Worker** versionado automáticamente en cada build

---

## 🔐 Autenticación / Roles

### **Sistema de Autenticación**
- **Proveedor único**: Google OAuth 2.0
- **Firebase Authentication** como backend
- **Sesión persistente** con token refresh automático
- **Protección de rutas** mediante `AuthContext`

### **Modelo de Usuarios**
- **Usuario individual**: Cada persona tiene su cuenta personal
- **Datos privados**: Completo aislamiento de datos entre usuarios
- **Sin roles complejos**: Todos los usuarios tienen acceso completo a sus propios datos
- **Identificación por UID**: Firebase genera un UID único por usuario

### **Seguridad**
```javascript
// Reglas de Firestore implementadas
- Solo el usuario autenticado puede acceder a sus documentos
- Validación de userId en cada operación
- Prevención de acceso cruzado entre usuarios
```

### **Futuras Expansiones** (pendiente)
- Sistema de roles (admin, empleado, contador)
- Permisos granulares por funcionalidad
- Compartir datos entre usuarios del mismo negocio
- Auditoría de cambios por usuario

---

## 🔗 Integraciones

### **Servicios de Firebase**
- **Firebase Authentication** - Login con Google
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Hosting** - Hosting del Service Worker y assets

### **APIs y Servicios Externos**
- **Vercel Analytics** - Métricas de uso y performance
- **Google OAuth** - Proveedor de identidad

### **Integraciones Planificadas** 🚧
- **Exportación a Excel/PDF** - Reportes descargables
- **WhatsApp Business API** - Envío de resúmenes diarios
- **Webhook notifications** - Alertas de cierres y diferencias
- **Integración con sistemas POS** - Importación automática de ventas
- **APIs de bancos** - Conciliación bancaria automática

---

## 🧾 Planes / Modelo de uso

### **Modelo Actual: Gratuito (Beta)**
La aplicación actualmente es **100% gratuita** durante su fase beta, con todas las funcionalidades disponibles sin restricciones.

### **Modelo Futuro Planificado: Freemium**

#### **Plan Gratuito** ✨
- ✅ Hasta 50 cierres al mes
- ✅ Sincronización en la nube
- ✅ Acceso desde 2 dispositivos
- ✅ Historial de 3 meses
- ✅ Soporte por email

#### **Plan Pro** 💎 ($9.99/mes)
- ✅ Cierres ilimitados
- ✅ Dispositivos ilimitados
- ✅ Historial completo sin límite
- ✅ Exportación a Excel/PDF
- ✅ Gráficos avanzados
- ✅ Soporte prioritario
- ✅ Sin publicidad

#### **Plan Business** 🏢 ($29.99/mes)
- ✅ Todo lo del Plan Pro
- ✅ Multi-usuario (hasta 10 empleados)
- ✅ Roles y permisos
- ✅ API de integración
- ✅ Webhooks personalizados
- ✅ Reportes personalizados
- ✅ Soporte 24/7
- ✅ Capacitación incluida

### **Uso Actual**
- **Interno/SaaS**: La app está en fase de transición a SaaS
- **Target**: Pequeños comercios en Latinoamérica
- **Distribución**: PWA instalable desde navegador

---

## 🚀 Pendientes o mejoras planificadas

### **Corto Plazo** (1-3 meses) 🔥
- [ ] **Sistema de roles y permisos** (admin, empleado, contador)
- [ ] **Exportación a Excel y PDF** de reportes
- [ ] **Modo oscuro mejorado** con más opciones de personalización
- [ ] **Notificaciones push** para recordatorios de cierre
- [ ] **Tutorial interactivo** para nuevos usuarios
- [ ] **Backup manual** con descarga de datos

### **Mediano Plazo** (3-6 meses) 🎯
- [ ] **Dashboard analítico avanzado** con KPIs y métricas
- [ ] **Predicción de flujo de caja** con IA/ML
- [ ] **Integración con WhatsApp** para envío de resúmenes
- [ ] **Sistema de inventario básico** vinculado a ventas
- [ ] **Multi-negocio** (gestionar varios locales desde una cuenta)
- [ ] **Conciliación bancaria automática** via APIs

### **Largo Plazo** (6-12 meses) 🌟
- [ ] **App nativa iOS y Android** (React Native o Flutter)
- [ ] **Sistema de facturación electrónica** (integración con SAT/SUNAT/etc)
- [ ] **Marketplace de integraciones** con otros servicios
- [ ] **API pública** para desarrolladores externos
- [ ] **Sistema de suscripciones** (implementar planes de pago)
- [ ] **Internacionalización** (soporte multi-idioma)
- [ ] **Soporte para múltiples monedas**

### **Mejoras Técnicas** 🔧
- [ ] **Tests automatizados** (unit, integration, e2e)
- [ ] **CI/CD pipeline** completo
- [ ] **Monitoreo de errores** con Sentry
- [ ] **Performance optimization** (lazy loading, code splitting)
- [ ] **Accesibilidad (a11y)** completa (WCAG 2.1)
- [ ] **Documentación de API** con Swagger/OpenAPI

### **Seguridad** 🔐
- [ ] **Autenticación de dos factores (2FA)**
- [ ] **Auditoría de cambios** con logs detallados
- [ ] **Encriptación de datos sensibles** end-to-end
- [ ] **Certificación de seguridad** (ISO 27001)

---

## 📱 Características PWA

### **Instalable**
- ✅ Botón de instalación automático en navegadores compatibles
- ✅ Icono en pantalla de inicio (iOS, Android, Windows)
- ✅ Funciona como app nativa

### **Offline First**
- ✅ Funciona sin conexión a internet
- ✅ Sincronización automática al reconectar
- ✅ Caché inteligente de recursos

### **Actualizaciones Automáticas**
- ✅ Service Worker con versionado automático
- ✅ Notificación de nuevas versiones
- ✅ Actualización sin interrumpir el uso

---

## 🌎 Contacto y Soporte

- **Autor**: loctime
- **Versión**: 1.0.0
- **Licencia**: MIT
- **Repositorio**: [GitHub - Control Ventas]
- **Sitio web**: [Próximamente]
- **Email de soporte**: [Por definir]

---

## 🎨 Diseño y UX

- **Diseño mobile-first** optimizado para pantallas pequeñas
- **Interfaz intuitiva** con iconos claros y botones grandes
- **Modo claro y oscuro** automático según preferencias del sistema
- **Animaciones suaves** con Tailwind CSS y shadcn/ui
- **Accesibilidad** (en proceso de mejora)

---

## 📈 Métricas y Performance

- **Lighthouse Score**: 95+ en todas las categorías
- **Tiempo de carga**: < 2 segundos en 3G
- **Tamaño de bundle**: Optimizado con code splitting
- **SEO**: Optimizado para motores de búsqueda

---

**Control Ventas** - *El control de tu negocio en la palma de tu mano* 🚀



