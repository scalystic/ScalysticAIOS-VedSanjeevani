import './index.css'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-10 space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-deep-green">VedSanjeevani AIOS</h1>
        <p className="text-muted-foreground mt-1">Scalystic Color System — all Tailwind utilities, no raw hex</p>
      </div>

      {/* Primary */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate mb-3">Primary</h2>
        <div className="flex gap-3">
          <Swatch label="Deep Green" cls="bg-deep-green" />
          <Swatch label="Forest Green" cls="bg-forest-green" />
          <Swatch label="Sage Green" cls="bg-sage-green" />
          <Swatch label="Mint" cls="bg-mint border border-light-gray" dark={false} />
        </div>
      </section>

      {/* Accent */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate mb-3">Accent</h2>
        <div className="flex gap-3">
          <Swatch label="Teal" cls="bg-teal" />
          <Swatch label="Mint Green" cls="bg-mint-green" />
        </div>
      </section>

      {/* Neutral */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate mb-3">Neutral</h2>
        <div className="flex gap-3">
          <Swatch label="Charcoal" cls="bg-charcoal" />
          <Swatch label="Slate" cls="bg-slate" />
          <Swatch label="Gray" cls="bg-gray" />
          <Swatch label="Light Gray" cls="bg-light-gray border border-light-gray" dark={false} />
          <Swatch label="Off White" cls="bg-off-white border border-light-gray" dark={false} />
        </div>
      </section>

      {/* Semantic */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate mb-3">Semantic</h2>
        <div className="flex gap-3">
          <Swatch label="Success" cls="bg-success" />
          <Swatch label="Warning" cls="bg-warning" />
          <Swatch label="Info" cls="bg-info" />
          <Swatch label="Error" cls="bg-error" />
        </div>
      </section>

      {/* Gradient */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate mb-3">Gradient</h2>
        <div className="h-16 rounded-lg bg-gradient-to-r from-deep-green via-forest-green to-mint-green" />
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate mb-3">Components</h2>
        <div className="flex gap-3 flex-wrap">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>
    </div>
  )
}

function Swatch({ label, cls, dark = true }: { label: string; cls: string; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-20 h-20 rounded-xl ${cls}`} />
      <span className={`text-xs font-medium ${dark ? 'text-foreground' : 'text-slate'}`}>{label}</span>
    </div>
  )
}

export default App
