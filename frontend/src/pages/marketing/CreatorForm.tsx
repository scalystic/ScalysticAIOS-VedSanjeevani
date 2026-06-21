import { useEffect } from 'react'
import { useForm }   from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }         from 'zod'

import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:         z.string().min(1, 'Name is required').max(80),
  type:         z.enum(['influencer', 'ugc_creator', 'in_house']),
  handle:       z.string().nullable(),
  platform:     z.string().nullable(),
  contactEmail: z.string().email('Valid email required'),
  contactPhone: z.string().min(1, 'Phone is required'),
  ratePerVideo: z.coerce.number().min(0),
  ratePerImage: z.coerce.number().min(0),
  status:       z.enum(['active', 'inactive']),
})

export type CreatorFormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreatorFormProps {
  mode:           'add' | 'edit'
  open:           boolean
  onOpenChange:   (open: boolean) => void
  defaultValues?: Partial<CreatorFormValues>
  onSave:         (values: CreatorFormValues) => void
}

const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Twitter', 'Other']

// ── Component ─────────────────────────────────────────────────────────────────

export function CreatorForm({ mode, open, onOpenChange, defaultValues, onSave }: CreatorFormProps) {
  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         '',
      type:         'ugc_creator',
      handle:       null,
      platform:     null,
      contactEmail: '',
      contactPhone: '',
      ratePerVideo: 0,
      ratePerImage: 0,
      status:       'active',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name:         '',
        type:         'ugc_creator',
        handle:       null,
        platform:     null,
        contactEmail: '',
        contactPhone: '',
        ratePerVideo: 0,
        ratePerImage: 0,
        status:       'active',
        ...defaultValues,
      })
    }
  }, [open, defaultValues, form])

  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">

        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Creator' : 'Add Creator'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update creator details.' : 'Add a new creator or in-house team member.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="px-6 py-4 space-y-4">

            {/* Name — full width */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Priya Sharma" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Type | Platform — 2 cols */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="influencer">Influencer</SelectItem>
                      <SelectItem value="ugc_creator">UGC Creator</SelectItem>
                      <SelectItem value="in_house">In-house</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Platform <span className="ml-1 text-gray font-normal">(optional)</span>
                  </FormLabel>
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={v => field.onChange(v === 'none' ? null : v)}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Handle | Status — 2 cols */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="handle" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Handle <span className="ml-1 text-gray font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="@username"
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Contact email | phone — 2 cols */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="creator@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contactPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98765 XXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Rates — 2 cols */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="ratePerVideo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Video (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="25000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="ratePerImage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Image (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="12000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={form.handleSubmit(onSave)} disabled={form.formState.isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Creator'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
