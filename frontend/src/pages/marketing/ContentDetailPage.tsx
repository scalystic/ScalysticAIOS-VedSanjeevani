import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft, FileVideo, Image, ExternalLink,
  Target, MousePointerClick, Eye, Users, Heart, Play, Download,
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, Star, Zap, AlertCircle,
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
  type ContentCategory,
  type CampaignObjective,
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

const OBJECTIVE_LABEL: Record<CampaignObjective, string> = {
  conversions:     'Conversions',
  traffic:         'Traffic',
  awareness:       'Awareness',
  lead_generation: 'Lead Gen',
  engagement:      'Engagement',
  video_views:     'Video Views',
  app_installs:    'App Installs',
}

const OBJECTIVE_ICON: Record<CampaignObjective, React.ReactNode> = {
  conversions:     <Target            className="h-3.5 w-3.5" />,
  traffic:         <MousePointerClick className="h-3.5 w-3.5" />,
  awareness:       <Eye               className="h-3.5 w-3.5" />,
  lead_generation: <Users             className="h-3.5 w-3.5" />,
  engagement:      <Heart             className="h-3.5 w-3.5" />,
  video_views:     <Play              className="h-3.5 w-3.5" />,
  app_installs:    <Download          className="h-3.5 w-3.5" />,
}

const AD_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  active:   'success',
  paused:   'warning',
  archived: 'muted',
}

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  video: <FileVideo className="h-5 w-5" />,
  image: <Image     className="h-5 w-5" />,
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

// ── Brand palette (hex — for inline styles) ───────────────────────────────────

const C = {
  teal:      '#0FA38E',
  mint:      '#35C59A',
  warning:   '#F59E0B',
  error:     '#EF4444',
  success:   '#22C55E',
  info:      '#3B82F6',
  purple:    '#8B5CF6',
  gray:      '#6B7280',
  lightGray: '#E5E7EB',
  deepGreen: '#0F2E25',
} as const

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

