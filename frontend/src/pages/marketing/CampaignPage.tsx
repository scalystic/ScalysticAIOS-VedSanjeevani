import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  Target, MousePointerClick, Eye, Users, Heart, Play, Download,
  Search, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Pencil, Pause, CirclePlay, Archive, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button }   from '@/components/ui/button'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Input }    from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { CampaignForm, type CampaignFormValues } from './CampaignForm'
import {
  useAppData,
  type CampaignItem,
  type CampaignStatus,
  type CampaignObjective,
  type CampaignPlatform,
} from '@/context/AppData'

// ── Types ──────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'status' | 'objective' | 'spend' | 'impressions' | 'ctr' | 'roas'
type SortDir = 'asc' | 'desc'

// ── Config maps ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active:   'Active',
  paused:   'Paused',
  archived: 'Archived',
  draft:    'Draft',
}

const STATUS_VARIANT: Record<CampaignStatus, BadgeProps['variant']> = {
  active:   'success',
  paused:   'warning',
  archived: 'muted',
  draft:    'info',
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

const PLATFORM_LABEL: Record<CampaignPlatform, string> = {
  meta:   'Meta',
  google: 'Google',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtCurrency(value: number) {
  if (value === 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(value)
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

function fmtBudget(item: CampaignItem) {
  const amt = fmtCurrency(item.budget)
  return item.budgetType === 'daily' ? `${amt}/day` : amt
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return sortDir === 'asc'
    ? <ArrowUp   className="h-3.5 w-3.5 text-teal" />
    : <ArrowDown className="h-3.5 w-3.5 text-teal" />
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="px-5 pt-5 pb-4">
        <p className="text-xs text-gray font-medium uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CampaignPage() {
  const navigate = useNavigate()
  const { campaignItems: items, setCampaignItems: setItems, agencyItems } = useAppData()
  const agencyNames = useMemo(() => agencyItems.map((a) => a.name), [agencyItems])

  // ── Filter / sort state ──
  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState<CampaignStatus | 'all'>('all')
  const [objectiveFilter, setObjectiveFilter] = useState<CampaignObjective | 'all'>('all')
  const [platformFilter,  setPlatformFilter]  = useState<CampaignPlatform  | 'all'>('all')
  const [sortKey,         setSortKey]         = useState<SortKey>('spend')
  const [sortDir,         setSortDir]         = useState<SortDir>('desc')

  // ── Dialog state ──
  const [editingItem,  setEditingItem]  = useState<CampaignItem | null>(null)
  const [isSyncing,    setIsSyncing]    = useState(false)

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
    }, 1500)
  }

  // ── Summary stats ──
  const activeItems    = items.filter((c) => c.status === 'active')
  const totalSpend     = items.reduce((s, c) => s + c.spend, 0)
  const totalRevenue   = items.reduce((s, c) => s + c.revenue, 0)
  const overallRoas    = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const totalImprs     = items.reduce((s, c) => s + c.impressions, 0)
  const totalClicks    = items.reduce((s, c) => s + c.clicks, 0)
  const avgCtr         = totalImprs > 0 ? (totalClicks / totalImprs) * 100 : 0
  const pausedCount    = items.filter((c) => c.status === 'paused').length
  const draftCount     = items.filter((c) => c.status === 'draft').length

  // ── Filtered + sorted rows ──
  const rows = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = items.filter((c) => {
      const matchSearch    = c.name.toLowerCase().includes(q) || (c.agency ?? '').toLowerCase().includes(q)
      const matchStatus    = statusFilter    === 'all' || c.status    === statusFilter
      const matchObjective = objectiveFilter === 'all' || c.objective === objectiveFilter
      const matchPlatform  = platformFilter  === 'all' || c.platform  === platformFilter
      return matchSearch && matchStatus && matchObjective && matchPlatform
    })

    filtered.sort((a, b) => {
      const aVal = a[sortKey] as string | number
      const bVal = b[sortKey] as string | number
      const cmp  = typeof aVal === 'string'
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return filtered
  }, [items, search, statusFilter, objectiveFilter, platformFilter, sortKey, sortDir])

  function toggleSort(col: SortKey) {
    if (col === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(col); setSortDir('desc') }
  }

  // ── CRUD / status handlers ──

  function handleEdit(values: CampaignFormValues) {
    if (!editingItem) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id ? { ...item, ...values } : item
      )
    )
    setEditingItem(null)
  }

  function setStatus(id: string, status: CampaignStatus) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status } : item))
  }

  const sortableTh = 'cursor-pointer hover:text-foreground transition-colors'

  return (
    <div className="p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
          <p className="mt-0.5 text-sm text-gray">Manage and monitor your Meta Ads campaigns.</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          {isSyncing ? 'Syncing...' : 'Sync with Meta'}
        </Button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Campaigns"
          value={String(items.length)}
          sub={`${activeItems.length} active · ${pausedCount} paused · ${draftCount} draft`}
        />
        <StatCard
          label="Active Campaigns"
          value={String(activeItems.length)}
          sub="currently running"
        />
        <StatCard label="Total Spend"   value={fmtCurrency(totalSpend)} />
        <StatCard label="Total Revenue" value={fmtCurrency(totalRevenue)} />
        <StatCard label="Overall ROAS"  value={fmtRoas(overallRoas)} />
        <StatCard
          label="Impressions"
          value={fmtCompact(totalImprs)}
          sub={`Avg CTR ${fmtPct(avgCtr)}`}
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name or agency…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as CampaignStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={objectiveFilter} onValueChange={(v) => setObjectiveFilter(v as CampaignObjective | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Objectives</SelectItem>
            {(Object.keys(OBJECTIVE_LABEL) as CampaignObjective[]).map((o) => (
              <SelectItem key={o} value={o}>{OBJECTIVE_LABEL[o]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as CampaignPlatform | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="meta">Meta</SelectItem>
            <SelectItem value="google">Google</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-gray">
          {rows.length} of {items.length} campaigns
        </span>
      </div>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={sortableTh} onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1.5">
                  Campaign <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className={sortableTh} onClick={() => toggleSort('status')}>
                <span className="flex items-center gap-1.5">
                  Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className={sortableTh} onClick={() => toggleSort('objective')}>
                <span className="flex items-center gap-1.5">
                  Objective <SortIcon col="objective" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className="hidden sm:table-cell text-right">Budget</TableHead>
              <TableHead className={cn(sortableTh, 'text-right')} onClick={() => toggleSort('spend')}>
                <span className="flex items-center justify-end gap-1.5">
                  Spend <SortIcon col="spend" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className={cn(sortableTh, 'hidden md:table-cell text-right')} onClick={() => toggleSort('impressions')}>
                <span className="flex items-center justify-end gap-1.5">
                  Impressions <SortIcon col="impressions" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className={cn(sortableTh, 'hidden lg:table-cell text-right')} onClick={() => toggleSort('ctr')}>
                <span className="flex items-center justify-end gap-1.5">
                  CTR <SortIcon col="ctr" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className={cn(sortableTh, 'text-right')} onClick={() => toggleSort('roas')}>
                <span className="flex items-center justify-end gap-1.5">
                  ROAS <SortIcon col="roas" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className="hidden xl:table-cell">Agency</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-12 text-center text-gray text-sm">
                  No campaigns match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id}>

                  {/* Campaign name + objective icon + platform */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint text-sage-green">
                        {OBJECTIVE_ICON[item.objective]}
                      </span>
                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/marketing/campaigns/${item.id}`)}
                          className="font-medium text-foreground truncate max-w-[220px] hover:text-teal transition-colors cursor-pointer text-left"
                        >
                          {item.name}
                        </button>
                        <p className="text-[11px] text-gray">{PLATFORM_LABEL[item.platform]}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </TableCell>

                  {/* Objective */}
                  <TableCell className="text-slate whitespace-nowrap text-sm">
                    {OBJECTIVE_LABEL[item.objective]}
                  </TableCell>

                  {/* Budget */}
                  <TableCell className="hidden sm:table-cell text-right text-sm text-slate whitespace-nowrap tabular-nums">
                    {fmtBudget(item)}
                  </TableCell>

                  {/* Spend */}
                  <TableCell className="text-right tabular-nums whitespace-nowrap text-sm font-medium text-foreground">
                    {fmtCurrency(item.spend)}
                  </TableCell>

                  {/* Impressions */}
                  <TableCell className="hidden md:table-cell text-right tabular-nums whitespace-nowrap text-sm text-slate">
                    {fmtCompact(item.impressions)}
                  </TableCell>

                  {/* CTR */}
                  <TableCell className="hidden lg:table-cell text-right tabular-nums whitespace-nowrap text-sm text-slate">
                    {fmtPct(item.ctr)}
                  </TableCell>

                  {/* ROAS */}
                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {item.roas > 0 ? (
                      <span className={cn(
                        'font-semibold',
                        item.roas >= 4 ? 'text-success' : item.roas >= 3 ? 'text-warning' : 'text-error'
                      )}>
                        {fmtRoas(item.roas)}
                      </span>
                    ) : (
                      <span className="text-gray">—</span>
                    )}
                  </TableCell>

                  {/* Agency */}
                  <TableCell className="hidden xl:table-cell whitespace-nowrap text-sm">
                    {item.agency
                      ? <span className="text-slate">{item.agency}</span>
                      : <span className="text-gray italic text-xs">Unassigned</span>
                    }
                  </TableCell>

                  {/* Row actions */}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Campaign actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setEditingItem(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {item.status === 'active' && (
                          <DropdownMenuItem onClick={() => setStatus(item.id, 'paused')}>
                            <Pause className="h-3.5 w-3.5" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {(item.status === 'paused' || item.status === 'draft') && (
                          <DropdownMenuItem onClick={() => setStatus(item.id, 'active')}>
                            <CirclePlay className="h-3.5 w-3.5" />
                            {item.status === 'draft' ? 'Launch' : 'Resume'}
                          </DropdownMenuItem>
                        )}
                        {item.status !== 'archived' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-error focus:text-error"
                              onClick={() => setStatus(item.id, 'archived')}
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                        {item.status === 'archived' && (
                          <DropdownMenuItem onClick={() => setStatus(item.id, 'paused')}>
                            <CirclePlay className="h-3.5 w-3.5" />
                            Restore
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {rows.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs text-gray">
              Showing <span className="font-medium text-foreground">{rows.length}</span> campaigns
            </p>
          </div>
        )}
      </Card>



      {/* ── Edit Campaign dialog ── */}
      <CampaignForm
        mode="edit"
        open={editingItem !== null}
        onOpenChange={(open) => { if (!open) setEditingItem(null) }}
        defaultValues={editingItem ?? undefined}
        onSave={handleEdit}
        agencies={agencyNames}
      />

    </div>
  )
}
