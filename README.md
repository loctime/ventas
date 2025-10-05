# Control de Flujo de Caja - PWA

Una aplicación web progresiva (PWA) móvil-first para pequeños negocios que necesitan registrar y monitorear su flujo de caja diario de manera simple y rápida.

## Características

### Registro de Transacciones
- **Cobros (Ingresos)**: Registra entradas de dinero con tres métodos de pago
- **Pagos (Gastos)**: Registra salidas de dinero con soporte para pagos recurrentes
- **Métodos de Pago**: Efectivo, Tarjeta y Transferencia

### Pagos Recurrentes
Los gastos pueden marcarse como recurrentes con las siguientes frecuencias:
- Semanal
- Mensual
- Anual

### Historial y Análisis
- **Resumen Financiero**: Visualiza ingresos totales, gastos totales y balance
- **Filtros por Período**: Agrupa transacciones por día, semana, mes o año
- **Filtros por Tipo**: Visualiza todas las transacciones, solo ingresos o solo gastos
- **Detalles Completos**: Cada transacción muestra método de pago, monto, nota y fecha

### Características Técnicas
- **PWA**: Instalable en dispositivos móviles como una app nativa
- **Offline First**: Funciona completamente sin conexión a internet
- **Almacenamiento Local**: Todos los datos se guardan en el navegador
- **Diseño Mobile-First**: Optimizado para uso en smartphones
- **Interfaz Intuitiva**: Botones grandes y navegación simple

## Tecnologías

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui
- **Almacenamiento**: localStorage
- **Iconos**: Lucide React

## Instalación

### Opción 1: Usar el CLI de shadcn (Recomendado)

\`\`\`bash
npx shadcn@latest init
\`\`\`

Sigue las instrucciones y selecciona instalar desde un proyecto existente.

### Opción 2: Instalación Manual

1. Descarga el proyecto como ZIP
2. Extrae los archivos
3. Instala las dependencias:

\`\`\`bash
npm install
\`\`\`

4. Inicia el servidor de desarrollo:

\`\`\`bash
npm run dev
\`\`\`

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Uso

### Registrar un Cobro (Ingreso)
1. Navega a la pestaña "Cobros"
2. Selecciona el método de pago (Efectivo, Tarjeta o Transferencia)
3. Ingresa el monto
4. Opcionalmente agrega una nota descriptiva
5. Presiona "Agregar Cobro"

### Registrar un Pago (Gasto)
1. Navega a la pestaña "Pagos"
2. Selecciona el método de pago
3. Ingresa el monto
4. Opcionalmente agrega una nota
5. Si es un pago recurrente, activa el switch y selecciona la frecuencia
6. Presiona "Agregar Pago"

### Ver el Historial
1. Navega a la pestaña "Historial"
2. Visualiza el resumen con ingresos totales, gastos totales y balance
3. Usa los filtros para agrupar por período (día, semana, mes, año)
4. Filtra por tipo de transacción (todas, ingresos o gastos)
5. Revisa el detalle de cada transacción

## Estructura del Proyecto

\`\`\`
├── app/
│   ├── layout.tsx          # Layout principal con metadata PWA
│   ├── page.tsx            # Página principal con navegación
│   ├── globals.css         # Estilos globales y tokens de diseño
│   └── manifest.json       # Configuración PWA
├── components/
│   ├── collections-tab.tsx      # Pestaña de cobros
│   ├── payments-tab.tsx         # Pestaña de pagos
│   ├── history-tab.tsx          # Pestaña de historial
│   ├── transaction-modal.tsx    # Modal para agregar transacciones
│   └── payment-method-button.tsx # Botón de método de pago
├── contexts/
│   └── cashflow-context.tsx     # Context API para estado global
├── lib/
│   ├── types.ts                 # Tipos TypeScript
│   ├── storage.ts               # Funciones de localStorage
│   └── utils/
│       └── calculations.ts      # Utilidades de cálculo
└── public/
    └── icon-512x512.png         # Icono de la PWA
\`\`\`

## Personalización

### Colores
Los colores se definen en `app/globals.css` usando tokens CSS:
- `--income`: Color para ingresos (verde por defecto)
- `--expense`: Color para gastos (rojo por defecto)

### Moneda
El formato de moneda se puede cambiar en `lib/utils/calculations.ts` en la función `formatCurrency()`.

## Despliegue

### Vercel (Recomendado)

#### Opción 1: Deploy desde GitHub (Recomendado)
1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente que es un proyecto Next.js
3. El deploy se realizará automáticamente en cada push

#### Opción 2: Deploy manual con Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Hacer deploy
vercel

# Para deploy de producción
vercel --prod
```

### Otros Proveedores
La app es compatible con cualquier proveedor que soporte Next.js:
- **Netlify**: Compatible con Next.js estático
- **Cloudflare Pages**: Con Next.js adapter
- **AWS Amplify**: Soporte nativo para Next.js
- **Railway**: Deploy directo desde GitHub

### Variables de Entorno
No se requieren variables de entorno para el funcionamiento básico. La aplicación funciona completamente offline con localStorage.

## Soporte

Para reportar problemas o sugerir mejoras, abre un ticket en el repositorio del proyecto.

## Licencia

MIT
