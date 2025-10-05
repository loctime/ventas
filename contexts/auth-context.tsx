"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay resultado de redirect
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('Redirect login successful:', result.user)
        }
      } catch (error) {
        console.error('Redirect login error:', error)
      }
    }

    handleRedirectResult()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      
      // Detectar si es dispositivo móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // En móviles, abrir página de auth en nueva pestaña
        console.log('Using new tab for mobile device')
        
        const authUrl = `${window.location.origin}/auth`
        const newWindow = window.open(authUrl, 'auth', 'width=500,height=600,scrollbars=yes,resizable=yes')
        
        if (!newWindow) {
          throw new Error('No se pudo abrir la ventana de autenticación. Por favor, permite ventanas emergentes.')
        }
        
        // Escuchar mensajes de la ventana de auth
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'AUTH_SUCCESS') {
            console.log('Auth successful in new tab')
            window.removeEventListener('message', handleMessage)
            setLoading(false)
          } else if (event.data.type === 'AUTH_ERROR') {
            console.error('Auth error:', event.data.error)
            window.removeEventListener('message', handleMessage)
            setLoading(false)
          }
        }
        
        window.addEventListener('message', handleMessage)
        
        // Monitorear si la ventana se cerró manualmente
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            setLoading(false)
          }
        }, 1000)
        
        // Timeout después de 5 minutos
        setTimeout(() => {
          clearInterval(checkClosed)
          window.removeEventListener('message', handleMessage)
          if (!newWindow.closed) {
            newWindow.close()
          }
          setLoading(false)
        }, 300000)
        
      } else {
        // Usar popup en desktop
        console.log('Using popup for desktop')
        await signInWithPopup(auth, provider)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
