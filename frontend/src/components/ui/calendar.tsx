"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3 bg-white rounded-md shadow-sm border border-slate-200", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        style={{
          // Override the default blue accent color with brand teal!
          ["--rdp-accent-color" as any]: "#0FA38E",
          ["--rdp-accent-text" as any]: "#ffffff",
        }}
        {...props}
      />
    </div>
  )
}

export { Calendar }
