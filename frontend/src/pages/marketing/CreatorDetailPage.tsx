import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft, FileVideo, Image, ExternalLink,
  Mail, Phone, Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button }                 from '@/components/ui/button'
import { Card, CardContent }      from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

import {
  useAppData,
  type CreatorType,
  type ContentType,
  type ContentCategory,
  type ContentStatus,
} from '@/context/AppData'

// ── Config maps ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<CreatorType, string> = {
  influencer:  'Influencer',
  ugc_creator: 'UGC Creator',
  in_house:    'In-house',
}
const TYPE_VARIANT: Record<CreatorType, BadgeProps['variant']> = {
  influencer:  'info',
  ugc_creator: 'teal',
  in_house:    'muted',
}

const STATUS_LABEL: Record<ContentStatus, string> = {
  unassigned: 'Unassigned',
  assigned:   'Assigned',
  received:   'Received',
  active:     'Active',
  completed:  'Completed',
}
const STATUS_VARIANT: Record<ContentStatus, BadgeProps['variant']> = {
  unassigned: 'muted',
  assigned:   'info',
  received:   'teal',
  active:     'success',
  completed:  'muted',
}

const CATEGORY_LABEL: Record<ContentCategory, string> = {
  ugc:         'UGC',
  founder_led: 'Founder Led',
  team:        'Team',
  brand:       'Brand',
}
const CATEGORY_COLOR: Record<ContentCategory, string> = {
  ugc:         'bg-info/10 text-info',
  founder_led: 'bg-warning/10 text-warning',
  team:        'bg-teal/10 text-teal',
  brand:       'bg-mint-green/10 text-mint-green',
}

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  video: <FileVideo className="h-4 w-4" />,
  image: <Image     className="h-4 w-4" />,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(v: number) {
  if (v === 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(v)
}
function fmtCompact(v: number) {
  if (v === 0) return '—'
  if (v >= 10_00_000) return `${(v / 10_00_000).toFixed(1)}Cr`
  if (v >= 1_00_000)  return `${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}
function fmtRoas(v: number) { return v > 0 ? `${v.toFixed(2)}x` : '—' }
function fmtPct(v: number)  { return v > 0 ? `${v.toFixed(2)}%` : '—' }

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-4">
        <p className="text-xs text-gray font-medium uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Platform icon ─────────────────────────────────────────────────────────────

function PlatformIcon() {
  return <Link2 className="h-3.5 w-3.5" />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreatorDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { creatorItems, contentItems, adItems } = useAppData()
  const creator = creatorItems.find(c => c.id === id)

  // All content created by this creator
  const myContent = useMemo(
    () => contentItems.filter(c => c.creator === creator?.name),
    [contentItems, creator]
  )

  // Per-content performance from adItems
  const contentPerf = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number; impressions: number; clicks: number; conversions: number }>()
    for (const ad of adItems) {
      if (!ad.contentId) continue
      const ismine = myContent.some(c => c.id === ad.contentId)
      if (!ismine) continue
      const prev = map.get(ad.contentId) ?? { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 }
      map.set(ad.contentId, {
        spend:       prev.spend       + ad.spend,
        revenue:     prev.revenue     + ad.spend * ad.roas,
        impressions: prev.impressions + ad.impressions,
        clicks:      prev.clicks      + ad.clicks,
        conversions: prev.conversions + ad.conversions,
      })
    }
    return map
  }, [adItems, myContent])

  // Totals
  const totalSpend       = [...contentPerf.values()].reduce((s, p) => s + p.spend,    0)
  const totalRevenue     = [...contentPerf.values()].reduce((s, p) => s + p.revenue,  0)
  const totalImpressions = [...contentPerf.values()].reduce((s, p) => s + p.impressions, 0)
  const totalConversions = [...contentPerf.values()].reduce((s, p) => s + p.conversions, 0)
  const overallRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0

  const videoCount = myContent.filter(c => c.type === 'video').length
  const imageCount = myContent.filter(c => c.type === 'image').length

  // Total creator cost (rate × pieces)
  const totalCreatorCost = creator
    ? creator.ratePerVideo * videoCount + creator.ratePerImage * imageCount
    : 0

  if (!creator) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/marketing/creators')}
          className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Creators
        </button>
        <p className="text-gray">Creator not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/marketing/creators')}
        className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" /> Creators
      </button>

      {/* ── Creator header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-deep-green text-off-white text-xl font-bold select-none">
            {creator.name.charAt(0)}
          </span>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{creator.name}</h1>
              <Badge variant={TYPE_VARIANT[creator.type]}>{TYPE_LABEL[creator.type]}</Badge>
              <Badge variant={creator.status === 'active' ? 'success' : 'warning'}>
                {creator.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Handle + platform */}
            {(creator.handle || creator.platform) && (
              <div className="flex items-center gap-2 mt-1.5">
                {creator.platform && (
                  <span className="flex items-center gap-1 text-xs text-gray">
                    <PlatformIcon />
                    {creator.platform}
                  </span>
                )}
                {creator.handle && (
                  <span className="text-sm font-medium text-teal">{creator.handle}</span>
                )}
              </div>
            )}

            {/* Contact */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-gray">
                <Mail className="h-3.5 w-3.5" />
                {creator.contactEmail}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray">
                <Phone className="h-3.5 w-3.5" />
                {creator.contactPhone}
              </span>
              <span className="text-xs text-gray">
                Joined {new Date(creator.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rate card ── */}
      {(creator.ratePerVideo > 0 || creator.ratePerImage > 0) && (
        <Card className="border-l-4 border-l-teal">
          <CardContent className="px-5 py-4">
            <p className="text-xs text-gray font-medium uppercase tracking-wide mb-3">Creator Rates</p>
            <div className="flex flex-wrap items-center gap-6">
              {creator.ratePerVideo > 0 && (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info">
                    <FileVideo className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-gray uppercase tracking-wide">Per Video</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{fmtINR(creator.ratePerVideo)}</p>
                  </div>
                </div>
              )}
              {creator.ratePerImage > 0 && (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Image className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-gray uppercase tracking-wide">Per Image</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{fmtINR(creator.ratePerImage)}</p>
                  </div>
                </div>
              )}
              {totalCreatorCost > 0 && (
                <>
                  <div className="h-8 w-px bg-border hidden sm:block" />
                  <div>
                    <p className="text-[10px] text-gray uppercase tracking-wide">
                      Total Creator Cost ({videoCount}V + {imageCount}I)
                    </p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{fmtINR(totalCreatorCost)}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Performance</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total Content" value={String(myContent.length)} sub={`${videoCount} videos · ${imageCount} images`} />
          <KpiCard label="Total Spend"   value={fmtINR(totalSpend)} />
          <KpiCard label="Total Revenue" value={fmtINR(totalRevenue)} />
          <KpiCard label="Overall ROAS"  value={fmtRoas(overallRoas)} />
          <KpiCard label="Impressions"   value={fmtCompact(totalImpressions)} />
          <KpiCard label="Conversions"   value={totalConversions > 0 ? String(totalConversions) : '—'} />
        </div>
      </div>

      {/* ── Content table: per-piece cost breakdown ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Content by {creator.name}
            <span className="ml-2 text-sm font-normal text-gray">({myContent.length} pieces)</span>
          </h2>
        </div>

        {myContent.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-gray">
              No content assigned to this creator yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Content</TableHead>
                  <TableHead className="hidden sm:table-cell">Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Creator Cost</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Revenue</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Impressions</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">CTR</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {myContent.map(item => {
                  const perf = contentPerf.get(item.id)
                  const adSpend   = perf?.spend       ?? 0
                  const adRevenue = perf?.revenue      ?? 0
                  const imprssns  = perf?.impressions  ?? 0
                  const clicks    = perf?.clicks       ?? 0
                  const roas = adSpend > 0 ? adRevenue / adSpend : 0
                  const ctr  = imprssns > 0 ? (clicks / imprssns) * 100 : 0

                  // Creator cost for this specific piece
                  const creatorCost = item.type === 'video'
                    ? creator.ratePerVideo
                    : creator.ratePerImage

                  return (
                    <TableRow key={item.id}>

                      {/* Content name + type icon */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint text-sage-green">
                            {TYPE_ICON[item.type]}
                          </span>
                          <div className="min-w-0">
                            <button
                              onClick={() => navigate(`/marketing/contents/${item.id}`)}
                              className="font-medium text-foreground hover:text-teal transition-colors cursor-pointer text-left truncate max-w-[180px]"
                            >
                              {item.name}
                            </button>
                            <p className="text-[11px] text-gray truncate">{item.product}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Format (category) */}
                      <TableCell className="hidden sm:table-cell">
                        <span className={cn(
                          'inline-flex items-center rounded px-1.5 py-0 text-[10px] font-semibold leading-4',
                          CATEGORY_COLOR[item.category]
                        )}>
                          {CATEGORY_LABEL[item.category]}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[item.status]} className="text-[11px]">
                          {STATUS_LABEL[item.status]}
                        </Badge>
                      </TableCell>

                      {/* Creator cost for this piece */}
                      <TableCell className="text-right tabular-nums text-sm font-semibold text-foreground whitespace-nowrap">
                        {creatorCost > 0 ? fmtINR(creatorCost) : <span className="text-gray">—</span>}
                      </TableCell>

                      {/* Ad spend */}
                      <TableCell className="text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {fmtINR(adSpend)}
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="hidden md:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {fmtINR(adRevenue)}
                      </TableCell>

                      {/* ROAS */}
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {roas > 0 ? (
                          <span className={cn('font-semibold',
                            roas >= 4 ? 'text-success' : roas >= 3 ? 'text-warning' : 'text-error'
                          )}>
                            {fmtRoas(roas)}
                          </span>
                        ) : <span className="text-gray">—</span>}
                      </TableCell>

                      {/* Impressions */}
                      <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {fmtCompact(imprssns)}
                      </TableCell>

                      {/* CTR */}
                      <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {fmtPct(ctr)}
                      </TableCell>

                      {/* Drive link */}
                      <TableCell className="text-center">
                        {item.driveUrl && (
                          <a
                            href={item.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-gray hover:text-teal transition-colors"
                            title="Open in Drive"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </TableCell>

                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Footer summary */}
            <div className="border-t border-border px-5 py-3 bg-off-white flex flex-wrap items-center gap-x-8 gap-y-1">
              <p className="text-xs text-gray">
                <span className="font-semibold text-foreground">{videoCount}</span> video{videoCount !== 1 ? 's' : ''} ·{' '}
                <span className="font-semibold text-foreground">{imageCount}</span> image{imageCount !== 1 ? 's' : ''}
              </p>
              {totalCreatorCost > 0 && (
                <p className="text-xs text-gray">
                  Total creator cost: <span className="font-semibold text-foreground">{fmtINR(totalCreatorCost)}</span>
                </p>
              )}
              {totalSpend > 0 && (
                <p className="text-xs text-gray">
                  Total ad spend: <span className="font-semibold text-foreground">{fmtINR(totalSpend)}</span>
                </p>
              )}
              {overallRoas > 0 && (
                <p className="text-xs text-gray">
                  Overall ROAS: <span className={cn('font-semibold',
                    overallRoas >= 4 ? 'text-success' : overallRoas >= 3 ? 'text-warning' : 'text-error'
                  )}>{fmtRoas(overallRoas)}</span>
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

    </div>
  )
}
