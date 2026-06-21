import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft, Package, FileVideo, Image as ImageIcon,
  PlayCircle, CheckCircle2, Clock, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardContent }      from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

import {
  useAppData,
  type ProductCategory,
  type ProductStatus,
  type ContentStatus,
  type ContentType,
  type ContentCategory,
} from '@/context/AppData'

// ── Config maps ────────────────────────────────────────────────────────────────

const PRODUCT_STATUS_VARIANT: Record<ProductStatus, BadgeProps['variant']> = {
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
  womens_health:"Women's Health",
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

const CONTENT_STATUS_ORDER: ContentStatus[] = [
  'unassigned', 'assigned', 'received', 'active', 'completed',
]

const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  unassigned: 'Unassigned',
  assigned:   'Assigned',
  received:   'Received',
  active:     'Active',
  completed:  'Completed',
}

const CONTENT_STATUS_COLOR: Record<ContentStatus, { bar: string; badge: BadgeProps['variant'] }> = {
  unassigned: { bar: 'bg-gray',    badge: 'muted'   },
  assigned:   { bar: 'bg-info',    badge: 'info'    },
  received:   { bar: 'bg-teal',    badge: 'teal'    },
  active:     { bar: 'bg-success', badge: 'success' },
  completed:  { bar: 'bg-gray',    badge: 'muted'   },
}

const CONTENT_TYPE_LABEL: Record<ContentType, string>    = { video: 'Video', image: 'Image' }
const CONTENT_CATEGORY_LABEL: Record<ContentCategory, string> = {
  ugc:         'UGC',
  founder_led: 'Founder Led',
  team:        'Team',
  brand:       'Brand',
}

