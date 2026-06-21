import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  FileVideo, Image,
  Search, Plus, ArrowUpDown, ArrowUp, ArrowDown,
  ExternalLink, MoreHorizontal, Pencil, CalendarDays,
} from 'lucide-react'
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

import { ContentForm, type ContentFormValues } from './ContentForm'
import { useAppData, type ContentItem, type ContentStatus, type ContentType, type ContentCategory } from '@/context/AppData'

// ── Types ──────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'creator' | 'agency' | 'status' | 'roas'
type SortDir = 'asc' | 'desc'

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

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  video: <FileVideo className="h-3.5 w-3.5" />,
  image: <Image    className="h-3.5 w-3.5" />,
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(value: number, type: 'currency' | 'roas') {
  if (value === 0) return '—'
  if (type === 'currency') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(value)
  }
  return `${value.toFixed(2)}x`
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

export default function ContentPage() {
  const navigate = useNavigate()
  // ── Shared data ──
  const { contentItems: items, setContentItems: setItems, agencyItems, adItems } = useAppData()
  const agencyNames = useMemo(() => agencyItems.map(a => a.name), [agencyItems])

  // ── Per-content performance derived from adItems (campaigns = source of truth) ──
  const contentPerf = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number }>()
    for (const ad of adItems) {
      if (!ad.contentId) continue
      const prev = map.get(ad.contentId) ?? { spend: 0, revenue: 0 }
      map.set(ad.contentId, {
        spend:   prev.spend   + ad.spend,
        revenue: prev.revenue + ad.spend * ad.roas,
      })
    }
    return map
  }, [adItems])

  // ── Filter / sort state ──
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<ContentStatus   | 'all'>('all')
  const [typeFilter, setTypeFilter]       = useState<ContentType     | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<ContentCategory | 'all'>('all')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [sortKey, setSortKey]             = useState<SortKey>('roas')
  const [sortDir, setSortDir]             = useState<SortDir>('desc')

  // ── Dialog state ──
  const [addOpen, setAddOpen]         = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)

  // ── Summary stats — spend/revenue derived from adItems ──
  const allPerf         = useMemo(() => [...contentPerf.values()], [contentPerf])
  const totalSpend      = allPerf.reduce((s, p) => s + p.spend,   0)
  const totalRevenue    = allPerf.reduce((s, p) => s + p.revenue, 0)
  const overallRoas     = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const activeCount     = items.filter((c) => c.status === 'active').length
  const unassignedCount = items.filter((c) => c.status === 'unassigned').length

  // ── Filtered + sorted rows ──
  const rows = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = items.filter((c) => {
      const matchSearch = (
        c.name.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q) ||
        (c.product ?? '').toLowerCase().includes(q) ||
        (c.agency ?? '').toLowerCase().includes(q)
      )
      const matchStatus   = statusFilter   === 'all' || c.status   === statusFilter
      const matchType     = typeFilter     === 'all' || c.type     === typeFilter
      const matchCategory = categoryFilter === 'all' || c.category === categoryFilter
      const matchFrom     = !dateFrom || c.createdAt >= dateFrom
      const matchTo       = !dateTo   || c.createdAt <= dateTo
      return matchSearch && matchStatus && matchType && matchCategory && matchFrom && matchTo
    })

    filtered.sort((a, b) => {
      const getRoas = (item: typeof a) => {
        const p = contentPerf.get(item.id)
        return p && p.spend > 0 ? p.revenue / p.spend : 0
      }
      const aVal = sortKey === 'roas' ? getRoas(a) : ((a[sortKey] ?? '') as string | number)
      const bVal = sortKey === 'roas' ? getRoas(b) : ((b[sortKey] ?? '') as string | number)
      const cmp  = typeof aVal === 'string'
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return filtered
  }, [items, search, statusFilter, typeFilter, categoryFilter, dateFrom, dateTo, sortKey, sortDir, contentPerf])

  function toggleSort(col: SortKey) {
    if (col === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(col); setSortDir('desc') }
  }

  // ── CRUD handlers ──
  function handleAdd(values: ContentFormValues) {
    const newItem: ContentItem = {
      id:            `cnt_${Date.now()}`,
      name:          values.name,
      type:          values.type,
      category:      values.category,
      creator:       values.creator,
      product:       values.product,
      driveUrl:      values.driveUrl,
      agency:        values.agency,
      status:        values.agency ? 'received' : 'unassigned',
      campaignCount: 0,
      spend:         0,
      revenue:       0,
      roas:          0,
      createdAt:     new Date().toISOString().split('T')[0],
    }
    setItems((prev) => [newItem, ...prev])
    setAddOpen(false)
  }

  function handleEdit(values: ContentFormValues) {
    if (!editingItem) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...values, status: values.agency ? item.status : 'unassigned' }
          : item
      )
    )
    setEditingItem(null)
  }

  const sortableTh = 'cursor-pointer hover:text-foreground transition-colors'

  return (
    <div className="p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Content Library</h1>
          <p className="mt-0.5 text-sm text-gray">Track content from creation through performance.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Add Content
        </Button>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Content"
          value={String(items.length)}
          sub={`${activeCount} active · ${unassignedCount} unassigned`}
        />
        <StatCard label="Total Spend"   value={fmt(totalSpend,   'currency')} />
        <StatCard label="Total Revenue" value={fmt(totalRevenue, 'currency')} />
        <StatCard label="Overall ROAS"  value={fmt(overallRoas,  'roas')} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, creator, agency…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContentStatus | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(['unassigned', 'assigned', 'received', 'active', 'completed'] as ContentStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ContentType | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Media" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Media</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ContentCategory | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Formats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="ugc">UGC</SelectItem>
            <SelectItem value="founder_led">Founder Led</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-gray shrink-0" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[148px]"
            title="From date"
          />
          <span className="text-gray text-sm">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[148px]"
            title="To date"
          />
        </div>

        <span className="ml-auto text-xs text-gray">
          {rows.length} of {items.length} items
        </span>
      </div>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={sortableTh} onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1.5">Content Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={sortableTh} onClick={() => toggleSort('creator')}>
                <span className="flex items-center gap-1.5">Creator <SortIcon col="creator" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={sortableTh} onClick={() => toggleSort('agency')}>
                <span className="flex items-center gap-1.5">Agency <SortIcon col="agency" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={sortableTh} onClick={() => toggleSort('status')}>
                <span className="flex items-center gap-1.5">Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={cn(sortableTh, 'text-right')} onClick={() => toggleSort('roas')}>
                <span className="flex items-center justify-end gap-1.5">ROAS <SortIcon col="roas" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center text-gray text-sm">
                  No content matches your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
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
                          className="font-medium text-foreground truncate max-w-[200px] hover:text-teal transition-colors cursor-pointer text-left"
                        >
                          {item.name}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] text-gray truncate">{item.product ?? <span className="italic">No product</span>}</p>
                          <span className={cn(
                            'inline-flex shrink-0 items-center rounded px-1.5 py-0 text-[10px] font-semibold leading-4',
                            CATEGORY_COLOR[item.category]
                          )}>
                            {CATEGORY_LABEL[item.category]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Creator */}
                  <TableCell className="text-slate whitespace-nowrap">{item.creator}</TableCell>

                  {/* Agency */}
                  <TableCell className="whitespace-nowrap">
                    {item.agency
                      ? <span className="text-slate">{item.agency}</span>
                      : <span className="text-gray italic text-xs">Unassigned</span>
                    }
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </TableCell>

                  {/* ROAS — derived from adItems */}
                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {(() => {
                      const perf = contentPerf.get(item.id)
                      const roas = perf && perf.spend > 0 ? perf.revenue / perf.spend : 0
                      return roas > 0 ? (
                        <span className={cn(
                          'font-semibold',
                          roas >= 4 ? 'text-success' : roas >= 3 ? 'text-warning' : 'text-error'
                        )}>
                          {fmt(roas, 'roas')}
                        </span>
                      ) : (
                        <span className="text-gray">—</span>
                      )
                    })()}
                  </TableCell>

                  {/* Row actions */}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Row actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setEditingItem(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a href={item.driveUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Drive
                          </a>
                        </DropdownMenuItem>
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
              Showing <span className="font-medium text-foreground">{rows.length}</span> content items
            </p>
          </div>
        )}
      </Card>

      {/* ── Add Content dialog ── */}
      <ContentForm
        mode="add"
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAdd}
        agencies={agencyNames}
      />

      {/* ── Edit Content dialog ── */}
      <ContentForm
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
