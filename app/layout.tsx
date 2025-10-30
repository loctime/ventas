import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { RegisterServiceWorker } from "./register-sw"
import "./globals.css"

export const metadata: Metadata = {
  title: "Control de Ventas - Gestiona las Finanzas de tu Negocio",
  description: "Registra ingresos y gastos de tu pequeño negocio de manera simple y rápida",
  generator: "controlVentas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Control de Ventas",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Permitir zoom para accesibilidad en dispositivos móviles
  // (no establecer maximumScale ni userScalable=false)
  themeColor: "#10b981",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <RegisterServiceWorker />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
