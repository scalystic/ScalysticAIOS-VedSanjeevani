import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Package, Search, ChevronRight,
  TrendingUp, FileVideo, Image, PlayCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button }                 from '@/components/ui/button'
import { Card, CardContent }      from '@/components/ui/card'
import { Input }                  from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

import {
  useAppData,
  type ProductCategory,
  type ProductStatus,
} from '@/context/AppData'

// ── Config maps ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ProductStatus, string> = {
  active:   'Active',
  inactive: 'Inactive',
  draft:    'Draft',
}

const STATUS_VARIANT: Record<ProductStatus, BadgeProps['variant']> = {
  active:   'success',
  inactive: 'muted',
  draft:    'warning',
}

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  adaptogen:    'Adaptogen',
  cognitive:    'Cognitive',
  digestive:    'Digestive',
  immunity:     'Immunity',
  skin:         'Skin',
  joint:        'Joint Care',
  womens_health:'Women\'s Health',
  cardiac:      'Cardiac',
  respiratory:  'Respiratory',
  renal:        'Renal',
  pain_relief:  'Pain Relief',
}

const CATEGORY_COLOR: Record<ProductCategory, string> = {
  adaptogen:    'bg-teal/10 text-teal',
  cognitive:    'bg-info/10 text-info',
  digestive:    'bg-warning/10 text-warning',
  immunity:     'bg-success/10 text-success',
  skin:         'bg-mint/10 text-mint-green',
  joint:        'bg-orange-500/10 text-orange-600',
  womens_health:'bg-pink-500/10 text-pink-600',
  cardiac:      'bg-error/10 text-error',
  respiratory:  'bg-sky-500/10 text-sky-600',
  renal:        'bg-violet-500/10 text-violet-600',
  pain_relief:  'bg-amber-500/10 text-amber-600',
}

// ── Product image thumbnails ──────────────────────────────────────────────────

