import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft, FileVideo, Image, Mail, Phone, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button }                 from '@/components/ui/button'
import { Card, CardContent }      from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

import {
  useAppData,
  type ContentStatus,
  type ContentType,
  type AgencyType,
  type AgencyStatus,
} from '@/context/AppData'

// ── Config maps ────────────────────────────────────────────────────────────────

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

const TYPE_LABEL: Record<AgencyType, string> = {
  performance: 'Performance Marketing',
  creator:     'Creator',
}

const AGENCY_STATUS_VARIANT: Record<AgencyStatus, BadgeProps['variant']> = {
  active:   'success',
  inactive: 'muted',
}

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  video: <FileVideo className="h-3.5 w-3.5" />,
  image: <Image     className="h-3.5 w-3.5" />,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtCurrency(v: number) {
  if (v === 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(v)
}

function fmtRoas(v: number) {
  return v > 0 ? `${v.toFixed(2)}x` : '—'
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray">{label}</span>
      <span className="text-xl font-bold text-foreground tabular-nums">{value}</span>
      {sub && <span className="text-[11px] text-gray">{sub}</span>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AgencyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { agencyItems, contentItems, adItems, campaignItems } = useAppData()

  const agency = agencyItems.find((a) => a.id === id)

  // All content assigned to this agency
  const agencyContent = useMemo(
    () => contentItems.filter((c) => c.agency === agency?.name),
    [contentItems, agency]
  )

  // Per-content performance from adItems
  const contentPerf = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number; impressions: number; conversions: number }>()
    for (const ad of adItems) {
      if (!ad.contentId) continue
      const prev = map.get(ad.contentId) ?? { spend: 0, revenue: 0, impressions: 0, conversions: 0 }
      map.set(ad.contentId, {
        spend:       prev.spend       + ad.spend,
        revenue:     prev.revenue     + ad.spend * ad.roas,
        impressions: prev.impressions + ad.impressions,
        conversions: prev.conversions + ad.conversions,
      })
    }
    return map
  }, [adItems])

  // Agency-level totals from campaigns (source of truth)
  const agencyCampaigns = useMemo(
    () => campaignItems.filter((c) => c.agency === agency?.name),
    [campaignItems, agency]
  )
  const totalSpend   = agencyCampaigns.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = agencyCampaigns.reduce((s, c) => s + c.revenue, 0)
  const agencyRoas   = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // Content status breakdown
  const activeCount    = agencyContent.filter((c) => c.status === 'active').length
  const completedCount = agencyContent.filter((c) => c.status === 'completed').length
  const pendingCount   = agencyContent.filter((c) =>
    ['unassigned', 'assigned', 'received'].includes(c.status)
  ).length

  if (!agency) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/marketing/agencies')}
          className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer mb-4">
          <ChevronLeft className="h-4 w-4" /> Agencies
        </button>
        <p className="text-gray">Agency not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/marketing/agencies')}
        className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" /> Agencies
      </button>

      {/* ── Agency header ── */}
      <div className="flex items-start gap-4 flex-wrap justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint text-deep-green text-lg font-bold select-none">
            {agency.name.charAt(0)}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{agency.name}</h1>
              <Badge variant={AGENCY_STATUS_VARIANT[agency.status]}>
                {agency.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray">{TYPE_LABEL[agency.type]}</p>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-gray">
                <Mail className="h-3.5 w-3.5" />{agency.contactEmail}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray">
                <Phone className="h-3.5 w-3.5" />{agency.contactPhone}
              </span>
              <span className="text-xs text-gray">Since {agency.joinedAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <Card>
        <CardContent className="px-6 py-5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="Total Assigned"  value={String(agencyContent.length)} />
            <MetricCard label="Active"           value={String(activeCount)}          sub="Running in ads" />
            <MetricCard label="Pending"         value={String(pendingCount)}         sub="Not yet live" />
            <MetricCard label="Completed"       value={String(completedCount)} />
            <MetricCard label="Total Spend"     value={fmtCurrency(totalSpend)}      sub="From campaigns" />
            <MetricCard label="Agency ROAS"     value={fmtRoas(agencyRoas)} />
          </div>
        </CardContent>
      </Card>

      {/* ── Status breakdown bar ── */}
      {agencyContent.length > 0 && (
        <Card>
          <CardContent className="px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray mb-3">Content Status Breakdown</p>
            <div className="flex rounded-full overflow-hidden h-3 bg-light-gray">
              {(['unassigned','assigned','received','active','completed'] as ContentStatus[]).map((s) => {
                const count = agencyContent.filter((c) => c.status === s).length
                const pct   = (count / agencyContent.length) * 100
                if (pct === 0) return null
                const bg: Record<ContentStatus, string> = {
                  unassigned: 'bg-gray',
                  assigned:   'bg-info',
                  received:   'bg-teal',
                  active:     'bg-success',
                  completed:  'bg-gray',
                }
                return <div key={s} className={cn('h-full transition-all', bg[s])} style={{ width: `${pct}%` }} />
              })}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
              {(['unassigned','assigned','received','active','completed'] as ContentStatus[]).map((s) => {
                const count = agencyContent.filter((c) => c.status === s).length
                if (count === 0) return null
                return (
                  <span key={s} className="flex items-center gap-1.5 text-xs text-gray">
                    <Badge variant={STATUS_VARIANT[s]} className="text-[10px] px-1.5 py-0">
                      {STATUS_LABEL[s]}
                    </Badge>
                    {count}
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Content table ── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Assigned Content
          <span className="ml-2 text-sm font-normal text-gray">({agencyContent.length})</span>
        </h2>

        {agencyContent.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray text-sm">
              No content assigned to this agency yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Content</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Spend</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Revenue</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencyContent.map((item) => {
                  const perf  = contentPerf.get(item.id) ?? { spend: 0, revenue: 0, impressions: 0, conversions: 0 }
                  const roas  = perf.spend > 0 ? perf.revenue / perf.spend : 0

                  return (
                    <TableRow key={item.id}>

                      {/* Content name + type */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint text-sage-green">
                            {TYPE_ICON[item.type]}
                          </span>
                          <div className="min-w-0">
                            <button
                              onClick={() => navigate(`/marketing/contents/${item.id}`)}
                              className="font-medium text-foreground truncate max-w-[200px] hover:text-teal transition-colors cursor-pointer text-left"
                            >
                              {item.name}
                            </button>
                            <p className="text-[11px] text-gray">{item.product}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Creator */}
                      <TableCell className="text-sm text-slate whitespace-nowrap">{item.creator}</TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                      </TableCell>

                      {/* Spend */}
                      <TableCell className="hidden md:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {fmtCurrency(perf.spend)}
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="hidden md:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {fmtCurrency(perf.revenue)}
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

                      {/* View detail */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray hover:text-foreground"
                          onClick={() => navigate(`/marketing/contents/${item.id}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">View content detail</span>
                        </Button>
                      </TableCell>

                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="border-t border-border px-4 py-3">
              <p className="text-xs text-gray">
                <span className="font-medium text-foreground">{activeCount}</span> active
                {' · '}
                <span className="font-medium text-foreground">{pendingCount}</span> pending
                {' · '}
                <span className="font-medium text-foreground">{completedCount}</span> completed
              </p>
            </div>
          </Card>
        )}
      </div>

    </div>
  )
}
