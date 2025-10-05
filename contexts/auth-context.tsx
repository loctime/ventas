"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithPopup, 
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email || 'No user')
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      
      // Usar popup para todos los dispositivos
      console.log('Using popup for all devices')
      await signInWithPopup(auth, provider)
      setLoading(false)
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