const CONTENT_CATEGORY_COLOR: Record<ContentCategory, string> = {
  ugc:         'bg-info/10 text-info',
  founder_led: 'bg-warning/10 text-warning',
  team:        'bg-teal/10 text-teal',
  brand:       'bg-mint/10 text-mint-green',
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

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string
  icon?: React.ElementType; accent?: string
}) {
  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <p className="text-xs text-gray font-medium uppercase tracking-wide">{label}</p>
          {Icon && <Icon className={cn('h-4 w-4 shrink-0', accent ?? 'text-gray/60')} />}
        </div>
        <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Status Pipeline ───────────────────────────────────────────────────────────

function StatusPipeline({ counts, total }: { counts: Record<ContentStatus, number>; total: number }) {
  const maxCount = Math.max(...Object.values(counts), 1)
  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-5">
        <p className="text-xs text-gray font-semibold uppercase tracking-wide mb-4">Content Pipeline</p>
        <div className="space-y-3">
          {CONTENT_STATUS_ORDER.map((status) => {
            const count = counts[status]
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0
            const { bar } = CONTENT_STATUS_COLOR[status]
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-20 text-xs text-gray shrink-0 text-right">{CONTENT_STATUS_LABEL[status]}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', bar)}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <div className="w-14 flex items-center justify-end gap-1.5 shrink-0">
                  <span className="text-sm font-semibold text-foreground tabular-nums">{count}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-gray tabular-nums">({pct}%)</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-[11px] text-gray border-t border-border pt-3">
          {total} total piece{total !== 1 ? 's' : ''} in the pipeline
        </p>
      </CardContent>
    </Card>
  )
}

// ── Split Card (type or category breakdown) ───────────────────────────────────

function SplitCard<K extends string>({
  title, rows, total,
}: {
  title: string
  rows: { key: K; label: string; colorClass: string; count: number }[]
  total: number
}) {
  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-5">
        <p className="text-xs text-gray font-semibold uppercase tracking-wide mb-4">{title}</p>
        {total === 0 ? (
          <p className="text-sm text-gray italic">No content yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.filter((r) => r.count > 0).map((r) => {
              const pct = Math.round((r.count / total) * 100)
              return (
                <div key={r.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 font-semibold', r.colorClass)}>
                      {r.label}
                    </span>
                    <span className="text-gray tabular-nums">{r.count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal/70 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { productItems, contentItems } = useAppData()

  const product = productItems.find((p) => p.id === id)

  // All content linked to this product (matched by name)
  const linked = useMemo(
    () => contentItems.filter((c) => c.product === product?.name),
    [contentItems, product]
  )

  // Status distribution
  const statusCounts = useMemo(() => {
    const map = {} as Record<ContentStatus, number>
    for (const s of CONTENT_STATUS_ORDER) map[s] = 0
    for (const c of linked) map[c.status] = (map[c.status] ?? 0) + 1
    return map
  }, [linked])

  // Type distribution
  const typeCounts = useMemo(() => {
    return {
      video: linked.filter((c) => c.type === 'video').length,
      image: linked.filter((c) => c.type === 'image').length,
    }
  }, [linked])

  // Category distribution
  const catCounts = useMemo(() => {
    const map: Partial<Record<ContentCategory, number>> = {}
    for (const c of linked) map[c.category] = (map[c.category] ?? 0) + 1
    return map as Record<ContentCategory, number>
  }, [linked])

  // Performance aggregates
  const totalSpend   = linked.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = linked.reduce((s, c) => s + c.revenue, 0)
  const avgRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const totalCampaigns = linked.reduce((s, c) => s + c.campaignCount, 0)

  // Counts
  const videoCount   = typeCounts.video
  const imageCount   = typeCounts.image
  const activeCount  = statusCounts.active
  const totalCount   = linked.length

  if (!product) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/marketing/products')}
          className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Products
        </button>
        <p className="text-gray">Product not found.</p>
      </div>
    )
  }

  const typeRows = [
    { key: 'video' as ContentType, label: 'Video',  colorClass: 'bg-info/10 text-info',    count: videoCount },
    { key: 'image' as ContentType, label: 'Image',  colorClass: 'bg-teal/10 text-teal',    count: imageCount },
  ]

  const catRows = (['ugc', 'founder_led', 'team', 'brand'] as ContentCategory[]).map((k) => ({
    key: k,
    label: CONTENT_CATEGORY_LABEL[k],
    colorClass: CONTENT_CATEGORY_COLOR[k],
    count: catCounts[k] ?? 0,
  }))

  return (
    <div className="p-6 space-y-6">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/marketing/products')}
        className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" /> Products
      </button>

      {/* ── Product header ── */}
      <div className="flex items-start gap-4 flex-wrap justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/10">
            <Package className="h-6 w-6 text-teal" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
              <Badge variant={PRODUCT_STATUS_VARIANT[product.status]}>
                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
              </Badge>
              <span className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                CATEGORY_COLOR[product.category]
              )}>
                {CATEGORY_LABEL[product.category]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray">
              <span>SKU: <span className="font-medium text-slate">{product.sku}</span></span>
              <span>Price: <span className="font-medium text-slate">₹{product.price}</span></span>
              <span>Launched: <span className="font-medium text-slate">{fmtDate(product.launchDate)}</span></span>
            </div>
            <p className="mt-1.5 text-sm text-gray max-w-xl">{product.description}</p>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Content"
          value={totalCount}
          sub={totalCount === 0 ? 'None created yet' : `${totalCampaigns} campaign runs`}
          icon={FileVideo}
          accent="text-teal"
        />
        <KpiCard
          label="Active Now"
          value={activeCount}
          sub={totalCount > 0 ? `${Math.round(activeCount / totalCount * 100)}% of content` : '—'}
          icon={PlayCircle}
          accent={activeCount > 0 ? 'text-success' : 'text-gray/60'}
        />
        <KpiCard
          label="Videos"
          value={videoCount}
          sub={totalCount > 0 ? `${Math.round(videoCount / totalCount * 100)}% of mix` : '—'}
          icon={FileVideo}
        />
        <KpiCard
          label="Images"
          value={imageCount}
          sub={totalCount > 0 ? `${Math.round(imageCount / totalCount * 100)}% of mix` : '—'}
          icon={ImageIcon}
        />
        <KpiCard
          label="Total Spend"
          value={fmtINR(totalSpend)}
          sub={totalRevenue > 0 ? `Rev ${fmtINR(totalRevenue)}` : 'No spend yet'}
          icon={TrendingUp}
        />
        <KpiCard
          label="Avg ROAS"
          value={fmtRoas(avgRoas)}
          sub="blended across content"
          icon={CheckCircle2}
          accent={avgRoas >= 4 ? 'text-success' : avgRoas >= 3 ? 'text-warning' : avgRoas > 0 ? 'text-error' : 'text-gray/60'}
        />
      </div>

      {/* ── Content analytics ── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Content Analytics
          <span className="ml-2 text-sm font-normal text-gray">
            — {totalCount} piece{totalCount !== 1 ? 's' : ''} associated with this product
          </span>
        </h2>

        {totalCount === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray text-sm">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
              No content has been created for this product yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatusPipeline counts={statusCounts} total={totalCount} />
            <SplitCard title="Content Type" rows={typeRows} total={totalCount} />
            <SplitCard title="Content Category" rows={catRows} total={totalCount} />
          </div>
        )}
      </div>

      {/* ── Content table ── */}
      {totalCount > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            All Content
            <span className="ml-2 text-sm font-normal text-gray">({totalCount})</span>
          </h2>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Spend</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linked.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/marketing/contents/${c.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-card border border-border text-gray">
                          {c.type === 'video'
                            ? <FileVideo className="h-3 w-3" />
                            : <ImageIcon className="h-3 w-3" />
                          }
                        </span>
                        <span className="font-medium text-sm text-foreground">{c.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-slate capitalize">
                        {CONTENT_TYPE_LABEL[c.type]}
                      </span>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <span className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                        CONTENT_CATEGORY_COLOR[c.category]
                      )}>
                        {CONTENT_CATEGORY_LABEL[c.category]}
                      </span>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-slate">{c.creator}</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={CONTENT_STATUS_COLOR[c.status].badge} className="text-[11px]">
                        {CONTENT_STATUS_LABEL[c.status]}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 text-sm tabular-nums font-medium text-foreground">
                        <Clock className="h-3 w-3 text-gray/60" />
                        {c.campaignCount > 0 ? c.campaignCount : '—'}
                      </span>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                      {fmtINR(c.spend)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {c.roas > 0 ? (
                        <span className={cn(
                          'font-semibold text-sm',
                          c.roas >= 4 ? 'text-success' : c.roas >= 3 ? 'text-warning' : 'text-error'
                        )}>
                          {fmtRoas(c.roas)}
                        </span>
                      ) : <span className="text-sm text-gray">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

    </div>
  )
}
