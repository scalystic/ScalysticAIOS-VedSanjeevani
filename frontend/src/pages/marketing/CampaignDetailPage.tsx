import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Target, MousePointerClick, Eye, Users, Heart, Play, Download,
  ChevronLeft, ChevronDown, ChevronRight,
  Plus, MoreHorizontal, Pencil, Pause, CirclePlay, Archive,
  FileVideo, Image, ExternalLink,
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, Star, Zap, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button }                 from '@/components/ui/button'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardContent }      from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import {
  useAppData,
  type CampaignObjective,
  type CampaignStatus,
  type AdStatus,
} from '@/context/AppData'

// ── Config maps ────────────────────────────────────────────────────────────────

const OBJECTIVE_LABEL: Record<CampaignObjective, string> = {
  conversions:     'Conversions',
  traffic:         'Traffic',
  awareness:       'Awareness',
  lead_generation: 'Lead Generation',
  engagement:      'Engagement',
  video_views:     'Video Views',
  app_installs:    'App Installs',
}

const OBJECTIVE_ICON: Record<CampaignObjective, React.ReactNode> = {
  conversions:     <Target            className="h-4 w-4" />,
  traffic:         <MousePointerClick className="h-4 w-4" />,
  awareness:       <Eye               className="h-4 w-4" />,
  lead_generation: <Users             className="h-4 w-4" />,
  engagement:      <Heart             className="h-4 w-4" />,
  video_views:     <Play              className="h-4 w-4" />,
  app_installs:    <Download          className="h-4 w-4" />,
}

const CAMPAIGN_STATUS_VARIANT: Record<CampaignStatus, BadgeProps['variant']> = {
  active:   'success',
  paused:   'warning',
  archived: 'muted',
  draft:    'info',
}

const AD_STATUS_VARIANT: Record<AdStatus, BadgeProps['variant']> = {
  active:   'success',
  paused:   'warning',
  archived: 'muted',
}

const AD_STATUS_LABEL: Record<AdStatus, string> = {
  active:   'Active',
  paused:   'Paused',
  archived: 'Archived',
}

// ── Brand palette ─────────────────────────────────────────────────────────────

const C = {
  teal:      '#0FA38E',
  mint:      '#35C59A',
  warning:   '#F59E0B',
  error:     '#EF4444',
  success:   '#22C55E',
  gray:      '#6B7280',
  lightGray: '#E5E7EB',
  deepGreen: '#0F2E25',
  purple:    '#8B5CF6',
} as const

const TODAY = '2026-06-21'
const TODAY_MS = new Date(TODAY).getTime()

// ── AI Insight types ──────────────────────────────────────────────────────────

type InsightType = 'opportunity' | 'anomaly' | 'highlight' | 'prediction' | 'risk'

interface Insight {
  id:          string
  type:        InsightType
  title:       string
  body:        string
  metric:      string
  metricLabel: string
  confidence:  number
}

