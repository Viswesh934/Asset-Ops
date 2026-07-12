import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  label: string
  value: string
}

interface MultiSelectComboboxProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelectCombobox({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean)

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-left outline-none transition-colors",
          "hover:border-white/[0.16] focus:border-orange-500/40",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-wrap gap-1.5 min-h-[20px]">
          {selectedLabels.length === 0 ? (
            <span className="text-slate-500">{placeholder}</span>
          ) : (
            selectedLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/15 text-orange-400 text-xs font-medium rounded-md border border-orange-500/20"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    const opt = options.find((o) => o.label === label)
                    if (opt) removeOption(opt.value, e)
                  }}
                  className="hover:text-orange-300"
                >
                  <X size={11} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronsUpDown size={14} className="text-slate-500 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#12141f] shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-white/[0.06]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-500/30"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-500 text-center">No results found.</p>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2.5 py-2 text-sm rounded-md transition-colors text-left",
                      isSelected
                        ? "bg-orange-500/10 text-orange-400"
                        : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors",
                        isSelected
                          ? "bg-orange-500 border-orange-500"
                          : "border-white/[0.16] bg-transparent"
                      )}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    {opt.label}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="p-2 border-t border-white/[0.06] flex justify-between items-center">
              <span className="text-xs text-slate-500">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
