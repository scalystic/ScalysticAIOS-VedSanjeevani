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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(v: number) {
  if (v === 0) return '—'
  if (v >= 10_00_000) return `₹${(v / 10_00_000).toFixed(2)}Cr`
  if (v >= 1_00_000)  return `₹${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(0)}K`
  return `₹${v}`
}

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
      const running = linked.filter((c) => c.status === 'running').length
      const totalSpend   = linked.reduce((s, c) => s + c.spend, 0)
      const totalRevenue = linked.reduce((s, c) => s + c.revenue, 0)
      const avgRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0
      return { ...p, contentCount: linked.length, runningCount: running, totalSpend, totalRevenue, avgRoas }
    })
  }, [productItems, contentItems])

  // KPI aggregates
  const totalProducts   = productItems.length
  const activeProducts  = productItems.filter((p) => p.status === 'active').length
  const totalContent    = contentItems.length
  const runningContent  = contentItems.filter((c) => c.status === 'running').length
  const totalSpend      = contentItems.reduce((s, c) => s + c.spend, 0)
  const totalRevenue    = contentItems.reduce((s, c) => s + c.revenue, 0)
  const overallRoas     = totalSpend > 0 ? totalRevenue / totalSpend : 0

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
            <p className="text-sm text-gray">{totalProducts} products · {totalContent} content pieces</p>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Products"  value={String(totalProducts)}  icon={Package} />
        <KpiCard label="Active"          value={String(activeProducts)}  sub={`${Math.round(activeProducts / totalProducts * 100)}% of catalog`} />
        <KpiCard label="Total Content"   value={String(totalContent)}   icon={FileVideo} />
        <KpiCard label="Running"         value={String(runningContent)} icon={PlayCircle} sub="live in campaigns" />
        <KpiCard label="Combined Spend"  value={fmtINR(totalSpend)}     icon={TrendingUp} />
        <KpiCard label="Avg ROAS"        value={fmtRoas(overallRoas)}   sub="across all content" />
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
              <TableHead className="hidden sm:table-cell text-right">Running</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Spend</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Revenue</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-gray text-sm">
                  No products match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => navigate(`/marketing/products/${p.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/10">
                      <Package className="h-4 w-4 text-teal" />
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      <p className="text-[11px] text-gray">{p.sku} · ₹{p.price}</p>
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

                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1 tabular-nums font-semibold text-sm text-foreground">
                    {p.contentCount}
                    <span className="hidden sm:inline text-[10px] text-gray font-normal">pcs</span>
                  </span>
                </TableCell>

                <TableCell className="hidden sm:table-cell text-right">
                  {p.runningCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-success tabular-nums">
                      <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                      {p.runningCount}
                    </span>
                  ) : (
                    <span className="text-sm text-gray">—</span>
                  )}
                </TableCell>

                <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                  {fmtINR(p.totalSpend)}
                </TableCell>

                <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                  {fmtINR(p.totalRevenue)}
                </TableCell>

                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {p.avgRoas > 0 ? (
                    <span className={cn(
                      'font-semibold text-sm',
                      p.avgRoas >= 4 ? 'text-success' : p.avgRoas >= 3 ? 'text-warning' : 'text-error'
                    )}>
                      {fmtRoas(p.avgRoas)}
                    </span>
                  ) : <span className="text-sm text-gray">—</span>}
                </TableCell>

                <TableCell>
                  <ChevronRight className="h-4 w-4 text-gray/60" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ── Type legend ── */}
      <div className="flex items-center gap-4 text-xs text-gray">
        <span className="flex items-center gap-1.5"><FileVideo className="h-3.5 w-3.5" /> Video content</span>
        <span className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Image content</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success inline-block" /> Running live</span>
      </div>

    </div>
  )
}
