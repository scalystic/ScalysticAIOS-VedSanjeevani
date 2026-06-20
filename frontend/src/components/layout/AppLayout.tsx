import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@/store/ui'
import { cn } from '@/lib/utils'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content shifts right by sidebar width */}
      <main
        className={cn(
          'transition-[margin-left] duration-300 ease-in-out min-h-screen',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-60'
        )}
      >
        {children}
      </main>
    </div>
  )
}