const PRODUCT_THUMBNAILS: Record<string, string> = {
  prod_001: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=120&h=120&q=80', // Ashwagandha Gold
  prod_002: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=120&h=120&q=80', // Triphala Plus
  prod_003: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=120&h=120&q=80', // Shilajit Resin
  prod_004: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=120&h=120&q=80', // Brahmi Mind
  prod_005: 'https://images.unsplash.com/photo-1564419378734-02a11571593f?auto=format&fit=crop&w=120&h=120&q=80', // Neem Glow
  prod_006: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=120&h=120&q=80', // Haridra Relief
  prod_007: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=120&h=120&q=80', // Moringa Vitals
  prod_008: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=120&h=120&q=80', // Amla Supreme
  prod_009: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=120&h=120&q=80', // Shatavari Balance
  prod_010: 'https://images.unsplash.com/photo-1628258334807-290b28d3eb0f?auto=format&fit=crop&w=120&h=120&q=80', // Giloy Detox
  prod_011: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=120&h=120&q=80', // Arjuna Cardio
  prod_012: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=120&h=120&q=80', // Yashti Comfort
  prod_013: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=120&h=120&q=80', // Punarnava Renal
  prod_014: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=120&h=120&q=80', // Haritaki Digest
  prod_015: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=120&h=120&q=80', // Dashmool Ease
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRoas(v: number) { return v > 0 ? `${v.toFixed(2)}x` : '—' }

function KpiCard({ label, value, sub, icon: Icon }: {
  label: string; value: string; sub?: string; icon?: React.ElementType
}) {
  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <p className="text-xs text-gray font-medium uppercase tracking-wide">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-gray/60 shrink-0" />}
        </div>
        <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const navigate = useNavigate()
  const { productItems, contentItems } = useAppData()

  const [search,   setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState<ProductCategory | 'all'>('all')
  const [statFilter, setStatFilter] = useState<ProductStatus | 'all'>('all')

  // Enrich each product with its content stats
  const enriched = useMemo(() => {
    return productItems.map((p) => {
      const linked = contentItems.filter((c) => c.product === p.name)
      const running = linked.filter((c) => c.status === 'active').length
      const totalSpend   = linked.reduce((s, c) => s + c.spend, 0)
      const totalRevenue = linked.reduce((s, c) => s + c.revenue, 0)
      const avgRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0
      return { ...p, contentCount: linked.length, runningCount: running, totalSpend, totalRevenue, avgRoas }
    })
  }, [productItems, contentItems])

  // KPI aggregates
  const totalProducts    = productItems.length
  const activeProducts   = productItems.filter((p) => p.status === 'active').length
  const draftProducts    = productItems.filter((p) => p.status === 'draft').length
  const withContentCount = enriched.filter((p) => p.contentCount > 0).length
  const noContentCount   = enriched.filter((p) => p.contentCount === 0).length
  const runningNowCount  = enriched.filter((p) => p.runningCount > 0).length

  // Filter + search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return enriched.filter((p) => {
      if (statFilter !== 'all' && p.status !== statFilter) return false
      if (catFilter  !== 'all' && p.category !== catFilter) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      return true
    })
  }, [enriched, search, catFilter, statFilter])

  const categories = useMemo(() => {
    return [...new Set(productItems.map((p) => p.category))].sort() as ProductCategory[]
  }, [productItems])

  // Summary strip computations
  const mostContentProduct = useMemo(() => {
    const withContent = enriched.filter(p => p.contentCount > 0)
    if (withContent.length === 0) return null
    return withContent.reduce((prev, curr) => curr.contentCount > prev.contentCount ? curr : prev, withContent[0])
  }, [enriched])

  const bestProduct = useMemo(() => {
    const withRoas = enriched.filter(p => p.avgRoas > 0)
    if (withRoas.length === 0) return null
    return withRoas.reduce((prev, curr) => curr.avgRoas > prev.avgRoas ? curr : prev, withRoas[0])
  }, [enriched])

  const needsAttentionProduct = useMemo(() => {
    const withRoas = enriched.filter(p => p.avgRoas > 0)
    if (withRoas.length === 0) return null
    const warnings = withRoas.filter(p => p.avgRoas < 2.0)
    if (warnings.length > 0) {
      return warnings.reduce((prev, curr) => curr.avgRoas < prev.avgRoas ? curr : prev, warnings[0])
    }
    return withRoas.reduce((prev, curr) => curr.avgRoas < prev.avgRoas ? curr : prev, withRoas[0])
  }, [enriched])

  return (
    <div className="p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10">
            <Package className="h-5 w-5 text-teal" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Products</h1>
            <p className="text-sm text-gray">{totalProducts} products · {withContentCount} with content</p>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Products"  value={String(totalProducts)}   icon={Package} sub={`${activeProducts} active · ${draftProducts} draft`} />
        <KpiCard label="With Content"    value={String(withContentCount)} icon={FileVideo} sub="have content assigned" />
        <KpiCard label="No Content Yet"  value={String(noContentCount)}  icon={PlayCircle} sub="content gap" />
        <KpiCard label="Running Now"     value={String(runningNowCount)} icon={TrendingUp} sub="live on Meta Ads" />
      </div>

      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/[0.02] to-blue-500/[0.06] border-blue-500/20 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Most Content</p>
              <h3 className="text-base font-bold text-foreground mt-1">{mostContentProduct ? mostContentProduct.name : '—'}</h3>
              <p className="text-xs text-blue-700/80 font-medium mt-0.5">{mostContentProduct ? `${mostContentProduct.contentCount} pieces created` : '—'}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileVideo className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/[0.02] to-emerald-500/[0.06] border-emerald-500/20 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Best Performer</p>
              <h3 className="text-base font-bold text-foreground mt-1">{bestProduct ? bestProduct.name : '—'}</h3>
              <p className="text-xs text-emerald-700/80 font-medium mt-0.5">ROAS {bestProduct ? fmtRoas(bestProduct.avgRoas) : '—'}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/[0.02] to-amber-500/[0.06] border-amber-500/20 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Needs Attention</p>
              <h3 className="text-base font-bold text-foreground mt-1">{needsAttentionProduct ? needsAttentionProduct.name : '—'}</h3>
              <p className="text-xs text-amber-700/80 font-medium mt-0.5">ROAS {needsAttentionProduct ? fmtRoas(needsAttentionProduct.avgRoas) : '—'}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <PlayCircle className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search product or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value as ProductStatus | 'all')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as ProductCategory | 'all')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>

        {(search || statFilter !== 'all' || catFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatFilter('all'); setCatFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-sm text-gray">{filtered.length} of {totalProducts}</span>
      </div>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Content</TableHead>
              <TableHead className="text-right text-foreground font-semibold">ROAS</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray text-sm">
                  No products match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const isWinner = p.avgRoas >= 4.0;
              const isWarning = p.avgRoas > 0 && p.avgRoas < 2.0;
              const isNoRunning = p.runningCount === 0;

              return (
                <TableRow
                  key={p.id}
                  className={cn(
                    "cursor-pointer transition-colors border-l-2",
                    isWinner && "border-l-success bg-success/[0.01] hover:bg-success/[0.03]",
                    isWarning && "border-l-error bg-error/[0.01] hover:bg-error/[0.03]",
                    isNoRunning && "border-l-slate-300 bg-slate-50/40 hover:bg-slate-100/60 opacity-80",
                    !isWinner && !isWarning && !isNoRunning && "border-l-transparent hover:bg-muted/10"
                  )}
                  onClick={() => navigate(`/marketing/products/${p.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {PRODUCT_THUMBNAILS[p.id] ? (
                        <img
                          src={PRODUCT_THUMBNAILS[p.id]}
                          alt={p.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10">
                          <Package className="h-5 w-5 text-teal" />
                        </span>
                      )}
                      <div>
                        <p className={cn("font-semibold text-sm", isNoRunning ? "text-gray-500" : "text-foreground")}>{p.name}</p>
                        <p className="text-[11px] text-gray-400">{p.sku} · ₹{p.price}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <span className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                      CATEGORY_COLOR[p.category]
                    )}>
                      {CATEGORY_LABEL[p.category]}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    {p.contentCount === 0 ? (
                      <span className="text-sm text-gray/50">—</span>
                    ) : (() => {
                      const completed = contentItems.filter(c => c.product === p.name && c.status === 'completed').length
                      const pending   = p.contentCount - p.runningCount - completed
                      return (
                        <span className="inline-flex items-center gap-2.5 tabular-nums text-sm">
                          {p.runningCount > 0 && (
                            <span className="inline-flex items-center gap-1 font-semibold text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block shrink-0" />
                              {p.runningCount}
                            </span>
                          )}
                          {completed > 0 && (
                            <span className="inline-flex items-center gap-1 font-medium text-gray">
                              <span className="inline-block text-[10px] leading-none">✓</span>
                              {completed}
                            </span>
                          )}
                          {pending > 0 && (
                            <span className="inline-flex items-center gap-1 font-medium text-gray">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray/40 inline-block shrink-0" />
                              {pending}
                            </span>
                          )}
                        </span>
                      )
                    })()}
                  </TableCell>

                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {p.avgRoas > 0 ? (
                      <span className={cn(
                        'font-bold text-sm px-2.5 py-1 rounded-md inline-block text-right min-w-[3.5rem]',
                        p.avgRoas >= 4 ? 'bg-success/10 text-success' : p.avgRoas >= 3 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                      )}>
                        {fmtRoas(p.avgRoas)}
                      </span>
                    ) : <span className="text-sm text-gray/50">—</span>}
                  </TableCell>

                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray/60" />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray">
        <span className="flex items-center gap-1.5"><FileVideo className="h-3.5 w-3.5" /> Video</span>
        <span className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Image</span>
        <span className="w-px h-3 bg-border mx-1" />
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success inline-block" /> Running on Meta Ads</span>
        <span className="flex items-center gap-1.5"><span className="text-[10px] leading-none">✓</span> Completed</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gray/40 inline-block" /> Never ran</span>
      </div>

    </div>
  )
}

