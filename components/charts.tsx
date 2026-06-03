'use client'

import type React from 'react'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ChartDatum = {
  label: string
  value: number
  color?: string
}

/* -------------------------------------------------------------------------- */
/*  DonutChart                                                                */
/* -------------------------------------------------------------------------- */

const DONUT_STROKE = 28
const DONUT_RADIUS = 60
const DONUT_CX = 80
const DONUT_CY = 80
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

/**
 * DonutChart — dependency-free SVG donut with a center total and a legend.
 * Accessible via role="img" + aria-label.
 */
export function DonutChart({
  data,
  label = 'Total',
  size = 160,
}: {
  data: ChartDatum[]
  /** Label shown beneath the center total. Defaults to "Total". */
  label?: string
  /** Rendered width/height of the SVG in px. Defaults to 160. */
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)

  // Build segments
  type Segment = ChartDatum & { offset: number; dash: number; isEmpty: boolean }
  const segments: Segment[] = []
  let cumulative = 0

  if (total === 0) {
    // Render a single grey ring when there's no data
    segments.push({
      label: 'No data',
      value: 1,
      color: '#d4d4d8',
      offset: 0,
      dash: DONUT_CIRCUMFERENCE,
      isEmpty: true,
    })
  } else {
    for (const d of data) {
      const fraction = d.value / total
      const dash = fraction * DONUT_CIRCUMFERENCE
      const offset = DONUT_CIRCUMFERENCE - cumulative * DONUT_CIRCUMFERENCE
      segments.push({ ...d, offset, dash, isEmpty: false })
      cumulative += fraction
    }
  }

  const ariaLabel = data.map((d) => `${d.label}: ${d.value}`).join(', ')

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* SVG donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          role="img"
          aria-label={`Donut chart — ${ariaLabel}`}
        >
          {/* Track ring */}
          <circle
            cx={DONUT_CX}
            cy={DONUT_CY}
            r={DONUT_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={DONUT_STROKE}
            className="text-zinc-100 dark:text-zinc-800"
          />
          {/* Data segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={DONUT_CX}
              cy={DONUT_CY}
              r={DONUT_RADIUS}
              fill="none"
              stroke={seg.color ?? '#a1a1aa'}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${seg.dash} ${DONUT_CIRCUMFERENCE - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          ))}
          {/* Center label */}
          <text
            x={DONUT_CX}
            y={DONUT_CY - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="700"
            fill="currentColor"
            className="text-foreground"
          >
            {total}
          </text>
          <text
            x={DONUT_CX}
            y={DONUT_CY + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="currentColor"
            className="text-muted-foreground"
          >
            {label}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <ul className="flex flex-col gap-2 pt-1 text-sm" aria-hidden>
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color ?? '#a1a1aa' }}
            />
            <span className="text-muted-foreground">
              {d.label}
              <span className="ml-1.5 font-semibold text-foreground">{d.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  BarChart                                                                  */
/* -------------------------------------------------------------------------- */

const BAR_VIEWBOX_W = 320
const BAR_AXIS_HEIGHT = 20
const BAR_TOP_PAD = 24 // room for value labels
const BAR_GAP = 8
const BAR_MIN_BAR_WIDTH = 24

/**
 * BarChart — dependency-free SVG vertical bar chart.
 * Responsive via viewBox. Accessible via role="img" + aria-label.
 */
export function BarChart({
  data,
  height = 200,
}: {
  data: ChartDatum[]
  /** CSS height of the SVG. Defaults to 200. */
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const chartH = height - BAR_AXIS_HEIGHT - BAR_TOP_PAD
  const totalGaps = (data.length - 1) * BAR_GAP
  const barW = Math.max(
    BAR_MIN_BAR_WIDTH,
    (BAR_VIEWBOX_W - totalGaps) / Math.max(data.length, 1)
  )
  const totalW = data.length * barW + (data.length - 1) * BAR_GAP

  const ariaLabel = data.map((d) => `${d.label}: ${d.value}`).join(', ')

  return (
    <svg
      viewBox={`0 0 ${BAR_VIEWBOX_W} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`Bar chart — ${ariaLabel}`}
      style={{ overflow: 'visible' }}
    >
      {/* Baseline */}
      <line
        x1={0}
        y1={BAR_TOP_PAD + chartH}
        x2={BAR_VIEWBOX_W}
        y2={BAR_TOP_PAD + chartH}
        stroke="currentColor"
        strokeWidth={1}
        className="text-zinc-200 dark:text-zinc-700"
      />

      {/* Bars */}
      {data.map((d, i) => {
        const barH = max === 0 ? 0 : (d.value / max) * chartH
        const x = i * (barW + BAR_GAP) + (BAR_VIEWBOX_W - totalW) / 2
        const y = BAR_TOP_PAD + chartH - barH

        return (
          <g key={d.label}>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 2)}
              rx={4}
              fill={d.color ?? '#a1a1aa'}
              style={{ transition: 'height 0.4s ease, y 0.4s ease' }}
            />
            {/* Value label above bar */}
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="currentColor"
              className="text-foreground"
            >
              {d.value}
            </text>
            {/* X-axis label */}
            <text
              x={x + barW / 2}
              y={BAR_TOP_PAD + chartH + 14}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              className="text-muted-foreground"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  MiniProgressBar (optional utility)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Thin horizontal progress bar — useful inside stat cards.
 */
export function MiniProgressBar({
  value,
  max,
  color = '#dc2626',
  className,
}: {
  value: number
  max: number
  color?: string
  className?: string
}) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100)
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ${className ?? ''}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}
