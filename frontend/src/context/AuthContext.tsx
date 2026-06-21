import { createContext, useContext, useState } from 'react'

export type UserRole = 'admin' | 'agency'

export interface AuthUser {
  role:        UserRole
  name:        string
  email:       string
  agencyId?:   string
  agencyName?: string
}

const ADMIN = { email: 'admin@vedsanjeevani.com', password: 'admin@123' }

export const AGENCY_CREDS = [
  { agencyId: 'agc_001', agencyName: 'DigiReach Media', email: 'amit@digireach.com',   name: 'Amit Singh',   password: 'agency@123' },
  { agencyId: 'agc_002', agencyName: 'Brand Nexus',      email: 'karan@brandnexus.co',  name: 'Karan Mehta',  password: 'agency@123' },
  { agencyId: 'agc_003', agencyName: 'Growth Tribe',     email: 'divya@growthtribe.io', name: 'Divya Kapoor', password: 'agency@123' },
]

interface AuthCtxValue {
  user:   AuthUser | null
  login:  (email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthCtxValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  function login(email: string, password: string): { ok: boolean; error?: string } {
    if (email === ADMIN.email && password === ADMIN.password) {
      setUser({ role: 'admin', name: 'Admin', email })
      return { ok: true }
    }
    const cred = AGENCY_CREDS.find(a => a.email === email && a.password === password)
    if (cred) {
      setUser({
        role:       'agency',
        name:       cred.name,
        email:      cred.email,
        agencyId:   cred.agencyId,
        agencyName: cred.agencyName,
      })
      return { ok: true }
    }
    return { ok: false, error: 'Invalid email or password.' }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
