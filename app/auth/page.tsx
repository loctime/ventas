"use client"

import { useEffect } from "react"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function AuthPage() {
  useEffect(() => {
    const handleAuth = async () => {
      try {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        
        if (result.user) {
          // Cerrar esta ventana y notificar a la ventana padre
          window.opener?.postMessage({ 
            type: 'AUTH_SUCCESS', 
            user: result.user 
          }, window.location.origin)
          window.close()
        }
      } catch (error) {
        console.error('Auth error:', error)
        // Notificar error a la ventana padre
        window.opener?.postMessage({ 
          type: 'AUTH_ERROR', 
          error: error.message 
        }, window.location.origin)
        window.close()
      }
    }

    handleAuth()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Iniciando sesión con Google...</p>
      </div>
    </div>
  )
}
