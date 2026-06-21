import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
  name:         z.string().min(1, 'Agency name is required').max(100),
  type:         z.enum(['creator', 'performance']),
  contactName:  z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().min(1, 'Contact email is required').email('Must be a valid email'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  status:       z.enum(['active', 'inactive']),
})

export type AgencyFormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface AgencyFormProps {
  mode: 'add' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<AgencyFormValues>
  onSave: (values: AgencyFormValues) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AgencyForm({ mode, open, onOpenChange, defaultValues, onSave }: AgencyFormProps) {
  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         '',
      type:         'performance',
      contactName:  '',
      contactEmail: '',
      contactPhone: '',
      status:       'active',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name:         '',
        type:         'performance',
        contactName:  '',
        contactEmail: '',
        contactPhone: '',
        status:       'active',
        ...defaultValues,
      })
    }
  }, [open, defaultValues, form])

  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">

        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Agency' : 'Add Agency'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the agency details below.'
              : 'Add a creator or performance marketing agency.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="px-6 py-4 space-y-4">

            {/* Agency Name — full width */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. DigiReach Media" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type | Status — 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="performance">Performance Marketing</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Name — full width */}
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Amit Singh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email | Phone — 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@agency.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+91 98765 43210" {...field} />
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
            {isEdit ? 'Save Changes' : 'Add Agency'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
