import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:        z.string().min(1, 'Campaign name is required').max(120),
  objective:   z.enum(['conversions', 'traffic', 'awareness', 'lead_generation', 'engagement', 'video_views', 'app_installs']),
  platform:    z.enum(['meta', 'google']),
  budgetType:  z.enum(['daily', 'lifetime']),
  budget:      z.coerce.number({ invalid_type_error: 'Must be a number' }).positive('Budget must be positive'),
  agency:      z.string().nullable(),
  adAccountId: z.string().min(1, 'Ad Account ID is required'),
  startDate:   z.string().min(1, 'Start date is required'),
  endDate:     z.string().nullable(),
})

export type CampaignFormValues = z.infer<typeof schema>

// ── Types ─────────────────────────────────────────────────────────────────────

interface CampaignFormProps {
  mode:          'add' | 'edit'
  open:          boolean
  onOpenChange:  (open: boolean) => void
  defaultValues?: Partial<CampaignFormValues>
  onSave:        (values: CampaignFormValues) => void
  agencies:      string[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CampaignForm({ mode, open, onOpenChange, defaultValues, onSave, agencies }: CampaignFormProps) {
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        '',
      objective:   'conversions',
      platform:    'meta',
      budgetType:  'daily',
      budget:      10000,
      agency:      null,
      adAccountId: '',
      startDate:   '',
      endDate:     null,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name:        '',
        objective:   'conversions',
        platform:    'meta',
        budgetType:  'daily',
        budget:      10000,
        agency:      null,
        adAccountId: '',
        startDate:   '',
        endDate:     null,
        ...defaultValues,
      })
    }
  }, [open, defaultValues, form])

  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">

        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the campaign details below.'
              : 'Configure your Meta Ads campaign settings.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="px-6 py-4 space-y-4">

            {/* Campaign Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ashwagandha Gold – Q3 Conversions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Objective | Platform */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objective</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="conversions">Conversions</SelectItem>
                        <SelectItem value="traffic">Traffic</SelectItem>
                        <SelectItem value="awareness">Awareness</SelectItem>
                        <SelectItem value="lead_generation">Lead Generation</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="video_views">Video Views</SelectItem>
                        <SelectItem value="app_installs">App Installs</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="meta">Meta</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget Type | Budget Amount */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budgetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily Budget</SelectItem>
                        <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Agency | Ad Account */}
            <div className="grid grid-cols-2 gap-4">
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
                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
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

              <FormField
                control={form.control}
                name="adAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Account ID</FormLabel>
                    <FormControl>
                      <Input placeholder="act_XXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Start Date | End Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      End Date
                      <span className="ml-1 text-gray font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSave)}
            disabled={form.formState.isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
