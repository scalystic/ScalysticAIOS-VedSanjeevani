import { useState, useMemo } from 'react'
import {
  Leaf, LogOut, Package, CheckCircle2, Play, CheckSquare,
  Search, FileVideo, Image as ImageIcon, Hash, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

import { useAuth }    from '@/context/AuthContext'
import { useAppData, type ContentItem, type ContentStatus, type ContentType, type ContentCategory } from '@/context/AppData'

// ── Types & constants ──────────────────────────────────────────────────────────

type TimelinePeriod = 'all' | '7d' | '30d' | '90d' | '180d'

// Reference date for timeline filters (data is in 2026)
const TODAY = new Date('2026-06-21')

const TIMELINE_OPTIONS: { value: TimelinePeriod; label: string }[] = [
  { value: 'all',  label: 'All Time'      },
  { value: '7d',   label: 'Last 7 Days'   },
  { value: '30d',  label: 'Last 30 Days'  },
  { value: '90d',  label: 'Last 3 Months' },
  { value: '180d', label: 'Last 6 Months' },
]

const TIMELINE_DAYS: Record<Exclude<TimelinePeriod, 'all'>, number> = {
  '7d': 7, '30d': 30, '90d': 90, '180d': 180,
}

// ── Status maps ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ContentStatus, string> = {
  assigned:  'Assigned',
  accepted:  'Accepted',
  submitted: 'Submitted',
  received:  'Received',
  verified:  'Verified',
  running:   'Running',
  completed: 'Completed',
}

const STATUS_VARIANT: Record<ContentStatus, BadgeProps['variant']> = {
  assigned:  'info',
  accepted:  'teal',
  submitted: 'warning',
  received:  'teal',
  verified:  'mint',
  running:   'success',
  completed: 'muted',
}

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  video: <FileVideo className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
}

