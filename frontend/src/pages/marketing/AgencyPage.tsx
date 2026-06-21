import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  Plus, Search, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Pencil, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button }                 from '@/components/ui/button'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Input }                  from '@/components/ui/input'
import { Card, CardContent }      from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { AgencyForm, type AgencyFormValues }   from './AgencyForm'
import { CreatorForm, type CreatorFormValues } from './CreatorForm'
import {
  useAppData,
  type AgencyItem, type AgencyType, type AgencyStatus,
  type CreatorItem, type CreatorType, type CreatorStatus,
} from '@/context/AppData'

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmtINR(v: number) {
  if (v === 0) return '—'
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000)    return `₹${(v / 1_000).toFixed(0)}K`
  return `₹${v}`
}
function fmtRoas(v: number) { return v > 0 ? `${v.toFixed(2)}x` : '—' }

type SortDir = 'asc' | 'desc'

function SortIcon<T extends string>({ col, sortKey, sortDir }: { col: T; sortKey: T; sortDir: SortDir }) {
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

// ── Agency config ─────────────────────────────────────────────────────────────

const AGENCY_TYPE_LABEL: Record<AgencyType, string> = {
  performance: 'Performance Marketing',
  creator:     'Creator',
}
const AGENCY_TYPE_VARIANT: Record<AgencyType, BadgeProps['variant']> = {
  performance: 'info',
  creator:     'teal',
}
const AGENCY_STATUS_VARIANT: Record<AgencyStatus, BadgeProps['variant']> = {
  active:   'success',
  inactive: 'muted',
}
type AgencySortKey = 'name' | 'type' | 'status' | 'roas'

// ── Creator config ────────────────────────────────────────────────────────────

const CREATOR_TYPE_LABEL: Record<CreatorType, string> = {
  influencer:  'Influencer',
  ugc_creator: 'UGC Creator',
  in_house:    'In-house',
}
const CREATOR_TYPE_VARIANT: Record<CreatorType, BadgeProps['variant']> = {
  influencer:  'info',
  ugc_creator: 'teal',
  in_house:    'muted',
}
const CREATOR_STATUS_VARIANT: Record<CreatorStatus, BadgeProps['variant']> = {
  active:   'success',
  inactive: 'warning',
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ActiveTab = 'agencies' | 'creators'

export default function AgencyPage() {
  const navigate = useNavigate()
  const {
    agencyItems, setAgencyItems,
    creatorItems, setCreatorItems,
    contentItems, campaignItems, adItems,
  } = useAppData()

  const [activeTab, setActiveTab] = useState<ActiveTab>('agencies')

  // ─── Derived: agency content stats ───────────────────────────────────────
  const agencyStats = useMemo(() => {
    const map = new Map<string, { assigned: number; running: number; notRunning: number }>()
    for (const c of contentItems) {
      if (!c.agency) continue
      const prev = map.get(c.agency) ?? { assigned: 0, running: 0, notRunning: 0 }
      map.set(c.agency, {
        assigned:   prev.assigned + 1,
        running:    prev.running    + (c.status === 'active' ? 1 : 0),
        notRunning: prev.notRunning + (c.status !== 'active' && c.status !== 'completed' ? 1 : 0),
      })
    }
    return map
  }, [contentItems])

  const agencyRoas = useMemo(() => {
    const spend   = new Map<string, number>()
    const revenue = new Map<string, number>()
    for (const c of campaignItems) {
      if (!c.agency) continue
      spend.set(c.agency,   (spend.get(c.agency)   ?? 0) + c.spend)
      revenue.set(c.agency, (revenue.get(c.agency) ?? 0) + c.revenue)
    }
    const map = new Map<string, number>()
    for (const [name, s] of spend) {
      const r = revenue.get(name) ?? 0
      map.set(name, s > 0 ? r / s : 0)
    }
    return map
  }, [campaignItems])

  // ─── Derived: creator stats ───────────────────────────────────────────────
  const creatorStats = useMemo(() => {
    const contentCount = new Map<string, number>()
    for (const c of contentItems) {
      contentCount.set(c.creator, (contentCount.get(c.creator) ?? 0) + 1)
    }
    const perf = new Map<string, { spend: number; revenue: number }>()
    for (const ad of adItems) {
      if (!ad.contentId) continue
      const c = contentItems.find(x => x.id === ad.contentId)
      if (!c) continue
      const prev = perf.get(c.creator) ?? { spend: 0, revenue: 0 }
      perf.set(c.creator, {
        spend:   prev.spend   + ad.spend,
        revenue: prev.revenue + ad.spend * ad.roas,
      })
    }
    return { contentCount, perf }
  }, [contentItems, adItems])

  // ─── Agency state ─────────────────────────────────────────────────────────
  const [agencySearch,  setAgencySearch]  = useState('')
  const [agencySortKey, setAgencySortKey] = useState<AgencySortKey>('name')
  const [agencySortDir,    setAgencySortDir]    = useState<SortDir>('asc')
  const [addAgencyOpen,    setAddAgencyOpen]    = useState(false)
  const [editingAgency,    setEditingAgency]    = useState<AgencyItem | null>(null)

  const agencyRows = useMemo(() => {
    const q = agencySearch.toLowerCase()
    return agencyItems
      .filter(a =>
        a.name.toLowerCase().includes(q) || a.contactName.toLowerCase().includes(q) || a.contactEmail.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = agencySortKey === 'roas' ? (agencyRoas.get(a.name) ?? 0) : a[agencySortKey] as string
        const bv = agencySortKey === 'roas' ? (agencyRoas.get(b.name) ?? 0) : b[agencySortKey] as string
        const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
        return agencySortDir === 'asc' ? cmp : -cmp
      })
  }, [agencyItems, agencySearch, agencySortKey, agencySortDir, agencyRoas])

  function toggleAgencySort(col: AgencySortKey) {
    if (col === agencySortKey) setAgencySortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setAgencySortKey(col); setAgencySortDir('asc') }
  }

  function handleAddAgency(values: AgencyFormValues) {
    const item: AgencyItem = {
      id: `agc_${Date.now()}`, name: values.name, type: values.type,
      contactName: values.contactName, contactEmail: values.contactEmail, contactPhone: values.contactPhone,
      status: values.status, assignedContent: 0, verifiedContent: 0, runningContent: 0, roas: 0,
      joinedAt: new Date().toISOString().split('T')[0],
    }
    setAgencyItems(prev => [item, ...prev])
    setAddAgencyOpen(false)
  }
  function handleEditAgency(values: AgencyFormValues) {
    if (!editingAgency) return
    setAgencyItems(prev => prev.map(a => a.id === editingAgency.id ? { ...a, ...values } : a))
    setEditingAgency(null)
  }

  // ─── Creator state ────────────────────────────────────────────────────────
  const [creatorSearch,       setCreatorSearch]       = useState('')
  const [creatorTypeFilter,   setCreatorTypeFilter]   = useState<CreatorType | 'all'>('all')
  const [creatorStatusFilter, setCreatorStatusFilter] = useState<CreatorStatus | 'all'>('all')
  const [addCreatorOpen,      setAddCreatorOpen]      = useState(false)
  const [editingCreator,      setEditingCreator]      = useState<CreatorItem | null>(null)

  const creatorRows = useMemo(() => {
    const q = creatorSearch.toLowerCase()
    return creatorItems.filter(c =>
      (c.name.toLowerCase().includes(q) || (c.handle ?? '').toLowerCase().includes(q) || c.contactEmail.toLowerCase().includes(q)) &&
      (creatorTypeFilter   === 'all' || c.type   === creatorTypeFilter) &&
      (creatorStatusFilter === 'all' || c.status === creatorStatusFilter)
    )
  }, [creatorItems, creatorSearch, creatorTypeFilter, creatorStatusFilter])

  function handleAddCreator(values: CreatorFormValues) {
    const item: CreatorItem = {
      id: `crt_${Date.now()}`, name: values.name, type: values.type,
      handle: values.handle, platform: values.platform,
      contactEmail: values.contactEmail, contactPhone: values.contactPhone,
      ratePerVideo: values.ratePerVideo, ratePerImage: values.ratePerImage,
      status: values.status, joinedAt: new Date().toISOString().split('T')[0],
    }
    setCreatorItems(prev => [item, ...prev])
    setAddCreatorOpen(false)
  }
  function handleEditCreator(values: CreatorFormValues) {
    if (!editingCreator) return
    setCreatorItems(prev => prev.map(c => c.id === editingCreator.id ? { ...c, ...values } : c))
    setEditingCreator(null)
  }
  function handleDeleteCreator(id: string) {
    setCreatorItems(prev => prev.filter(c => c.id !== id))
  }

  const sortableTh = 'cursor-pointer hover:text-foreground transition-colors'

  const creatorAllPerf      = [...creatorStats.perf.values()]
  const creatorTotalSpend   = creatorAllPerf.reduce((s, p) => s + p.spend,   0)
  const creatorTotalRevenue = creatorAllPerf.reduce((s, p) => s + p.revenue, 0)
  const creatorOverallRoas  = creatorTotalSpend > 0 ? creatorTotalRevenue / creatorTotalSpend : 0

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {activeTab === 'agencies' ? 'Performance Marketing' : 'Creators'}
          </h1>
          <p className="mt-0.5 text-sm text-gray">
            {activeTab === 'agencies'
              ? 'Manage your performance marketing agencies.'
              : 'Manage influencers, UGC creators, and in-house team.'}
          </p>
        </div>
        {activeTab === 'agencies'
          ? <Button onClick={() => setAddAgencyOpen(true)}><Plus />Add Agency</Button>
          : <Button onClick={() => setAddCreatorOpen(true)}><Plus />Add Creator</Button>
        }
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-border">
        {(['agencies', 'creators'] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer',
              activeTab === tab
                ? 'border-teal text-teal'
                : 'border-transparent text-gray hover:text-foreground'
            )}
          >
            {tab === 'agencies'
              ? `Performance Marketing (${agencyItems.length})`
              : `Creators (${creatorItems.length})`}
          </button>
        ))}
      </div>

      {/* ════════════ AGENCIES TAB ════════════ */}
      {activeTab === 'agencies' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Agencies"   value={String(agencyItems.length)} sub={`${agencyItems.filter(a => a.status === 'active').length} active`} />
            <StatCard label="Performance Mktg" value={String(agencyItems.filter(a => a.type === 'performance').length)} />
            <StatCard label="Creator Agencies" value={String(agencyItems.filter(a => a.type === 'creator').length)} />
            <StatCard label="Active Rate"      value={`${Math.round((agencyItems.filter(a => a.status === 'active').length / Math.max(agencyItems.length, 1)) * 100)}%`} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray pointer-events-none" />
              <Input placeholder="Search by name or contact…" value={agencySearch} onChange={e => setAgencySearch(e.target.value)} className="pl-9" />
            </div>
            <span className="ml-auto text-xs text-gray">{agencyRows.length} of {agencyItems.length}</span>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={sortableTh} onClick={() => toggleAgencySort('name')}>
                    <span className="flex items-center gap-1.5">Agency Name <SortIcon col="name" sortKey={agencySortKey} sortDir={agencySortDir} /></span>
                  </TableHead>
                  <TableHead className={sortableTh} onClick={() => toggleAgencySort('type')}>
                    <span className="flex items-center gap-1.5">Type <SortIcon col="type" sortKey={agencySortKey} sortDir={agencySortDir} /></span>
                  </TableHead>
                  <TableHead className={sortableTh} onClick={() => toggleAgencySort('status')}>
                    <span className="flex items-center gap-1.5">Status <SortIcon col="status" sortKey={agencySortKey} sortDir={agencySortDir} /></span>
                  </TableHead>
                  <TableHead className="text-center">Assigned</TableHead>
                  <TableHead className="text-center">Running</TableHead>
                  <TableHead className="text-center">Not Running</TableHead>
                  <TableHead className={cn(sortableTh, 'text-right')} onClick={() => toggleAgencySort('roas')}>
                    <span className="flex items-center justify-end gap-1.5">ROAS <SortIcon col="roas" sortKey={agencySortKey} sortDir={agencySortDir} /></span>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencyRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-gray">No agencies match your filters.</TableCell>
                  </TableRow>
                ) : agencyRows.map(agency => {
                  const stats = agencyStats.get(agency.name) ?? { assigned: 0, running: 0, notRunning: 0 }
                  const roas  = agencyRoas.get(agency.name) ?? 0
                  return (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint text-deep-green text-xs font-bold select-none">
                            {agency.name.charAt(0)}
                          </span>
                          <button onClick={() => navigate(`/marketing/agencies/${agency.id}`)}
                            className="font-medium text-foreground hover:text-teal transition-colors cursor-pointer whitespace-nowrap">
                            {agency.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={AGENCY_TYPE_VARIANT[agency.type]}>{AGENCY_TYPE_LABEL[agency.type]}</Badge></TableCell>
                      <TableCell><Badge variant={AGENCY_STATUS_VARIANT[agency.status]}>{agency.status === 'active' ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-center text-slate tabular-nums">{stats.assigned || <span className="text-gray">—</span>}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {stats.running > 0 ? <span className="font-medium text-success">{stats.running}</span> : <span className="text-gray">—</span>}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {stats.notRunning > 0 ? <span className="text-slate">{stats.notRunning}</span> : <span className="text-gray">—</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {roas > 0 ? (
                          <span className={cn('font-semibold', roas >= 4 ? 'text-success' : roas >= 3 ? 'text-warning' : 'text-error')}>{fmtRoas(roas)}</span>
                        ) : <span className="text-gray">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => navigate(`/marketing/agencies/${agency.id}`)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingAgency(agency)}><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {agencyRows.length > 0 && (
              <div className="border-t border-border px-4 py-3">
                <p className="text-xs text-gray">Showing <span className="font-medium text-foreground">{agencyRows.length}</span> agencies</p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ════════════ CREATORS TAB ════════════ */}
      {activeTab === 'creators' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Creators" value={String(creatorItems.length)} sub={`${creatorItems.filter(c => c.status === 'active').length} active`} />
            <StatCard label="Total Content"  value={String(contentItems.length)} />
            <StatCard label="Total Spend"    value={fmtINR(creatorTotalSpend)} />
            <StatCard label="Overall ROAS"   value={fmtRoas(creatorOverallRoas)} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray pointer-events-none" />
              <Input placeholder="Search by name, handle…" value={creatorSearch} onChange={e => setCreatorSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={creatorTypeFilter} onValueChange={v => setCreatorTypeFilter(v as CreatorType | 'all')}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="influencer">Influencer</SelectItem>
                <SelectItem value="ugc_creator">UGC Creator</SelectItem>
                <SelectItem value="in_house">In-house</SelectItem>
              </SelectContent>
            </Select>
            <Select value={creatorStatusFilter} onValueChange={v => setCreatorStatusFilter(v as CreatorStatus | 'all')}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-gray">{creatorRows.length} of {creatorItems.length}</span>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Creator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Content</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Spend</TableHead>
                  <TableHead className="hidden md:table-cell text-right">ROAS</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Rate / Video</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Rate / Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {creatorRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-gray">No creators match your filters.</TableCell>
                  </TableRow>
                ) : creatorRows.map(creator => {
                  const count   = creatorStats.contentCount.get(creator.name) ?? 0
                  const perf    = creatorStats.perf.get(creator.name)
                  const spend   = perf?.spend   ?? 0
                  const revenue = perf?.revenue ?? 0
                  const roas    = spend > 0 ? revenue / spend : 0
                  return (
                    <TableRow key={creator.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-deep-green text-off-white text-sm font-bold select-none">
                            {creator.name.charAt(0)}
                          </span>
                          <button
                              onClick={() => navigate(`/marketing/creators/${creator.id}`)}
                              className="font-medium text-foreground hover:text-teal transition-colors cursor-pointer text-left truncate max-w-[160px]"
                            >
                              {creator.name}
                            </button>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={CREATOR_TYPE_VARIANT[creator.type]}>{CREATOR_TYPE_LABEL[creator.type]}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-foreground">{count}</TableCell>
                      <TableCell className="hidden md:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">{fmtINR(spend)}</TableCell>
                      <TableCell className="hidden md:table-cell text-right tabular-nums whitespace-nowrap">
                        {roas > 0 ? (
                          <span className={cn('font-semibold', roas >= 4 ? 'text-success' : roas >= 3 ? 'text-warning' : 'text-error')}>{fmtRoas(roas)}</span>
                        ) : <span className="text-gray">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {creator.ratePerVideo > 0 ? fmtINR(creator.ratePerVideo) : <span className="text-gray">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                        {creator.ratePerImage > 0 ? fmtINR(creator.ratePerImage) : <span className="text-gray">—</span>}
                      </TableCell>
                      <TableCell><Badge variant={CREATOR_STATUS_VARIANT[creator.status]}>{creator.status === 'active' ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => navigate(`/marketing/creators/${creator.id}`)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingCreator(creator)}><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-error focus:text-error" onClick={() => handleDeleteCreator(creator.id)}>
                              <Trash2 className="h-3.5 w-3.5" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {creatorRows.length > 0 && (
              <div className="border-t border-border px-4 py-3">
                <p className="text-xs text-gray">Showing <span className="font-medium text-foreground">{creatorRows.length}</span> creators</p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── Dialogs ── */}
      <AgencyForm  mode="add"  open={addAgencyOpen}          onOpenChange={setAddAgencyOpen}                                                              onSave={handleAddAgency}  />
      <AgencyForm  mode="edit" open={editingAgency !== null}  onOpenChange={o => { if (!o) setEditingAgency(null) }}   defaultValues={editingAgency  ?? undefined} onSave={handleEditAgency}  />
      <CreatorForm mode="add"  open={addCreatorOpen}          onOpenChange={setAddCreatorOpen}                                                             onSave={handleAddCreator} />
      <CreatorForm mode="edit" open={editingCreator !== null} onOpenChange={o => { if (!o) setEditingCreator(null) }}  defaultValues={editingCreator ?? undefined} onSave={handleEditCreator} />

    </div>
  )
}
