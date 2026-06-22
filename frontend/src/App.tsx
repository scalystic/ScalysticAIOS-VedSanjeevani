import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'

import { AuthProvider, useAuth }  from '@/context/AuthContext'
import { AppDataProvider }        from '@/context/AppData'
import { AppLayout }              from '@/components/layout/AppLayout'

import LoginPage         from '@/pages/LoginPage'
import AgencyPortal      from '@/pages/agency/AgencyPortal'
import ContentPage       from '@/pages/marketing/ContentPage'
import AgencyPage        from '@/pages/marketing/AgencyPage'
import CampaignPage      from '@/pages/marketing/CampaignPage'
import CampaignDetailPage from '@/pages/marketing/CampaignDetailPage'
import AgencyDetailPage  from '@/pages/marketing/AgencyDetailPage'
import ContentDetailPage from '@/pages/marketing/ContentDetailPage'
import AnalyticsPage     from '@/pages/marketing/AnalyticsPage'
import CreatorDetailPage from '@/pages/marketing/CreatorDetailPage'
import ProductPage       from '@/pages/marketing/ProductPage'
import ProductDetailPage from '@/pages/marketing/ProductDetailPage'

// ── Placeholder ────────────────────────────────────────────────────────────────

function Page({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
    </div>
  )
}

// ── Routed views (reads auth state) ───────────────────────────────────────────

function AppRoutes() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (user.role === 'agency') {
    const slug = user.agencyName ? user.agencyName.toLowerCase().replace(/\s+/g, '-') : 'portal'
    return (
      <Routes>
        <Route path={`/agency/${slug}`} element={<AgencyPortal />} />
        <Route path="*"                 element={<Navigate to={`/agency/${slug}`} replace />} />
      </Routes>
    )
  }

  // Admin / staff
  return (
    <AppLayout>
      <Routes>
        <Route path="/"                       element={<Page title="Home" />} />
        <Route path="/marketing"              element={<AnalyticsPage />} />
        <Route path="/marketing/products"     element={<ProductPage />} />
        <Route path="/marketing/products/:id" element={<ProductDetailPage />} />
        <Route path="/marketing/contents"     element={<ContentPage />} />
        <Route path="/marketing/contents/:id" element={<ContentDetailPage />} />
        <Route path="/marketing/agencies"     element={<AgencyPage />} />
        <Route path="/marketing/agencies/:id" element={<AgencyDetailPage />} />
        <Route path="/marketing/campaigns"    element={<CampaignPage />} />
        <Route path="/marketing/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/marketing/creators/:id" element={<CreatorDetailPage />} />
        <Route path="/settings"               element={<Page title="Settings" />} />
        <Route path="*"                       element={<Navigate to="/marketing" replace />} />
      </Routes>
    </AppLayout>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
