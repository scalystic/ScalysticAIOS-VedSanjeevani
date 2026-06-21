import { useState, useMemo } from 'react'
import { useNavigate }       from 'react-router'
import { Search, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button }    from '@/components/ui/button'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Input }     from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { CreatorForm, type CreatorFormValues } from './CreatorForm'
import { useAppData, type CreatorItem, type CreatorType, type CreatorStatus } from '@/context/AppData'

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

const STATUS_VARIANT: Record<CreatorStatus, BadgeProps['variant']> = {
  active:   'success',
  inactive: 'warning',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(v: number) {
  if (v === 0) return '—'
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000)    return `₹${(v / 1_000).toFixed(0)}K`
  return `₹${v}`
}
function fmtRoas(v: number) { return v > 0 ? `${v.toFixed(2)}x` : '—' }

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreatorsPage() {
  const navigate = useNavigate()
  const { creatorItems, setCreatorItems, contentItems, adItems } = useAppData()

  // ── Derived stats: per-creator content count, spend, revenue from adItems ──
  const creatorStats = useMemo(() => {
    // Content count per creator
    const contentCount = new Map<string, number>()
    for (const c of contentItems) {
      contentCount.set(c.creator, (contentCount.get(c.creator) ?? 0) + 1)
    }
    // Spend / revenue per creator via adItems → contentItems
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

  // ── Summary numbers ──
  const totalContent = contentItems.length
  const activeCount  = creatorItems.filter(c => c.status === 'active').length
  const allPerf      = [...creatorStats.perf.values()]
  const totalSpend   = allPerf.reduce((s, p) => s + p.spend, 0)
  const totalRevenue = allPerf.reduce((s, p) => s + p.revenue, 0)
  const overallRoas  = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // ── Filters ──
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState<CreatorType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CreatorStatus | 'all'>('all')

  // ── Dialog state ──
  const [addOpen,        setAddOpen]        = useState(false)
  const [editingCreator, setEditingCreator] = useState<CreatorItem | null>(null)

  // ── Filtered rows ──
  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return creatorItems.filter(c => {
      const matchSearch = (
        c.name.toLowerCase().includes(q) ||
        (c.handle ?? '').toLowerCase().includes(q) ||
        (c.platform ?? '').toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q)
      )
      const matchType   = typeFilter   === 'all' || c.type   === typeFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchType && matchStatus
    })
  }, [creatorItems, search, typeFilter, statusFilter])

  // ── CRUD ──
  function handleAdd(values: CreatorFormValues) {
    const item: CreatorItem = {
      id:           `crt_${Date.now()}`,
      name:         values.name,
      type:         values.type,
      handle:       values.handle,
      platform:     values.platform,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      ratePerVideo: values.ratePerVideo,
      ratePerImage: values.ratePerImage,
      status:       values.status,
      joinedAt:     new Date().toISOString().split('T')[0],
    }
    setCreatorItems(prev => [item, ...prev])
    setAddOpen(false)
  }

  function handleEdit(values: CreatorFormValues) {
    if (!editingCreator) return
    setCreatorItems(prev =>
      prev.map(c => c.id === editingCreator.id ? { ...c, ...values } : c)
    )
    setEditingCreator(null)
  }

  function handleDelete(id: string) {
    setCreatorItems(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Creators</h1>
          <p className="mt-0.5 text-sm text-gray">Manage influencers, UGC creators, and in-house team.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Add Creator
        </Button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Creators" value={String(creatorItems.length)} sub={`${activeCount} active`} />
        <StatCard label="Total Content"  value={String(totalContent)} />
        <StatCard label="Total Spend"    value={fmtINR(totalSpend)} />
        <StatCard label="Overall ROAS"   value={fmtRoas(overallRoas)} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray pointer-events-none" />
          <Input
            placeholder="Search by name, handle, platform…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as CreatorType | 'all')}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="influencer">Influencer</SelectItem>
            <SelectItem value="ugc_creator">UGC Creator</SelectItem>
            <SelectItem value="in_house">In-house</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as CreatorStatus | 'all')}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-gray">
          {rows.length} of {creatorItems.length} creators
        </span>
      </div>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Creator</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden sm:table-cell">Handle</TableHead>
              <TableHead className="text-right">Content</TableHead>
              <TableHead className="hidden md:table-cell text-right">Total Spend</TableHead>
              <TableHead className="hidden md:table-cell text-right">ROAS</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Rate / Video</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Rate / Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-12 text-center text-sm text-gray">
                  No creators match your filters.
                </TableCell>
              </TableRow>
            ) : rows.map(creator => {
              const count  = creatorStats.contentCount.get(creator.name) ?? 0
              const perf   = creatorStats.perf.get(creator.name)
              const spend  = perf?.spend   ?? 0
              const revenue = perf?.revenue ?? 0
              const roas   = spend > 0 ? revenue / spend : 0

              return (
                <TableRow key={creator.id}>

                  {/* Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-deep-green text-off-white text-sm font-bold select-none">
                        {creator.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/marketing/creators/${creator.id}`)}
                          className="font-medium text-foreground hover:text-teal transition-colors cursor-pointer text-left truncate max-w-[160px]"
                        >
                          {creator.name}
                        </button>
                        <p className="text-[11px] text-gray truncate">{creator.contactEmail}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[creator.type]}>{TYPE_LABEL[creator.type]}</Badge>
                  </TableCell>

                  {/* Handle */}
                  <TableCell className="hidden sm:table-cell">
                    {creator.handle ? (
                      <div>
                        <p className="text-sm text-slate">{creator.handle}</p>
                        {creator.platform && <p className="text-[11px] text-gray">{creator.platform}</p>}
                      </div>
                    ) : (
                      <span className="text-gray italic text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Content count */}
                  <TableCell className="text-right tabular-nums font-medium text-foreground">
                    {count}
                  </TableCell>

                  {/* Spend */}
                  <TableCell className="hidden md:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                    {fmtINR(spend)}
                  </TableCell>

                  {/* ROAS */}
                  <TableCell className="hidden md:table-cell text-right tabular-nums whitespace-nowrap">
                    {roas > 0 ? (
                      <span className={cn('font-semibold',
                        roas >= 4 ? 'text-success' : roas >= 3 ? 'text-warning' : 'text-error'
                      )}>
                        {fmtRoas(roas)}
                      </span>
                    ) : <span className="text-gray">—</span>}
                  </TableCell>

                  {/* Rate per video */}
                  <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                    {creator.ratePerVideo > 0 ? fmtINR(creator.ratePerVideo) : <span className="text-gray">—</span>}
                  </TableCell>

                  {/* Rate per image */}
                  <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm text-slate whitespace-nowrap">
                    {creator.ratePerImage > 0 ? fmtINR(creator.ratePerImage) : <span className="text-gray">—</span>}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[creator.status]}>
                      {creator.status.charAt(0).toUpperCase() + creator.status.slice(1)}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => navigate(`/marketing/creators/${creator.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCreator(creator)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-error focus:text-error"
                          onClick={() => handleDelete(creator.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {rows.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs text-gray">
              Showing <span className="font-medium text-foreground">{rows.length}</span> creator{rows.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </Card>

      {/* ── Dialogs ── */}
      <CreatorForm mode="add"  open={addOpen}               onOpenChange={setAddOpen}                                                      onSave={handleAdd}  />
      <CreatorForm mode="edit" open={editingCreator !== null} onOpenChange={o => { if (!o) setEditingCreator(null) }} defaultValues={editingCreator ?? undefined} onSave={handleEdit} />

    </div>
  )
}