const CATEGORY_LABEL: Record<ContentCategory, string> = {
  ugc:         'UGC',
  founder_led: 'Founder Led',
  team:        'Team',
  brand:       'Brand',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function cutoffDate(period: TimelinePeriod): Date | null {
  if (period === 'all') return null
  const d = new Date(TODAY)
  d.setDate(d.getDate() - TIMELINE_DAYS[period])
  return d
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}) {
  return (
    <Card className="border-border">
      <CardContent className="pt-5 pb-5 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', accent)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Agency Portal ──────────────────────────────────────────────────────────────

export default function AgencyPortal() {
  const { user, logout }                    = useAuth()
  const { contentItems, setContentItems }   = useAppData()

  const [timeline,     setTimeline]     = useState<TimelinePeriod>('all')
  const [search,       setSearch]       = useState('')
  const [dialogOpen,   setDialogOpen]   = useState(false)
  const [selected,     setSelected]     = useState<ContentItem | null>(null)
  const [metaVideoId,  setMetaVideoId]  = useState('')
  const [vidIdError,   setVidIdError]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  // All content for this agency
  const agencyContent = useMemo(
    () => contentItems.filter(c => c.agency === user?.agencyName),
    [contentItems, user?.agencyName]
  )

  // Apply timeline filter
  const timelineFiltered = useMemo(() => {
    const cutoff = cutoffDate(timeline)
    if (!cutoff) return agencyContent
    return agencyContent.filter(c => new Date(c.createdAt) >= cutoff)
  }, [agencyContent, timeline])

  // Apply search filter (only for table display)
  const displayItems = useMemo(() => {
    if (!search.trim()) return timelineFiltered
    const q = search.toLowerCase()
    return timelineFiltered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.product.toLowerCase().includes(q) ||
      c.creator.toLowerCase().includes(q)
    )
  }, [timelineFiltered, search])

  // Stats derived from timeline-filtered set
  const stats = useMemo(() => ({
    totalAssigned: timelineFiltered.length,
    received:      timelineFiltered.filter(c => c.status === 'received').length,
    running:       timelineFiltered.filter(c => c.status === 'running').length,
    completed:     timelineFiltered.filter(c => c.status === 'completed').length,
  }), [timelineFiltered])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openDialog(item: ContentItem) {
    setSelected(item)
    setMetaVideoId('')
    setVidIdError('')
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setSelected(null)
    setMetaVideoId('')
    setVidIdError('')
  }

  function handleConfirmReceipt() {
    if (!selected) return
    const id = metaVideoId.trim()
    if (!id) {
      setVidIdError('Meta Video ID is required.')
      return
    }
    if (!/^\d{10,20}$/.test(id)) {
      setVidIdError('Enter a valid numeric Meta Video ID (10–20 digits).')
      return
    }
    setSubmitting(true)
    setContentItems(prev =>
      prev.map(c =>
        c.id === selected.id
          ? { ...c, status: 'received' as ContentStatus, metaVideoId: id }
          : c
      )
    )
    setSubmitting(false)
    closeDialog()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">VedSanjeevani</span>
            <span className="hidden sm:block text-muted-foreground text-sm">/</span>
            <span className="hidden sm:block text-xs text-muted-foreground font-medium">Agency Portal</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-xs font-medium text-foreground">{user?.agencyName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Page Content ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Page heading + timeline filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              All content assigned to {user?.agencyName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Timeline:</span>
            <Select value={timeline} onValueChange={v => setTimeline(v as TimelinePeriod)}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Stats cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Package className="w-4 h-4 text-info" />}
            label="Total Assigned"
            value={stats.totalAssigned}
            accent="bg-info/10"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-teal" />}
            label="Marked Received"
            value={stats.received}
            accent="bg-teal/10"
          />
          <StatCard
            icon={<Play className="w-4 h-4 text-success" />}
            label="Running"
            value={stats.running}
            accent="bg-success/10"
          />
          <StatCard
            icon={<CheckSquare className="w-4 h-4 text-gray" />}
            label="Completed"
            value={stats.completed}
            accent="bg-gray/10"
          />
        </div>

        {/* ── Content Table ────────────────────────────────────────────────── */}
        <Card className="border-border overflow-hidden">

          {/* Table header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground flex-1">
              Content Items
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({displayItems.length} {displayItems.length === 1 ? 'item' : 'items'})
              </span>
            </p>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray pointer-events-none" />
              <Input
                placeholder="Search content…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Content Name</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Creator</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Added</TableHead>
                  <TableHead className="hidden lg:table-cell">Meta Video ID</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-sm">
                      No content found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayItems.map((item, idx) => {
                    const canReceive = item.status === 'assigned' || item.status === 'accepted'
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>

                        {/* Content name */}
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              'flex-shrink-0 w-6 h-6 rounded flex items-center justify-center',
                              item.type === 'video' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                            )}>
                              {TYPE_ICON[item.type]}
                            </span>
                            <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                              {item.name}
                            </span>
                          </div>
                        </TableCell>

                        {/* Product */}
                        <TableCell className="text-sm text-muted-foreground">{item.product}</TableCell>

                        {/* Creator */}
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{item.creator}</TableCell>

                        {/* Category */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[item.category]}</span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[item.status]}>
                            {STATUS_LABEL[item.status]}
                          </Badge>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(item.createdAt)}
                        </TableCell>

                        {/* Meta Video ID */}
                        <TableCell className="hidden lg:table-cell">
                          {item.metaVideoId ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                              <Hash className="w-3 h-3 flex-shrink-0" />
                              {item.metaVideoId}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          {canReceive ? (
                            <Button
                              size="sm"
                              onClick={() => openDialog(item)}
                              className="h-7 text-xs px-3 cursor-pointer whitespace-nowrap"
                            >
                              Mark as Received
                            </Button>
                          ) : item.status === 'received' ? (
                            <Badge variant="teal" className="text-[10px]">Received</Badge>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      {/* ── Mark as Received Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Received</DialogTitle>
            <DialogDescription>
              {selected && (
                <>
                  <span className="font-medium text-foreground">{selected.name}</span>
                  <br />
                  Upload this content to Meta Ads Manager and paste the Video ID below.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Content info pill */}
            {selected && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                <span className={cn(
                  'w-7 h-7 rounded flex items-center justify-center flex-shrink-0',
                  selected.type === 'video' ? 'bg-info/15 text-info' : 'bg-warning/15 text-warning'
                )}>
                  {TYPE_ICON[selected.type]}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.product}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <CalendarDays className="w-3 h-3" />
                  {selected && fmtDate(selected.createdAt)}
                </div>
              </div>
            )}

            {/* Meta Video ID input */}
            <div className="space-y-1.5">
              <Label htmlFor="meta-video-id">
                Meta Video ID
                <span className="text-error ml-1">*</span>
              </Label>
              <Input
                id="meta-video-id"
                placeholder="e.g. 23456789012345"
                value={metaVideoId}
                onChange={e => { setMetaVideoId(e.target.value); setVidIdError('') }}
                className={cn(vidIdError && 'border-error focus-visible:ring-error')}
              />
              {vidIdError ? (
                <p className="text-xs text-error">{vidIdError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Find this in Meta Ads Manager → Ads → Ad Creative → Video ID.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleConfirmReceipt} disabled={submitting} className="cursor-pointer">
              {submitting ? 'Saving…' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
