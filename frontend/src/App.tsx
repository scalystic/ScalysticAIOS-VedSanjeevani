import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'

// ── Placeholder pages ──────────────────────────────────────────────────────────

function Page({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/"                      element={<Page title="Home" />} />
          <Route path="/marketing"             element={<Page title="Marketing — Overview" />} />
          <Route path="/marketing/contents"    element={<Page title="Marketing — Contents" />} />
          <Route path="/marketing/agencies"    element={<Page title="Marketing — Agencies" />} />
          <Route path="/marketing/campaigns"   element={<Page title="Marketing — Campaigns" />} />
          <Route path="/marketing/analytics"   element={<Page title="Marketing — Analytics" />} />
          <Route path="/settings"              element={<Page title="Settings" />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
