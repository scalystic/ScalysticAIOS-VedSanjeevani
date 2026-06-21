import { useState, useMemo } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { Card, CardContent }             from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useAppData } from '@/context/AppData'

// ── Types ──────────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d'
type Platform  = 'all' | 'meta' | 'google'

interface DayData {
  label:          string
  spend:          number
  revenue:        number
  metaSpend:      number
  metaRevenue:    number
  googleSpend:    number
  googleRevenue:  number
}

// loose types to avoid fighting recharts' generic hell
type TEntry = { name: string; value: number; color?: string; fill?: string }
type TTooltip = { active?: boolean; payload?: TEntry[]; label?: string }

// ── Brand palette (hex only — recharts can't read CSS vars) ────────────────────

const C = {
  teal:      '#0FA38E',
  mint:      '#35C59A',
  info:      '#3B82F6',
  success:   '#22C55E',
  warning:   '#F59E0B',
  gray:      '#6B7280',
  lightGray: '#E5E7EB',
} as const

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_ORDER  = ['unassigned', 'assigned', 'received', 'active', 'completed']
const STATUS_LABELS: Record<string, string> = {
  unassigned: 'Unassigned', assigned: 'Assigned', received: 'Received',
  active: 'Active', completed: 'Completed',
}
const STATUS_COLORS: Record<string, string> = {
  unassigned: C.gray, assigned: C.info, received: C.teal,
  active: C.success,  completed: C.gray,
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtINR(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}k`
  return `₹${v}`
}
function fmtRoas(v: number): string {
  return v > 0 ? `${v.toFixed(2)}x` : '—'
}
function fmtCount(v: number): string {
  return `${v} items`
}

// ── Daily data — generated once, deterministic ─────────────────────────────────

function buildDailyData(): DayData[] {
  const result: DayData[] = []
  for (let i = 0; i < 90; i++) {
    const d = new Date('2026-06-20')
    d.setDate(d.getDate() - (89 - i))
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const phase     = i / 89
    const growth    = 1 + phase * 0.28
    const wave      = Math.sin(i * 0.42) * 0.12 + Math.cos(i * 0.19) * 0.07
    const spend     = Math.round(12000 * (1 + wave) * (isWeekend ? 1.22 : 1) * growth)
    const roas      = 3.7 + Math.sin(i * 0.18) * 0.35 + phase * 0.4
    const revenue   = Math.round(spend * roas)
    result.push({
      label:         d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      spend,
      revenue,
      metaSpend:     Math.round(spend   * 0.62),
      metaRevenue:   Math.round(revenue * 0.60),
      googleSpend:   Math.round(spend   * 0.38),
      googleRevenue: Math.round(revenue * 0.40),
    })
  }
  return result
}

const ALL_DAILY = buildDailyData()

// ── Shared chart tooltip ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, fmt = fmtINR }: TTooltip & { fmt?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2.5 text-xs min-w-[140px]">
      {label && <p className="font-semibold text-foreground mb-2">{label}</p>}
      {payload.map((e) => {
        const dot = e.color ?? e.fill
        return (
          <div key={e.name} className="flex items-center gap-2 mb-1 last:mb-0">
            {dot && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />}
            <span className="text-gray">{e.name}:</span>
            <span className="font-medium text-foreground ml-auto pl-4">{fmt(e.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Reusable wrappers ──────────────────────────────────────────────────────────

function ChartCard({ title, description, className, children }: {
  title: string; description?: string; className?: string; children: React.ReactNode
}) {
  return (
    <Card className={className}>
      <div className="px-5 pt-5 pb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-gray mt-0.5">{description}</p>}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </Card>
  )
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-5 mt-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-gray">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-4">
        <p className="text-xs text-gray font-medium uppercase tracking-wide">{label}</p>
        <p className={cn('mt-1 text-2xl font-bold', highlight ? 'text-teal' : 'text-foreground')}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Date range toggle ──────────────────────────────────────────────────────────

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '7D',  value: '7d'  },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
]

function DateRangeToggle({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {DATE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer',
            value === o.value
              ? 'bg-deep-green text-off-white'
              : 'text-gray hover:text-foreground hover:bg-light-gray'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [dateRange,     setDateRange]     = useState<DateRange>('30d')
  const [platform,      setPlatform]      = useState<Platform>('all')
  const [agencyFilter,  setAgencyFilter]  = useState('all')
  const [creatorFilter, setCreatorFilter] = useState('all')

  // shared data — campaigns are source of truth for Spend/Revenue/ROAS
  const { contentItems: content, agencyItems: agencies, campaignItems: campaigns, adItems } = useAppData()

  // ── Filter option lists ──
  const creators    = useMemo(() => [...new Set(content.map(c => c.creator))].sort(), [content])
  const agencyNames = useMemo(() => agencies.map(a => a.name), [agencies])

  // ── Campaigns filtered by platform + agency → KPI source of truth ──
  const filteredCampaigns = useMemo(() =>
    campaigns
      .filter(c => platform     === 'all' || c.platform === platform)
      .filter(c => agencyFilter === 'all' || c.agency   === agencyFilter),
    [campaigns, platform, agencyFilter]
  )

  // ── KPI totals — from filtered campaigns ──
  const totalSpend          = filteredCampaigns.reduce((s, c) => s + c.spend,   0)
  const totalRevenue        = filteredCampaigns.reduce((s, c) => s + c.revenue, 0)
  const overallRoas         = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const activeCampaignCount = filteredCampaigns.filter(c => c.status === 'active').length

  // ── Content filtered by creator (for content-centric charts only) ──
  const filteredContent = useMemo(() =>
    content.filter(c => creatorFilter === 'all' || c.creator === creatorFilter),
    [content, creatorFilter]
  )

  // ── Daily trend (date range + platform only — time-series view) ──
  const days      = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const trendData = useMemo(() => {
    const raw = ALL_DAILY.slice(-days)
    return raw.map(d => ({
      label:   d.label,
      Spend:   platform === 'meta' ? d.metaSpend    : platform === 'google' ? d.googleSpend    : d.spend,
      Revenue: platform === 'meta' ? d.metaRevenue  : platform === 'google' ? d.googleRevenue  : d.revenue,
    }))
  }, [days, platform])

  // ── Agency chart ──
  const agencyData = useMemo(() =>
    agencies
      .filter(a => agencyFilter === 'all' || a.name === agencyFilter)
      .filter(a => a.status === 'active' && a.roas > 0)
      .map(a => ({
        name: a.name.length > 17 ? `${a.name.slice(0, 16)}…` : a.name,
        ROAS: a.roas,
        type: a.type,
      }))
      .sort((a, b) => b.ROAS - a.ROAS),
    [agencies, agencyFilter]
  )

  // ── Top content by ROAS — derived from adItems (campaigns are source of truth) ──
  const topContentData = useMemo(() =>
    filteredContent
      .map(c => {
        const cAds    = adItems.filter(a => a.contentId === c.id)
        const cSpend   = cAds.reduce((s, a) => s + a.spend, 0)
        const cRevenue = cAds.reduce((s, a) => s + a.spend * a.roas, 0)
        const cRoas    = cSpend > 0 ? cRevenue / cSpend : 0
        return {
          name: c.name.length > 26 ? `${c.name.slice(0, 25)}…` : c.name,
          ROAS: cRoas,
          type: c.type,
        }
      })
      .filter(c => c.ROAS > 0)
      .sort((a, b) => b.ROAS - a.ROAS)
      .slice(0, 8),
    [filteredContent, adItems]
  )

  // ── Status pipeline — from filtered content ──
  const statusData = STATUS_ORDER.map(s => ({
    status: STATUS_LABELS[s],
    Count:  filteredContent.filter(c => c.status === s).length,
    color:  STATUS_COLORS[s],
  }))

  // ── Content type split — from filtered content ──
  const typeData = [
    { name: 'Video', value: filteredContent.filter(c => c.type === 'video').length, color: C.teal },
    { name: 'Image', value: filteredContent.filter(c => c.type === 'image').length, color: C.mint },
  ]
  const totalContent = filteredContent.length

  const xInterval = dateRange === '7d' ? 0 : dateRange === '30d' ? 3 : 13

  // tooltip factory helpers
  const tip = (fmt: (v: number) => string) =>
    (props: TTooltip) => <ChartTooltip {...props} fmt={fmt} />

  return (
    <div className="p-6 space-y-6">

      {/* ── Header + filters ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Marketing Overview</h1>
          <p className="mt-0.5 text-sm text-gray">Ads performance across all channels.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangeToggle value={dateRange} onChange={setDateRange} />

          <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
            <SelectTrigger className="w-[136px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
            </SelectContent>
          </Select>

          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="w-[158px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agencies</SelectItem>
              {agencyNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={creatorFilter} onValueChange={setCreatorFilter}>
            <SelectTrigger className="w-[148px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Creators</SelectItem>
              {creators.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Spend"        value={fmtINR(totalSpend)}            sub={`${filteredCampaigns.length} campaigns`} />
        <StatCard label="Total Revenue"      value={fmtINR(totalRevenue)}          sub="From campaign conversions" />
        <StatCard label="Overall ROAS"       value={fmtRoas(overallRoas)}          highlight />
        <StatCard label="Active Campaigns"   value={String(activeCampaignCount)}   sub="Currently running" />
      </div>

      {/* ── Spend & Revenue trend ── */}
      <ChartCard
        title="Spend & Revenue"
        description={
          `Daily · last ${days} days` +
          (platform !== 'all' ? ` · ${platform === 'meta' ? 'Meta Ads' : 'Google Ads'}` : '')
        }
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.teal} stopOpacity={0.2} />
                <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.mint} stopOpacity={0.2} />
                <stop offset="95%" stopColor={C.mint} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: C.gray }}
              axisLine={false} tickLine={false}
              interval={xInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: C.gray }}
              axisLine={false} tickLine={false}
              tickFormatter={fmtINR}
              width={54}
            />
            <RechartTooltip content={tip(fmtINR)} />
            <Area type="monotone" dataKey="Spend"   name="Spend"   stroke={C.teal} strokeWidth={2} fill="url(#gSpend)"   dot={false} />
            <Area type="monotone" dataKey="Revenue" name="Revenue" stroke={C.mint} strokeWidth={2} fill="url(#gRevenue)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ label: 'Spend', color: C.teal }, { label: 'Revenue', color: C.mint }]} />
      </ChartCard>

      {/* ── Agency ROAS | Top Content ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        <ChartCard
          title="ROAS by Agency"
          description={agencyFilter !== 'all' ? agencyFilter : 'All active agencies'}
        >
          {agencyData.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray">No agency data for the selected filter.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart layout="vertical" data={agencyData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: C.gray }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}x`}
                    domain={[0, 'dataMax + 0.5']}
                  />
                  <YAxis
                    type="category" dataKey="name"
                    tick={{ fontSize: 11, fill: C.gray }}
                    axisLine={false} tickLine={false}
                    width={118}
                  />
                  <RechartTooltip content={tip(fmtRoas)} />
                  <Bar dataKey="ROAS" name="ROAS" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {agencyData.map((e) => (
                      <Cell key={e.name} fill={e.type === 'performance' ? C.info : C.teal} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend items={[
                { label: 'Performance', color: C.info  },
                { label: 'Creator',     color: C.teal  },
              ]} />
            </>
          )}
        </ChartCard>

        <ChartCard
          title="Top Content by ROAS"
          description={creatorFilter !== 'all' ? `Creator: ${creatorFilter}` : 'All creators · top 8'}
        >
          {topContentData.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray">No content data for the selected filter.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart layout="vertical" data={topContentData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: C.gray }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}x`}
                    domain={[0, 'dataMax + 0.5']}
                  />
                  <YAxis
                    type="category" dataKey="name"
                    tick={{ fontSize: 11, fill: C.gray }}
                    axisLine={false} tickLine={false}
                    width={162}
                  />
                  <RechartTooltip content={tip(fmtRoas)} />
                  <Bar dataKey="ROAS" name="ROAS" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {topContentData.map((e) => (
                      <Cell key={e.name} fill={e.type === 'video' ? C.teal : C.mint} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend items={[
                { label: 'Video', color: C.teal },
                { label: 'Image', color: C.mint },
              ]} />
            </>
          )}
        </ChartCard>

      </div>

      {/* ── Status pipeline | Content type split ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        <ChartCard title="Content Status Pipeline" description="Items at each lifecycle stage">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} vertical={false} />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 11, fill: C.gray }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: C.gray }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <RechartTooltip content={tip(fmtCount)} />
              <Bar dataKey="Count" name="Count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {statusData.map((e) => (
                  <Cell key={e.status} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Content Type Split" description="Video vs Image">
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%" cy="50%"
                  innerRadius={58} outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {typeData.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <RechartTooltip content={tip(fmtCount)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-4 pl-2 pr-4">
              {typeData.map((e) => (
                <div key={e.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="text-xs text-gray">{e.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground pl-4">{e.value}</p>
                  <p className="text-xs text-gray pl-4">{Math.round((e.value / totalContent) * 100)}% of total</p>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

      </div>
    </div>
  )
}
