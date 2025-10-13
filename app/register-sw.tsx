"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function RegisterServiceWorker() {
  const updateToastId = useRef<string | number | null>(null)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      let registration: ServiceWorkerRegistration | null = null

      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          registration = reg
          console.log("✅ Service Worker registered successfully")

          // Verificar actualizaciones cada 30 minutos
          const checkInterval = setInterval(() => {
            console.log("🔄 Checking for SW updates...")
            reg.update()
          }, 30 * 60 * 1000)

          // Verificar actualización al inicio después de 10 segundos
          setTimeout(() => {
            reg.update()
          }, 10000)

          // Detectar cuando hay una nueva versión instalándose
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing
            console.log("🆕 New Service Worker found!")

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                console.log("SW State:", newWorker.state)

                // Si el nuevo SW está instalado y hay uno activo (actualización)
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("🔔 Update available - notifying user")

                  // Mostrar notificación de actualización
                  updateToastId.current = toast("¡Nueva versión disponible! 🎉", {
                    description:
                      "Hay una actualización de la app. Recarga para ver los cambios.",
                    duration: Infinity,
                    action: {
                      label: "Actualizar Ahora",
                      onClick: () => {
                        // Enviar mensaje al SW para que tome control inmediatamente
                        newWorker.postMessage({ type: "SKIP_WAITING" })
                        // Recargar la página
                        window.location.reload()
                      },
                    },
                    cancel: {
                      label: "Después",
                      onClick: () => {
                        console.log("User dismissed update")
                      },
                    },
                  })
                }
              })
            }
          })

          // Detectar cuando el SW toma control
          let refreshing = false
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (refreshing) return
            console.log("🔄 Controller changed - reloading")
            refreshing = true
            window.location.reload()
          })

          return () => {
            clearInterval(checkInterval)
          }
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error)
        })
    } else {
      console.warn("⚠️ Service Workers not supported")
    }
  }, [])

  return null
}
