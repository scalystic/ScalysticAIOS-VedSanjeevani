import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronsUpDown, Search, Check } from 'lucide-react'

import { CREATORS, useAppData, type ProductItem } from '@/context/AppData'
import { cn }             from '@/lib/utils'
import { Button }         from '@/components/ui/button'
import { Input }          from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:     z.string().min(1, 'Content name is required').max(100),
  type:     z.enum(['video', 'image']),
  category: z.enum(['ugc', 'founder_led', 'team', 'brand']),
  creator:  z.string().min(1, 'Creator is required'),
  product:  z.string().nullable(),
  driveUrl: z.string().min(1, 'Drive URL is required'),
  agency:   z.string().nullable(),
})

export type ContentFormValues = z.infer<typeof schema>

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'add' | 'edit'

interface ContentFormProps {
  mode: Mode
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<ContentFormValues>
  onSave: (values: ContentFormValues) => void
  agencies: string[]
}

// ── Product combobox ──────────────────────────────────────────────────────────

function ProductCombobox({
  value,
  onChange,
  products,
}: {
  value: string | null
  onChange: (val: string | null) => void
  products: ProductItem[]
}) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const containerRef          = useRef<HTMLDivElement>(null)
  const searchInputRef        = useRef<HTMLInputElement>(null)

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => searchInputRef.current?.focus(), 10)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function select(name: string | null) {
    onChange(name)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input',
          'bg-transparent px-3 py-2 text-sm shadow-sm',
          'hover:border-ring/60 focus:outline-none focus:ring-1 focus:ring-ring',
          'transition-colors',
        )}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ?? <span className="italic text-gray text-xs">No product</span>}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={cn(
          'absolute z-[200] mt-1 w-full rounded-md border border-border',
          'bg-card shadow-lg overflow-hidden',
        )}>
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gray shrink-0" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray"
            />
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {/* No product option */}
            <button
              type="button"
              onClick={() => select(null)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm',
                'hover:bg-light-gray transition-colors',
                !value && 'text-teal',
              )}
            >
              <span className="italic text-gray">No product</span>
              {!value && <Check className="h-3.5 w-3.5 text-teal" />}
            </button>

            {filtered.length > 0
              ? filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => select(p.name)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-sm',
                      'hover:bg-light-gray transition-colors',
                      value === p.name && 'text-teal font-medium',
                    )}
                  >
                    <span>{p.name}</span>
                    {value === p.name && <Check className="h-3.5 w-3.5 text-teal" />}
                  </button>
                ))
              : (
                <p className="px-3 py-2 text-sm text-gray italic">No products found.</p>
              )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContentForm({ mode, open, onOpenChange, defaultValues, onSave, agencies }: ContentFormProps) {
  const { productItems } = useAppData()

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:     '',
      type:     'video',
      category: 'ugc',
      creator:  '',
      product:  null,
      driveUrl: '',
      agency:   null,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name:     '',
        type:     'video',
        category: 'ugc',
        creator:  '',
        product:  null,
        driveUrl: '',
        agency:   null,
        ...defaultValues,
      })
    }
  }, [open, defaultValues, form])

  function handleSubmit(values: ContentFormValues) {
    onSave(values)
  }

  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">

        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Content' : 'Add Content'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the content details below.'
              : 'Fill in the details to add a new content record.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 py-4 space-y-4">

            {/* Content Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ashwagandha – Stress Relief 30s" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Media Type | Content Format */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Format</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ugc">UGC</SelectItem>
                        <SelectItem value="founder_led">Founder Led</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="brand">Brand</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Creator */}
            <FormField
              control={form.control}
              name="creator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CREATORS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product | Agency */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Product
                      <span className="ml-1 text-gray font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <ProductCombobox
                        value={field.value}
                        onChange={field.onChange}
                        products={productItems}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Agency
                      <span className="ml-1 text-gray font-normal">(optional)</span>
                    </FormLabel>
                    <Select
                      value={field.value ?? 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign later" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No agency</SelectItem>
                        {agencies.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Drive URL */}
            <FormField
              control={form.control}
              name="driveUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Drive URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/file/d/…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={form.formState.isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Add Content'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
