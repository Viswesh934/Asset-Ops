import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface ProgressStep {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  dateTime?: string
  status?: string
  userName?: string
}

interface ProgressBarProps {
  steps: ProgressStep[]
  finalStatuses?: string[]
}

function getStepPercent(idx: number): number {
  if (idx === 0) return 0
  return idx * 20
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ steps }) => {
  const dotSize = 18
  const iconSize = 24
  const barSideGap = iconSize * 1.6

  const PAGE_SIZE = 6
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(steps.length / PAGE_SIZE)
  const startIdx = page * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, steps.length)
  const visibleSteps = steps.slice(startIdx, endIdx)
  const isSingle = visibleSteps.length === 1
  const barWidth = `calc(100% - ${barSideGap * 2}px)`

  return (
    <Card className="mb-4 gap-0 rounded-xl border border-border py-0 shadow-none">
      <CardContent className="px-8 py-4">
        <div className="w-full px-1">
          {steps.length > PAGE_SIZE && totalPages > 1 && (
            <div className="mb-1 flex justify-end">
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-default"
                  aria-label="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-default"
                  aria-label="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
          {/* ── Track + dots ── */}
          <div
            className="relative mx-auto"
            style={{
              height: dotSize,
              width: barWidth,
              marginLeft: barSideGap,
              marginRight: barSideGap,
            }}
          >
            {/* Connecting track line */}
            {!isSingle && (
              <div
                className="absolute bg-brand-orange/20"
                style={{
                  top: "50%",
                  left: `${getStepPercent(0)}%`,
                  width: `calc(${getStepPercent(visibleSteps.length - 1) - getStepPercent(0)}%)`,
                  height: 2,
                  borderRadius: 6,
                  transform: "translateY(-50%)",
                  zIndex: 1,
                }}
              />
            )}
            {/* Filled track overlay */}
            {!isSingle && (
              <div
                className="absolute bg-brand-orange"
                style={{
                  top: "50%",
                  left: `${getStepPercent(0)}%`,
                  width: `calc(${getStepPercent(visibleSteps.length - 1) - getStepPercent(0)}%)`,
                  height: 2,
                  borderRadius: 6,
                  transform: "translateY(-50%)",
                  zIndex: 2,
                }}
              />
            )}
            {/* Step dots */}
            {visibleSteps.map((_, idx) => {
              const percent = getStepPercent(idx)
              return (
                <div
                  key={startIdx + idx}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: `${percent}%`,
                    transform: "translateX(-50%) translateY(-50%)",
                    zIndex: 3,
                    width: dotSize,
                    height: dotSize,
                  }}
                >
                  <div
                    className="flex h-full w-full items-center justify-center rounded-full bg-brand-orange text-white shadow-sm transition-transform duration-200 hover:scale-110"
                    style={{
                      boxShadow: "0 0 0 3px rgba(230, 74, 36, 0.15)",
                    }}
                  >
                    <ChevronRight size={10} strokeWidth={4} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Step labels ── */}
          <div
            className="relative w-full"
            style={{
              width: barWidth,
              marginLeft: barSideGap,
              marginRight: barSideGap,
              marginTop: 12,
              minHeight: 48,
            }}
          >
            {visibleSteps.map((step, idx) => {
              const percent = getStepPercent(idx)
              return (
                <div
                  key={startIdx + idx}
                  className="absolute flex flex-col items-center"
                  style={{
                    top: 0,
                    left: `${percent}%`,
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    minWidth: 56,
                    maxWidth: 150,
                    textAlign: "center",
                  }}
                >
                  {/* Status label — primary */}
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap leading-none">
                    {step.label}
                  </span>
                  {/* User name & date/time — shared metadata typography */}
                  {step.userName && (
                    <span
                      className="mt-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap leading-none"
                      style={{ maxWidth: 140 }}
                    >
                      {step.userName}
                    </span>
                  )}
                  {step.dateTime && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground/85 whitespace-nowrap leading-none ${step.userName ? "mt-0.5" : "mt-1.5"}`}
                    >
                      {step.dateTime}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