const INSIGHT_STYLE: Record<InsightType, { label: string; color: string; bg: string; text: string }> = {
  opportunity: { label: 'Opportunity', color: '#0FA38E', bg: 'rgba(15,163,142,0.10)',  text: '#0A8A78' },
  anomaly:     { label: 'Anomaly',     color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  text: '#B45309' },
  highlight:   { label: 'Highlight',   color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  text: '#1D4ED8' },
  prediction:  { label: 'Prediction',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', text: '#6D28D9' },
  risk:        { label: 'Risk',        color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   text: '#B91C1C' },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtCurrency(value: number) {
  if (value === 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(value)
}
function fmtINR(v: number) {
  if (v === 0) return '—'
  if (v >= 10_00_000) return `₹${(v / 10_00_000).toFixed(2)}Cr`
  if (v >= 1_00_000)  return `₹${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(0)}K`
  return `₹${v}`
}
function fmtRoas(value: number) {
  if (value === 0) return '—'
  return `${value.toFixed(2)}x`
}
function fmtCompact(value: number) {
  if (value === 0) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}
function fmtPct(value: number) {
  if (value === 0) return '—'
  return `${value.toFixed(2)}%`
}

function RoasCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-gray">—</span>
  return (
    <span className={cn(
      'font-semibold',
      value >= 4 ? 'text-success' : value >= 3 ? 'text-warning' : 'text-error',
    )}>
      {fmtRoas(value)}
    </span>
  )
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

// ── AI Insight Card ───────────────────────────────────────────────────────────

function AIInsightCard({ insight }: { insight: Insight }) {
  const s    = INSIGHT_STYLE[insight.type]
  const Icon =
    insight.type === 'opportunity' ? TrendingUp   :
    insight.type === 'anomaly'     ? AlertTriangle :
    insight.type === 'highlight'   ? Star          :
    insight.type === 'prediction'  ? Zap           :
    AlertCircle

  return (
    <div
      className="bg-card rounded-xl border border-border flex flex-col hover:shadow-md transition-shadow duration-200"
      style={{ borderTopColor: s.color, borderTopWidth: '3px' }}
    >
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{ background: s.bg, color: s.text }}
          >
            <Icon className="h-2.5 w-2.5" />
            {s.label}
          </span>
          <span className="text-[10px] text-gray tabular-nums shrink-0">{insight.confidence}% conf.</span>
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug">{insight.title}</p>
        <p
          className="text-xs text-gray leading-relaxed"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {insight.body}
        </p>
      </div>
      <div className="px-4 pt-3 pb-4 border-t border-border space-y-2.5">
        <div>
          <p className="text-xl font-bold tabular-nums leading-none" style={{ color: s.color }}>
            {insight.metric}
          </p>
          <p className="text-[10px] text-gray mt-1">{insight.metricLabel}</p>
        </div>
        <div className="space-y-1">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: C.lightGray }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${insight.confidence}%`, background: s.color, opacity: 0.8 }}
            />
          </div>
          <p className="text-[10px] text-gray">AI confidence</p>
        </div>
      </div>
    </div>
  )
}

// ── Campaign Intelligence Panel ───────────────────────────────────────────────

function CampaignIntelligencePanel({
  insights,
  loading,
  campaignName,
}: {
  insights:     Insight[]
  loading:      boolean
  campaignName: string
}) {
  const cols =
    insights.length <= 2 ? 'sm:grid-cols-2' :
    insights.length === 3 ? 'sm:grid-cols-3' :
    insights.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
    'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        borderColor: 'rgba(15,163,142,0.22)',
        background:  'linear-gradient(148deg, rgba(15,163,142,0.04) 0%, transparent 52%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.deepGreen }}
          >
            <Sparkles className="h-4 w-4" style={{ color: C.mint }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Campaign Intelligence</p>
            <p className="text-xs text-gray">
              {loading
                ? `Analysing ad sets, pacing, and creative signals for "${campaignName}"…`
                : `${insights.length} signal${insights.length !== 1 ? 's' : ''} detected · ad sets, budget pacing, creative mix`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn('h-2 w-2 rounded-full', loading ? 'animate-pulse' : '')}
            style={{ background: loading ? C.warning : C.mint }}
          />
          <span className="text-xs text-gray">{loading ? 'Analysing' : 'Live'}</span>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className={`grid gap-3 ${cols}`}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border animate-pulse"
              style={{ height: '228px', borderTopWidth: '3px', borderTopColor: C.lightGray }}
            />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-card rounded-xl border border-border px-6 py-10 text-center">
          <Sparkles className="h-5 w-5 mx-auto mb-2.5" style={{ color: C.gray }} />
          <p className="text-sm text-gray">Not enough performance data yet.</p>
          <p className="text-xs text-gray mt-1">Launch ad sets and let the campaign run to generate insights.</p>
        </div>
      ) : (
        <div className={`grid gap-3 ${cols}`}>
          {insights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Brief loading animation on mount / campaign change
  const [aiLoading, setAiLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setAiLoading(false), 900)
    return () => clearTimeout(t)
  }, [id])

  const { campaignItems, setCampaignItems, adSetItems, setAdSetItems, adItems, setAdItems, contentItems } = useAppData()

  const campaign = campaignItems.find((c) => c.id === id)
  const adSets   = useMemo(() => adSetItems.filter((s) => s.campaignId === id), [adSetItems, id])

  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set())

  function toggleExpand(adSetId: string) {
    setExpandedSets((prev) => {
      const next = new Set(prev)
      next.has(adSetId) ? next.delete(adSetId) : next.add(adSetId)
      return next
    })
  }

  function setCampaignStatus(status: typeof campaign.status) {
    setCampaignItems((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
  }
  function setAdSetStatus(adSetId: string, status: AdStatus) {
    setAdSetItems((prev) => prev.map((s) => s.id === adSetId ? { ...s, status } : s))
  }
  function setAdStatus(adId: string, status: AdStatus) {
    setAdItems((prev) => prev.map((a) => a.id === adId ? { ...a, status } : a))
  }

  // ── Account-wide benchmarks ──
  const accountBenchmarks = useMemo(() => {
    const totalSpend = campaignItems.reduce((s, c) => s + c.spend, 0)
    const totalRev   = campaignItems.reduce((s, c) => s + c.revenue, 0)
    const totalConv  = campaignItems.reduce((s, c) => s + c.conversions, 0)
    return {
      roas: totalSpend > 0 ? totalRev / totalSpend : 0,
      cpc:  totalConv  > 0 ? totalSpend / totalConv : 0,
    }
  }, [campaignItems])

  // ── This campaign's ads ──
  const campaignAds = useMemo(() =>
    adItems.filter(a => a.campaignId === id),
    [adItems, id]
  )

  // ── AI Insight engine ──────────────────────────────────────────────────────
  const insights = useMemo((): Insight[] => {
    if (!campaign) return []
    const out: Insight[] = []
    const { roas: acctRoas, cpc: acctCpc } = accountBenchmarks

    // ── Signal 1: ROAS vs account average ──
    if (campaign.roas > 0 && acctRoas > 0) {
      const delta  = campaign.roas - acctRoas
      const pct    = Math.round(Math.abs(delta / acctRoas) * 100)
      const isGood = delta >= 0

      out.push({
        id:          'roas-vs-account',
        type:        isGood ? 'highlight' : 'risk',
        title:       isGood
          ? `${pct}% above account average ROAS`
          : `${pct}% below account average ROAS`,
        body:        isGood
          ? `This campaign is delivering ${fmtRoas(campaign.roas)} ROAS, outperforming the ${fmtRoas(acctRoas)} account average. ${pct > 20 ? 'Significant outperformance — scaling budget here carries relatively low risk.' : 'Solid performance — monitor for consistency before scaling.'}`
          : `At ${fmtRoas(campaign.roas)} ROAS vs the ${fmtRoas(acctRoas)} account average, this campaign is underperforming. Review creative quality, audience fit, and landing page conversion before increasing investment.`,
        metric:      fmtRoas(campaign.roas),
        metricLabel: `vs ${fmtRoas(acctRoas)} account avg`,
        confidence:  Math.min(95, 70 + Math.min(pct, 25)),
      })
    }

    // ── Signal 2: Budget pacing ──
    if (campaign.spend > 0 && campaign.budget > 0) {
      const startMs     = new Date(campaign.startDate).getTime()
      const daysElapsed = Math.max(1, (TODAY_MS - startMs) / 86_400_000)

      let pacingRatio = 1
      let pacingBody  = ''

      if (campaign.budgetType === 'daily') {
        const avgDailySpend = campaign.spend / daysElapsed
        pacingRatio = avgDailySpend / campaign.budget
        const dailyDelta = Math.abs(avgDailySpend - campaign.budget)

        if (pacingRatio > 1.15) {
          pacingBody = `Averaging ${fmtINR(Math.round(avgDailySpend))}/day against a ${fmtINR(campaign.budget)}/day budget — ${Math.round((pacingRatio - 1) * 100)}% over-pacing. This may indicate budget caps are being hit intraday, limiting reach during peak hours.`
        } else if (pacingRatio < 0.8) {
          pacingBody = `Averaging ${fmtINR(Math.round(avgDailySpend))}/day against a ${fmtINR(campaign.budget)}/day budget — ${Math.round((1 - pacingRatio) * 100)}% under-pacing. The campaign may be limited by narrow audience, low bids, or overly restrictive targeting.`
        }
      } else if (campaign.endDate) {
        const endMs       = new Date(campaign.endDate).getTime()
        const totalDays   = Math.max(1, (endMs - startMs) / 86_400_000)
        const timeFrac    = Math.min(1, daysElapsed / totalDays)
        const budgetFrac  = campaign.spend / campaign.budget
        pacingRatio = timeFrac > 0 ? budgetFrac / timeFrac : 1
        const daysLeft    = Math.max(0, Math.round((endMs - TODAY_MS) / 86_400_000))
        const remainBudget = campaign.budget - campaign.spend

        if (pacingRatio > 1.2) {
          pacingBody = `${Math.round(budgetFrac * 100)}% of lifetime budget used with ${Math.round(timeFrac * 100)}% of time elapsed — ${Math.round((pacingRatio - 1) * 100)}% ahead of pace. At this rate, the budget exhausts ${daysLeft} days early.`
        } else if (pacingRatio < 0.75) {
          pacingBody = `${Math.round(budgetFrac * 100)}% of lifetime budget used with ${Math.round(timeFrac * 100)}% of time elapsed. ${fmtINR(remainBudget)} remains for ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — ${Math.round((1 - pacingRatio) * 100)}% behind pace. Consider loosening bids or broadening targeting.`
        }
      }

      if (pacingBody) {
        out.push({
          id:          'budget-pacing',
          type:        pacingRatio > 1.2 ? 'anomaly' : 'risk',
          title:       pacingRatio > 1.2 ? 'Budget is over-pacing' : 'Budget is under-pacing',
          body:        pacingBody,
          metric:      `${Math.round(pacingRatio * 100)}%`,
          metricLabel: 'Actual vs expected spend rate',
          confidence:  91,
        })
      }
    }

    // ── Signal 3: Best-performing ad set ──
    const adSetsWithRoas = adSets.filter(s => s.roas > 0 && s.spend > 0)
    if (adSetsWithRoas.length > 0) {
      const best  = [...adSetsWithRoas].sort((a, b) => b.roas - a.roas)[0]
      const worst = [...adSetsWithRoas].sort((a, b) => a.roas - b.roas)[0]
      const spread = adSetsWithRoas.length > 1 ? best.roas - worst.roas : 0
      const bestSpendShare = adSets.reduce((s, a) => s + a.spend, 0) > 0
        ? Math.round(best.spend / adSets.reduce((s, a) => s + a.spend, 0) * 100)
        : 0

      out.push({
        id:          'best-adset',
        type:        'highlight',
        title:       `"${best.name.length > 28 ? best.name.slice(0, 25) + '…' : best.name}" is your strongest ad set`,
        body:        `Targeting ${best.audience ?? 'custom audience'}, this ad set achieves ${fmtRoas(best.roas)} ROAS${bestSpendShare > 0 ? ` on ${bestSpendShare}% of campaign spend` : ''}.${spread > 0.5 ? ` Ad sets span ${fmtRoas(worst.roas)}–${fmtRoas(best.roas)} ROAS — a ${spread.toFixed(2)}x gap. Shifting budget from "${worst.name}" to the top performer could meaningfully lift blended ROAS.` : ' Performance is consistent across ad sets.'}`,
        metric:      fmtRoas(best.roas),
        metricLabel: 'Best ad set ROAS',
        confidence:  89,
      })
    }

    // ── Signal 4: Ad set ROAS dispersion (reallocation opportunity) ──
    if (adSetsWithRoas.length >= 3) {
      const sorted     = [...adSetsWithRoas].sort((a, b) => b.roas - a.roas)
      const top2       = sorted.slice(0, 2)
      const bottom     = sorted[sorted.length - 1]
      const top2Spend  = top2.reduce((s, a) => s + a.spend, 0)
      const totalSpend = adSetsWithRoas.reduce((s, a) => s + a.spend, 0)
      const top2Share  = totalSpend > 0 ? Math.round(top2Spend / totalSpend * 100) : 0
      const gap        = sorted[0].roas - bottom.roas

      if (gap > 0.8 && top2Share < 70) {
        const top2AvgRoas = top2Spend > 0
          ? top2.reduce((s, a) => s + a.spend * a.roas, 0) / top2Spend
          : 0
        const bottomRev   = bottom.spend * bottom.roas
        const hypothetical = bottom.spend * top2AvgRoas
        const uplift      = Math.round(hypothetical - bottomRev)

        out.push({
          id:          'adset-dispersion',
          type:        'opportunity',
          title:       `${gap.toFixed(1)}x ROAS gap — reallocate from bottom ad sets`,
          body:        `Your top 2 ad sets (${fmtRoas(sorted[0].roas)}, ${fmtRoas(sorted[1].roas)}) outperform "${bottom.name}" (${fmtRoas(bottom.roas)}) by ${gap.toFixed(2)}x. Shifting "${bottom.name}"'s ${fmtINR(bottom.spend)} budget to your top performers could generate ~${fmtINR(uplift)} in additional revenue at current ROAS.`,
          metric:      fmtINR(uplift),
          metricLabel: 'Estimated revenue uplift',
          confidence:  79,
        })
      }
    }

    // ── Signal 5: Video vs image creative performance ──
    const videoAds = campaignAds.filter(a => a.contentType === 'video' && a.spend > 0)
    const imageAds = campaignAds.filter(a => a.contentType === 'image' && a.spend > 0)

    if (videoAds.length > 0 && imageAds.length > 0) {
      const vSpend = videoAds.reduce((s, a) => s + a.spend, 0)
      const vRev   = videoAds.reduce((s, a) => s + a.spend * a.roas, 0)
      const iSpend = imageAds.reduce((s, a) => s + a.spend, 0)
      const iRev   = imageAds.reduce((s, a) => s + a.spend * a.roas, 0)
      const vRoas  = vSpend > 0 ? vRev / vSpend : 0
      const iRoas  = iSpend > 0 ? iRev / iSpend : 0

      if (vRoas > 0 && iRoas > 0) {
        const leader    = vRoas >= iRoas ? 'Video' : 'Image'
        const laggard   = leader === 'Video' ? 'Image' : 'Video'
        const leadRoas  = Math.max(vRoas, iRoas)
        const lagRoas   = Math.min(vRoas, iRoas)
        const gap       = Math.round((leadRoas / lagRoas - 1) * 100)
        const lagSpend  = leader === 'Video' ? iSpend : vSpend
        const uplift    = Math.round(lagSpend * 0.3 * (leadRoas - lagRoas))

        if (gap > 10) {
          out.push({
            id:          'creative-format',
            type:        'opportunity',
            title:       `${leader} creatives outperform ${laggard} by ${gap}%`,
            body:        `${leader} ads are delivering ${fmtRoas(leadRoas)} ROAS vs ${fmtRoas(lagRoas)} for ${laggard} ads within this campaign — a ${gap}% difference. Reallocating 30% of ${laggard} spend to ${leader} formats could yield an estimated ${fmtINR(uplift)} additional revenue.`,
            metric:      `+${gap}%`,
            metricLabel: `${leader} vs ${laggard} ROAS delta`,
            confidence:  Math.min(90, 65 + gap),
          })
        }
      }
    }

    // ── Signal 6: Inactive ad set coverage ──
    if (adSets.length > 0) {
      const activeAdSets  = adSets.filter(s => s.status === 'active')
      const pausedAdSets  = adSets.filter(s => s.status === 'paused')
      const inactivePct   = Math.round((pausedAdSets.length / adSets.length) * 100)

      if (pausedAdSets.length > 0 && inactivePct >= 40) {
        const pausedSpend = pausedAdSets.reduce((s, a) => s + a.spend, 0)
        out.push({
          id:          'inactive-coverage',
          type:        'risk',
          title:       `${inactivePct}% of ad sets are paused`,
          body:        `${pausedAdSets.length} of ${adSets.length} ad sets are paused, leaving only ${activeAdSets.length} active. ${pausedSpend > 0 ? `The paused ad sets previously spent ${fmtINR(pausedSpend)}. ` : ''}If this is unintentional, resume them to restore full campaign reach and spend capacity.`,
          metric:      `${pausedAdSets.length}/${adSets.length}`,
          metricLabel: 'Ad sets paused',
          confidence:  96,
        })
      } else if (campaign.conversions > 0 && acctCpc > 0) {
        // ── Signal 6b: Cost per conversion vs account average ──
        const cpc    = campaign.costPerConversion
        const delta  = cpc - acctCpc
        const pct    = Math.round(Math.abs(delta / acctCpc) * 100)
        const isGood = delta <= 0

        if (pct > 15) {
          out.push({
            id:          'cpc-benchmark',
            type:        isGood ? 'highlight' : 'risk',
            title:       isGood
              ? `${pct}% cheaper per conversion than account avg`
              : `Cost per conversion ${pct}% above account average`,
            body:        isGood
              ? `At ${fmtCurrency(Math.round(cpc))}/conversion, this campaign is ${pct}% more efficient than the account average of ${fmtCurrency(Math.round(acctCpc))}. Strong conversion efficiency — this objective and audience combination is working well.`
              : `At ${fmtCurrency(Math.round(cpc))}/conversion vs the account average of ${fmtCurrency(Math.round(acctCpc))}, the cost to convert is high. Review landing page quality, offer strength, and whether the audience is in the right intent stage.`,
            metric:      fmtCurrency(Math.round(cpc)),
            metricLabel: `vs ${fmtCurrency(Math.round(acctCpc))} account avg`,
            confidence:  85,
          })
        }
      }
    }

    return out.slice(0, 5)
  }, [campaign, adSets, campaignAds, accountBenchmarks])

  if (!campaign) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/marketing/campaigns')} className="mb-4 -ml-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Campaigns
        </Button>
        <p className="text-gray">Campaign not found.</p>
      </div>
    )
  }

  const adSetCount   = adSets.length
  const activeAdSets = adSets.filter((s) => s.status === 'active').length
  const totalAds     = adItems.filter((a) => a.campaignId === id).length

  return (
    <div className="p-6 space-y-6">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/marketing/campaigns')}
        className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Campaigns
      </button>

      {/* ── Campaign header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-sage-green mt-0.5">
            {OBJECTIVE_ICON[campaign.objective]}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
              <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status]}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray">
              {campaign.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
              {' · '}
              {OBJECTIVE_LABEL[campaign.objective]}
              {' · '}
              {campaign.budgetType === 'daily'
                ? `${fmtCurrency(campaign.budget)}/day`
                : `${fmtCurrency(campaign.budget)} lifetime`}
              {' · '}
              From {campaign.startDate}
              {campaign.endDate ? ` → ${campaign.endDate}` : ' · Running'}
            </p>
            <p className="mt-1 text-xs text-gray">
              {adSetCount} ad set{adSetCount !== 1 ? 's' : ''} · {activeAdSets} active · {totalAds} total ad{totalAds !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === 'active' && (
            <Button variant="outline" size="sm" onClick={() => setCampaignStatus('paused')}>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
          )}
          {(campaign.status === 'paused' || campaign.status === 'draft') && (
            <Button variant="outline" size="sm" onClick={() => setCampaignStatus('active')}>
              <CirclePlay className="h-3.5 w-3.5" />
              {campaign.status === 'draft' ? 'Launch' : 'Resume'}
            </Button>
          )}
          {campaign.status === 'archived' && (
            <Button variant="outline" size="sm" onClick={() => setCampaignStatus('paused')}>
              <CirclePlay className="h-3.5 w-3.5" />
              Restore
            </Button>
          )}
        </div>
      </div>

      {/* ── Campaign KPI strip ── */}
      <Card>
        <CardContent className="px-6 py-5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="Spend"       value={fmtCurrency(campaign.spend)} />
            <MetricCard label="Revenue"     value={fmtCurrency(campaign.revenue)} />
            <MetricCard label="ROAS"        value={fmtRoas(campaign.roas)} />
            <MetricCard label="Impressions" value={fmtCompact(campaign.impressions)} sub={`Reach ${fmtCompact(campaign.reach)}`} />
            <MetricCard label="Clicks"      value={fmtCompact(campaign.clicks)} sub={`CTR ${fmtPct(campaign.ctr)}`} />
            <MetricCard
              label="Conversions"
              value={campaign.conversions > 0 ? String(campaign.conversions) : '—'}
              sub={campaign.conversions > 0 ? `₹${Math.round(campaign.costPerConversion)}/conv` : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Campaign Intelligence (AI) ── */}
      <CampaignIntelligencePanel
        insights={insights}
        loading={aiLoading}
        campaignName={campaign.name}
      />

      {/* ── Ad Sets section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Ad Sets
            <span className="ml-2 text-sm font-normal text-gray">({adSetCount})</span>
          </h2>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            New Ad Set
          </Button>
        </div>

        {adSets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray text-sm">
              No ad sets yet. Click "New Ad Set" to get started.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead>Ad Set</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Audience</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Budget</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Impressions</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">CTR</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {adSets.map((adSet) => {
                  const isExpanded = expandedSets.has(adSet.id)
                  const setAds     = adItems.filter((a) => a.adSetId === adSet.id)

                  return (
                    <>
                      {/* ── Ad Set row ── */}
                      <TableRow key={adSet.id} className="cursor-pointer" onClick={() => toggleExpand(adSet.id)}>
                        <TableCell className="pl-4 pr-0">
                          {isExpanded
                            ? <ChevronDown  className="h-4 w-4 text-gray" />
                            : <ChevronRight className="h-4 w-4 text-gray" />}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">{adSet.name}</p>
                          <p className="text-[11px] text-gray">{setAds.length} ad{setAds.length !== 1 ? 's' : ''}</p>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Badge variant={AD_STATUS_VARIANT[adSet.status]}>
                            {AD_STATUS_LABEL[adSet.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px]">
                          <p className="text-sm text-slate truncate">{adSet.audience}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                          {adSet.budgetType === 'daily'
                            ? `${fmtCurrency(adSet.budget)}/day`
                            : fmtCurrency(adSet.budget)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium text-foreground whitespace-nowrap">
                          {fmtCurrency(adSet.spend)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                          {fmtCompact(adSet.impressions)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                          {fmtPct(adSet.ctr)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                          <RoasCell value={adSet.roas} />
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ad set actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {adSet.status === 'active' && (
                                <DropdownMenuItem onClick={() => setAdSetStatus(adSet.id, 'paused')}>
                                  <Pause className="h-3.5 w-3.5" />Pause
                                </DropdownMenuItem>
                              )}
                              {adSet.status === 'paused' && (
                                <DropdownMenuItem onClick={() => setAdSetStatus(adSet.id, 'active')}>
                                  <CirclePlay className="h-3.5 w-3.5" />Resume
                                </DropdownMenuItem>
                              )}
                              {adSet.status !== 'archived' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-error focus:text-error"
                                    onClick={() => setAdSetStatus(adSet.id, 'archived')}
                                  >
                                    <Archive className="h-3.5 w-3.5" />Archive
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* ── Ads sub-table (expanded) ── */}
                      {isExpanded && (
                        <TableRow key={`${adSet.id}-ads`} className="hover:bg-transparent bg-transparent">
                          <TableCell colSpan={10} className="p-0">
                            <div className="border-t border-border bg-off-white">
                              <div className="flex items-center justify-between px-6 py-2.5 border-b border-border">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray">
                                  Ads in this ad set ({setAds.length})
                                </span>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                  <Plus className="h-3 w-3" />
                                  New Ad
                                </Button>
                              </div>

                              {setAds.length === 0 ? (
                                <p className="px-6 py-4 text-sm text-gray">No ads in this ad set yet.</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                      <TableHead className="pl-8">Ad Name</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="hidden sm:table-cell">Creative</TableHead>
                                      <TableHead className="hidden md:table-cell max-w-[220px]">Headline</TableHead>
                                      <TableHead className="text-right">Spend</TableHead>
                                      <TableHead className="hidden lg:table-cell text-right">Impressions</TableHead>
                                      <TableHead className="hidden lg:table-cell text-right">CTR</TableHead>
                                      <TableHead className="text-right">ROAS</TableHead>
                                      <TableHead className="w-10" />
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {setAds.map((ad) => {
                                      const linkedContent = ad.contentId
                                        ? contentItems.find((c) => c.id === ad.contentId)
                                        : null

                                      return (
                                        <TableRow key={ad.id}>
                                          <TableCell className="pl-8">
                                            <p className="font-medium text-foreground text-sm">{ad.name}</p>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={AD_STATUS_VARIANT[ad.status]} className="text-[11px]">
                                              {AD_STATUS_LABEL[ad.status]}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="hidden sm:table-cell">
                                            {linkedContent ? (
                                              <div className="flex items-center gap-1.5">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-mint text-sage-green">
                                                  {ad.contentType === 'video'
                                                    ? <FileVideo className="h-3 w-3" />
                                                    : <Image     className="h-3 w-3" />}
                                                </span>
                                                <span className="text-xs text-slate truncate max-w-[140px]">
                                                  {ad.contentName}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-gray italic">Custom creative</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="hidden md:table-cell max-w-[220px]">
                                            <p className="text-xs text-slate truncate">{ad.headline}</p>
                                          </TableCell>
                                          <TableCell className="text-right tabular-nums text-sm font-medium text-foreground whitespace-nowrap">
                                            {fmtCurrency(ad.spend)}
                                          </TableCell>
                                          <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                                            {fmtCompact(ad.impressions)}
                                          </TableCell>
                                          <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                                            {fmtPct(ad.ctr)}
                                          </TableCell>
                                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                                            <RoasCell value={ad.roas} />
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray hover:text-foreground">
                                                  <MoreHorizontal className="h-4 w-4" />
                                                  <span className="sr-only">Ad actions</span>
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-44">
                                                <DropdownMenuItem><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                                                {linkedContent && (
                                                  <DropdownMenuItem asChild>
                                                    <a href={linkedContent.driveUrl} target="_blank" rel="noopener noreferrer">
                                                      <ExternalLink className="h-3.5 w-3.5" />View Creative
                                                    </a>
                                                  </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {ad.status === 'active' && (
                                                  <DropdownMenuItem onClick={() => setAdStatus(ad.id, 'paused')}>
                                                    <Pause className="h-3.5 w-3.5" />Pause
                                                  </DropdownMenuItem>
                                                )}
                                                {ad.status === 'paused' && (
                                                  <DropdownMenuItem onClick={() => setAdStatus(ad.id, 'active')}>
                                                    <CirclePlay className="h-3.5 w-3.5" />Resume
                                                  </DropdownMenuItem>
                                                )}
                                                {ad.status !== 'archived' && (
                                                  <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                      className="text-error focus:text-error"
                                                      onClick={() => setAdStatus(ad.id, 'archived')}
                                                    >
                                                      <Archive className="h-3.5 w-3.5" />Archive
                                                    </DropdownMenuItem>
                                                  </>
                                                )}
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

    </div>
  )
}
