"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { InstallButton } from "@/components/install-button"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User } from "lucide-react"

interface UserHeaderProps {
  showInstallButton?: boolean
  onInstallClick?: () => void
}

export function UserHeader({ showInstallButton, onInstallClick }: UserHeaderProps) {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-card border-b sticky top-0 z-40">
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-balance">ControlVentas <span className="text-sm text-muted-foreground">Flujo de Caja</span></h1>
            
          </div>
          
          <div className="flex items-center gap-2">
            <InstallButton 
              showInstallButton={showInstallButton || false}
              onInstallClick={onInstallClick || (() => {})}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                    <AvatarFallback>
                      {user?.displayName ? getInitials(user.displayName) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.displayName && (
                      <p className="font-medium">{user.displayName}</p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
