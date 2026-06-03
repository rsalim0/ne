"use client";

import * as React from "react";
import type { Matcher } from "react-day-picker";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** `YYYY-MM-DD` <-> Date helpers (local time, no TZ drift). */
function toISO(d?: Date): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromISO(s?: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface DatePickerProps {
  /** Controlled value as `YYYY-MM-DD`. */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Disable selecting any day before today (future-only fields). */
  disablePast?: boolean;
  /** Disable selecting any day after today (e.g. dates of past events). */
  disableFuture?: boolean;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disablePast = false,
  disableFuture = false,
  id,
  disabled,
  invalid,
  className,
}: DatePickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const selected = fromISO(value);

  const matchers: Matcher[] = [];
  if (disablePast) matchers.push({ before: startOfToday() });
  if (disableFuture) matchers.push({ after: startOfToday() });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className={cn(
              "w-full justify-between font-normal aria-invalid:border-destructive/50",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        {selected
          ? selected.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : placeholder}
        <CalendarBlank className="opacity-80" />
      </PopoverTrigger>
      <PopoverPopup align="start" className="p-0">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 5, 0)}
          endMonth={new Date(new Date().getFullYear() + 15, 11)}
          disabled={matchers.length ? matchers : undefined}
          autoFocus
          onSelect={(d?: Date) => {
            onChange(toISO(d));
            setOpen(false);
          }}
        />
      </PopoverPopup>
    </Popover>
  );
}
