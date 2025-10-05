"use client"

import type React from "react"
import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCashflow } from "@/contexts/cashflow-context"

interface AddPaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddPaymentMethodModal({ isOpen, onClose }: AddPaymentMethodModalProps) {
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("💳")
  const [color, setColor] = useState("#10b981")
  const { addCustomPaymentMethod } = useCashflow()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    addCustomPaymentMethod({
      name: name.trim(),
      icon,
      color,
    })

    setName("")
    setIcon("💳")
    setColor("#10b981")
    onClose()
  }

  const predefinedColors = [
    "#10b981", // verde
    "#ef4444", // rojo
    "#3b82f6", // azul
    "#f59e0b", // amarillo
    "#8b5cf6", // púrpura
    "#06b6d4", // cian
    "#84cc16", // lima
    "#f97316", // naranja
  ]

  const predefinedIcons = [
    "💳", "💰", "🏦", "💎", "🎯", "⚡", "🔔", "📱", "💻", "🛒", "🎨", "🔧"
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-balance">Agregar Método de Pago</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Nombre del Método *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Ej: PayPal, Bizum, Cheque..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
              autoFocus
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Icono</Label>
            <div className="grid grid-cols-6 gap-2">
              {predefinedIcons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`h-12 w-12 rounded-lg border-2 text-xl flex items-center justify-center transition-colors ${
                    icon === emoji
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Input
              type="text"
              placeholder="O escribe tu emoji personalizado"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="h-12 text-center text-xl"
              maxLength={2}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {predefinedColors.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`h-12 w-12 rounded-lg border-2 transition-all ${
                    color === colorOption
                      ? "border-foreground scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-12 w-20 p-1"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#10b981"
                className="h-12 flex-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold"
            style={{
              backgroundColor: color,
              color: "white",
            }}
            disabled={!name.trim()}
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Método
          </Button>
        </form>
      </div>
    </div>
  )
}