function fmtCurrency(v: number) {
  if (v === 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(v)
}
function fmtINR(v: number) {
  if (v === 0) return '—'
  if (v >= 10_00_000) return `₹${(v / 10_00_000).toFixed(2)}Cr`
  if (v >= 1_00_000)  return `₹${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(0)}K`
  return `₹${v}`
}
function fmtRoas(v: number) { return v > 0 ? `${v.toFixed(2)}x` : '—' }
function fmtCompact(v: number) {
  if (v === 0) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}
function fmtPct(v: number) { return v === 0 ? '—' : `${v.toFixed(2)}%` }

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
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

// ── Content Intelligence Panel ────────────────────────────────────────────────

function ContentIntelligencePanel({
  insights,
  loading,
  contentName,
}: {
  insights:    Insight[]
  loading:     boolean
  contentName: string
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
            <p className="text-sm font-semibold text-foreground">Content Intelligence</p>
            <p className="text-xs text-gray">
              {loading
                ? `Analysing performance signals for "${contentName}"…`
                : `${insights.length} signal${insights.length !== 1 ? 's' : ''} detected across ${insights.length > 0 ? 'placements, benchmarks, and trend data' : 'available data'}`}
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
          <p className="text-xs text-gray mt-1">Add this content to campaigns to start generating insights.</p>
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

export default function ContentDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  // Brief loading animation on mount
  const [aiLoading, setAiLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setAiLoading(false), 900)
    return () => clearTimeout(t)
  }, [id])

  const { contentItems, adItems, adSetItems, campaignItems, agencyItems, creatorItems } = useAppData()

  const content = contentItems.find((c) => c.id === id)

  // All ads using this content
  const linkedAds = useMemo(
    () => adItems.filter((a) => a.contentId === id),
    [adItems, id]
  )

  // Aggregate performance
  const totalSpend       = linkedAds.reduce((s, a) => s + a.spend, 0)
  const totalRevenue     = linkedAds.reduce((s, a) => s + a.spend * a.roas, 0)
  const overallRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const totalImpressions = linkedAds.reduce((s, a) => s + a.impressions, 0)
  const totalClicks      = linkedAds.reduce((s, a) => s + a.clicks, 0)
  const avgCtr           = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const totalConversions = linkedAds.reduce((s, a) => s + a.conversions, 0)

  // Build usage tree: campaign → ad set → ad
  const usageTree = useMemo(() => {
    return linkedAds.map((ad) => {
      const adSet    = adSetItems.find((s) => s.id === ad.adSetId)
      const campaign = campaignItems.find((c) => c.id === ad.campaignId)
      return { ad, adSet, campaign }
    })
  }, [linkedAds, adSetItems, campaignItems])

  // Group by campaign
  const byCampaign = useMemo(() => {
    const map = new Map<string, typeof usageTree>()
    for (const entry of usageTree) {
      const cid      = entry.campaign?.id ?? 'unknown'
      const existing = map.get(cid) ?? []
      map.set(cid, [...existing, entry])
    }
    return [...map.entries()]
  }, [usageTree])

  const linkedAgency = content?.agency
    ? agencyItems.find((a) => a.name === content.agency)
    : null

  const creationCost = useMemo(() => {
    if (!content) return 0
    const creator = creatorItems.find((c) => c.name === content.creator)
    if (!creator) return 0
    return content.type === 'video' ? creator.ratePerVideo : creator.ratePerImage
  }, [content, creatorItems])

  // ── Account-wide benchmarks (for comparison) ──
  const accountBenchmarks = useMemo(() => {
    const allSpend  = adItems.reduce((s, a) => s + a.spend, 0)
    const allRev    = adItems.reduce((s, a) => s + a.spend * a.roas, 0)
    const allImpr   = adItems.reduce((s, a) => s + a.impressions, 0)
    const allClicks = adItems.reduce((s, a) => s + a.clicks, 0)
    return {
      roas: allSpend > 0 ? allRev / allSpend : 0,
      ctr:  allImpr  > 0 ? (allClicks / allImpr) * 100 : 0,
    }
  }, [adItems])

  // ── AI Insight engine ──────────────────────────────────────────────────────
  const insights = useMemo((): Insight[] => {
    if (!content || linkedAds.length === 0) return []
    const out: Insight[] = []

    const { roas: acctRoas, ctr: acctCtr } = accountBenchmarks

    // ── Signal 1: ROAS vs account average ──
    if (overallRoas > 0 && acctRoas > 0) {
      const delta  = overallRoas - acctRoas
      const pct    = Math.round(Math.abs(delta / acctRoas) * 100)
      const isGood = delta > 0

      out.push({
        id:          'roas-verdict',
        type:        delta > acctRoas * 0.15 ? 'highlight' : delta < -acctRoas * 0.15 ? 'risk' : 'highlight',
        title:       isGood
          ? `${pct}% above account ROAS — strong performer`
          : `${pct}% below account ROAS — needs attention`,
        body:        isGood
          ? `This ${content.type} is delivering ${fmtRoas(overallRoas)} ROAS vs the account average of ${fmtRoas(acctRoas)}. It's one of your better-performing assets. Consider scaling spend on its best placements.`
          : `This ${content.type} is delivering ${fmtRoas(overallRoas)} ROAS, which is ${pct}% below the account average of ${fmtRoas(acctRoas)}. Diagnose placement mix or creative fatigue before investing further.`,
        metric:      fmtRoas(overallRoas),
        metricLabel: `vs ${fmtRoas(acctRoas)} account avg`,
        confidence:  Math.min(95, 72 + Math.min(pct, 23)),
      })
    }

    // ── Signal 2: Best single placement ──
    if (linkedAds.length > 0) {
      const bestAd       = [...linkedAds].sort((a, b) => b.roas - a.roas)[0]
      const bestCampaign = usageTree.find(e => e.ad.id === bestAd.id)?.campaign
      const worstAd      = [...linkedAds].sort((a, b) => a.roas - b.roas)[0]

      if (bestAd.roas > 0 && bestCampaign) {
        const roasSpread = linkedAds.length > 1
          ? bestAd.roas - worstAd.roas
          : 0
        const spreadNote = roasSpread > 0.5 && linkedAds.length > 1
          ? ` There's a ${roasSpread.toFixed(2)}x ROAS spread across placements — reallocating to the top ad could lift overall returns.`
          : ''

        out.push({
          id:          'best-placement',
          type:        'highlight',
          title:       `"${bestAd.name.length > 28 ? bestAd.name.slice(0, 25) + '…' : bestAd.name}" is your top placement`,
          body:        `This ad in "${bestCampaign.name}" is achieving ${fmtRoas(bestAd.roas)} ROAS with ${fmtCompact(bestAd.impressions)} impressions and a ${fmtPct(bestAd.ctr)} CTR.${spreadNote}`,
          metric:      fmtRoas(bestAd.roas),
          metricLabel: 'Best placement ROAS',
          confidence:  92,
        })
      }
    }

    // ── Signal 3: Platform split (Meta vs Google) ──
    const metaAds   = usageTree.filter(e => e.campaign?.platform === 'meta').map(e => e.ad)
    const googleAds = usageTree.filter(e => e.campaign?.platform === 'google').map(e => e.ad)

    if (metaAds.length > 0 && googleAds.length > 0) {
      const mSpend  = metaAds.reduce((s, a) => s + a.spend, 0)
      const mRev    = metaAds.reduce((s, a) => s + a.spend * a.roas, 0)
      const gSpend  = googleAds.reduce((s, a) => s + a.spend, 0)
      const gRev    = googleAds.reduce((s, a) => s + a.spend * a.roas, 0)
      const mRoas   = mSpend > 0 ? mRev / mSpend : 0
      const gRoas   = gSpend > 0 ? gRev / gSpend : 0

      if (mRoas > 0 && gRoas > 0) {
        const leader   = mRoas >= gRoas ? 'Meta' : 'Google'
        const laggard  = leader === 'Meta' ? 'Google' : 'Meta'
        const leadR    = Math.max(mRoas, gRoas)
        const lagR     = Math.min(mRoas, gRoas)
        const gap      = Math.round((leadR / lagR - 1) * 100)
        const lagSpend = leader === 'Meta' ? gSpend : mSpend
        const uplift   = Math.round(lagSpend * 0.25 * (leadR - lagR))

        out.push({
          id:          'platform-split',
          type:        'opportunity',
          title:       `Resonates ${gap}% stronger on ${leader}`,
          body:        `On ${leader} this content delivers ${fmtRoas(leadR)} ROAS vs ${fmtRoas(lagR)} on ${laggard}. Shifting 25% of ${laggard} budget to ${leader} for this content could yield an estimated ${fmtINR(uplift)} in additional revenue.`,
          metric:      `+${gap}%`,
          metricLabel: `ROAS delta · ${leader} vs ${laggard}`,
          confidence:  Math.min(91, 68 + gap),
        })
      }
    }

    // ── Signal 4: CTR vs content-type benchmark ──
    if (avgCtr > 0) {
      // Industry benchmarks: video typically higher than image for social
      const benchmark = content.type === 'video' ? 1.6 : 0.85
      const delta     = avgCtr - benchmark
      const pct       = Math.abs(Math.round((delta / benchmark) * 100))
      const isAbove   = delta > 0

      if (pct > 8) {
        out.push({
          id:          'ctr-benchmark',
          type:        isAbove ? 'highlight' : 'risk',
          title:       isAbove
            ? `CTR ${pct}% above ${content.type} benchmark`
            : `CTR ${pct}% below ${content.type} benchmark`,
          body:        isAbove
            ? `A ${fmtPct(avgCtr)} CTR outperforms the ${fmtPct(benchmark)} typical benchmark for ${content.type} content. Strong hook and relevance — this creative captures attention well. Worth A/B testing variations.`
            : `A ${fmtPct(avgCtr)} CTR is below the ${fmtPct(benchmark)} benchmark for ${content.type} content. The hook or thumbnail may not be compelling enough. Consider testing a stronger opening or different headline copy.`,
          metric:      fmtPct(avgCtr),
          metricLabel: `${content.type} benchmark: ${fmtPct(benchmark)}`,
          confidence:  86,
        })
      }
    }

    // ── Signal 5: Active underperformers ──
    const activeAds       = linkedAds.filter(a => a.status === 'active')
    const underperformers = activeAds.filter(a => a.roas < acctRoas * 0.7 && a.spend > 0)

    if (underperformers.length > 0 && activeAds.length > 0) {
      const wastedSpend = underperformers.reduce((s, a) => s + a.spend, 0)
      out.push({
        id:          'underperformers',
        type:        'anomaly',
        title:       `${underperformers.length} active ad${underperformers.length > 1 ? 's' : ''} below 70% of account ROAS`,
        body:        `${underperformers.length} of ${activeAds.length} active ad${activeAds.length > 1 ? 's' : ''} for this content ${underperformers.length > 1 ? 'are' : 'is'} performing below ${fmtRoas(acctRoas * 0.7)} ROAS, consuming ${fmtINR(wastedSpend)} in spend. Pausing or refreshing ${underperformers.length > 1 ? 'these' : 'this'} could improve the content's overall blended ROAS.`,
        metric:      `${underperformers.length}/${activeAds.length}`,
        metricLabel: 'Ads below ROAS threshold',
        confidence:  93,
      })
    } else if (activeAds.length > 0 && underperformers.length === 0 && overallRoas >= acctRoas * 1.2) {
      // ── Signal 5b: Scaling signal ──
      const campaignCount = byCampaign.length
      out.push({
        id:          'scale-signal',
        type:        'opportunity',
        title:       'All active placements are healthy — scale it',
        body:        `Every active ad for this content is performing at or above the account ROAS benchmark. This creative is currently running in ${campaignCount} campaign${campaignCount !== 1 ? 's' : ''}. Adding it to additional campaigns or increasing budgets is low-risk given its track record.`,
        metric:      `${activeAds.length} healthy`,
        metricLabel: 'Active ads above benchmark',
        confidence:  81,
      })
    }

    // ── Signal 6: Conversion efficiency ──
    if (totalConversions > 0 && totalSpend > 0) {
      const cpc = totalSpend / totalConversions
      // Rough benchmark: ₹500 cost per conversion is reasonable for D2C
      const benchmark = 500
      const isEfficient = cpc < benchmark

      out.push({
        id:          'conv-efficiency',
        type:        isEfficient ? 'highlight' : 'risk',
        title:       isEfficient
          ? `Efficient at ${fmtINR(Math.round(cpc))} per conversion`
          : `Cost per conversion ${Math.round(cpc / benchmark * 100 - 100)}% above target`,
        body:        isEfficient
          ? `${totalConversions} conversions at ${fmtINR(Math.round(cpc))} each — well within efficient range. High conversion volume paired with good ROAS suggests this creative drives real purchase intent, not just awareness.`
          : `At ${fmtINR(Math.round(cpc))} per conversion, this content is converting at a higher cost than the ₹500 target. Review landing page quality and audience targeting — the creative may be attracting the wrong audience segment.`,
        metric:      fmtINR(Math.round(cpc)),
        metricLabel: 'Cost per conversion',
        confidence:  88,
      })
    }

    return out.slice(0, 5)
  }, [content, linkedAds, usageTree, overallRoas, avgCtr, totalConversions, totalSpend, accountBenchmarks, byCampaign])

  if (!content) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/marketing/contents')}
          className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer mb-4">
          <ChevronLeft className="h-4 w-4" /> Content Library
        </button>
        <p className="text-gray">Content not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/marketing/contents')}
        className="flex items-center gap-1.5 text-sm text-gray hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" /> Content Library
      </button>

      {/* ── Content header ── */}
      <div className="flex items-start gap-4 flex-wrap justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint text-sage-green">
            {TYPE_ICON[content.type]}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{content.name}</h1>
              <Badge variant={STATUS_VARIANT[content.status]}>{STATUS_LABEL[content.status]}</Badge>
              <span className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                CATEGORY_COLOR[content.category]
              )}>
                {CATEGORY_LABEL[content.category]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              <span className="text-sm text-gray">
                <span className="text-slate font-medium">{content.creator}</span>
                {content.product ? <>{' · '}{content.product}</> : null}
              </span>
              {content.agency && (
                <button
                  onClick={() => linkedAgency && navigate(`/marketing/agencies/${linkedAgency.id}`)}
                  className={cn(
                    'text-sm',
                    linkedAgency
                      ? 'text-teal hover:underline cursor-pointer'
                      : 'text-gray cursor-default'
                  )}
                >
                  {content.agency}
                </button>
              )}
              {!content.agency && <span className="text-sm text-gray italic">No agency</span>}
            </div>
            {(content.metaVideoId || content.metaActiveDate) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {content.metaVideoId && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate bg-muted px-2.5 py-1 rounded-md">
                    <span className="font-medium text-gray">Meta ID</span>
                    <span className="font-mono">{content.metaVideoId}</span>
                  </span>
                )}
                {content.metaActiveDate && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium bg-success/10 px-2.5 py-1 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Active on Meta since{' '}
                    {new Date(content.metaActiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {content.driveUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={content.driveUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Drive
            </a>
          </Button>
        )}
      </div>

      {/* ── Performance KPI cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Performance</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Creation Cost" value={creationCost > 0 ? fmtCurrency(creationCost) : '—'} sub="paid to creator" />
          <MetricCard label="Total Spend"   value={fmtCurrency(totalSpend)} />
          <MetricCard label="Total Revenue" value={fmtCurrency(totalRevenue)} />
          <MetricCard label="Overall ROAS"  value={fmtRoas(overallRoas)} />
          <MetricCard label="Impressions"   value={fmtCompact(totalImpressions)} />
          <MetricCard
            label="Clicks"
            value={fmtCompact(totalClicks)}
            sub={`CTR ${fmtPct(avgCtr)}`}
          />
          <MetricCard
            label="Conversions"
            value={totalConversions > 0 ? String(totalConversions) : '—'}
          />
        </div>
      </div>

      {/* ── Content Intelligence (AI) ── */}
      <ContentIntelligencePanel
        insights={insights}
        loading={aiLoading}
        contentName={content.name}
      />

      {/* ── Usage in campaigns ── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Running In
          <span className="ml-2 text-sm font-normal text-gray">
            ({linkedAds.length} ad{linkedAds.length !== 1 ? 's' : ''} across {byCampaign.length} campaign{byCampaign.length !== 1 ? 's' : ''})
          </span>
        </h2>

        {byCampaign.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray text-sm">
              This content is not linked to any ads yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {byCampaign.map(([, entries]) => {
              const campaign = entries[0]?.campaign
              if (!campaign) return null

              const campSpend   = entries.reduce((s, e) => s + e.ad.spend, 0)
              const campRevenue = entries.reduce((s, e) => s + e.ad.spend * e.ad.roas, 0)
              const campRoas    = campSpend > 0 ? campRevenue / campSpend : 0

              return (
                <Card key={campaign.id} className="overflow-hidden">
                  {/* Campaign header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-off-white">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-mint text-sage-green shrink-0">
                        {OBJECTIVE_ICON[campaign.objective]}
                      </span>
                      <button
                        onClick={() => navigate(`/marketing/campaigns/${campaign.id}`)}
                        className="font-semibold text-sm text-foreground hover:text-teal transition-colors cursor-pointer"
                      >
                        {campaign.name}
                      </button>
                      <Badge variant={campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : 'muted'} className="text-[10px]">
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="hidden sm:flex items-center gap-5 text-xs text-gray">
                      <span>{OBJECTIVE_LABEL[campaign.objective]}</span>
                      <span className="font-medium text-foreground tabular-nums">{fmtCurrency(campSpend)}</span>
                      {campRoas > 0 && (
                        <span className={cn('font-semibold tabular-nums',
                          campRoas >= 4 ? 'text-success' : campRoas >= 3 ? 'text-warning' : 'text-error'
                        )}>
                          {fmtRoas(campRoas)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ads table */}
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Ad</TableHead>
                        <TableHead className="hidden sm:table-cell">Ad Set</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell max-w-[200px]">Headline</TableHead>
                        <TableHead className="text-right">Spend</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Impressions</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">CTR</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map(({ ad, adSet }) => (
                        <TableRow key={ad.id}>
                          <TableCell>
                            <p className="font-medium text-foreground text-sm">{ad.name}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <p className="text-sm text-slate truncate max-w-[160px]">
                              {adSet?.name ?? '—'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={AD_STATUS_VARIANT[ad.status]} className="text-[11px]">
                              {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px]">
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
                            {ad.roas > 0 ? (
                              <span className={cn('font-semibold',
                                ad.roas >= 4 ? 'text-success' : ad.roas >= 3 ? 'text-warning' : 'text-error'
                              )}>
                                {fmtRoas(ad.roas)}
                              </span>
                            ) : <span className="text-gray">—</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
