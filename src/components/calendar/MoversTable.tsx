import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { Badge, Button, Card, cn } from '@/components/ui'
import {
  formatBps,
  formatEps,
  formatMoney,
  formatPct,
} from '@/lib/analytics/units'
import type { Company } from '@/lib/types'

export type MoversMode = 'winners' | 'losers' | 'quality' | 'all'

export interface MoversTableProps {
  mode: MoversMode
  companies: Company[]
}

type PageSize = 50 | 200 | 'all'

const PAGE_OPTIONS: { key: PageSize; label: string }[] = [
  { key: 50, label: 'Show 50' },
  { key: 200, label: 'Show 200' },
  { key: 'all', label: 'Show all' },
]

const MONTH_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

function formatIsoShort(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return MONTH_FMT.format(d)
}

function signedToneClass(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) {
    return 'text-[color:var(--text-secondary)]'
  }
  if (n > 0) return 'text-emerald-400'
  if (n < 0) return 'text-red-400'
  return 'text-[color:var(--text-secondary)]'
}

function defaultSortingFor(mode: MoversMode): SortingState {
  switch (mode) {
    case 'winners':
      return [{ id: 'qualityScore', desc: true }]
    case 'losers':
      return [{ id: 'epsBeat', desc: false }]
    case 'quality':
      return [{ id: 'qualityScore', desc: true }]
    case 'all':
    default:
      return [{ id: 'date', desc: false }]
  }
}

const SEVERITY_DOT: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-amber-400',
  medium: 'bg-orange-400',
  high: 'bg-red-500',
}

const SEVERITY_TONE: Record<'low' | 'medium' | 'high', 'warn' | 'bear' | 'mute'> = {
  low: 'mute',
  medium: 'warn',
  high: 'bear',
}

const colHelper = createColumnHelper<Company>()

export function MoversTable({ mode, companies }: MoversTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>(() => defaultSortingFor(mode))
  const [pageSize, setPageSize] = useState<PageSize>(50)

  const columns = useMemo(
    () => [
      colHelper.accessor('ticker', {
        id: 'ticker',
        header: 'Ticker',
        enableSorting: true,
        cell: (info) => {
          const t = info.getValue()
          return (
            <Link
              to={`/c/${t}`}
              onClick={(e) => e.stopPropagation()}
              className="mono text-sm font-bold text-[color:var(--text-primary)] hover:text-indigo-300"
            >
              {t}
            </Link>
          )
        },
      }),
      colHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        enableSorting: false,
        cell: (info) => (
          <span
            className="hidden md:inline-block max-w-[18ch] truncate align-middle text-xs text-[color:var(--text-secondary)]"
            title={info.getValue()}
          >
            {info.getValue()}
          </span>
        ),
      }),
      colHelper.accessor((c) => (c.isoDate ? new Date(c.isoDate).getTime() : 0), {
        id: 'date',
        header: 'Date',
        enableSorting: true,
        cell: (info) => (
          <span className="num text-xs text-[color:var(--text-secondary)]">
            {formatIsoShort(info.row.original.isoDate)}
          </span>
        ),
      }),
      colHelper.accessor('fiscalQuarter', {
        id: 'quarter',
        header: 'Qtr',
        enableSorting: false,
        cell: (info) => (
          <span className="hidden md:inline-flex">
            <Badge tone="neutral" size="xs">
              {info.getValue()}
            </Badge>
          </span>
        ),
      }),
      colHelper.accessor((c) => c.eps.actual, {
        id: 'epsActual',
        header: 'EPS',
        enableSorting: false,
        cell: (info) => (
          <span className="num text-sm text-[color:var(--text-primary)]">
            {formatEps(info.getValue() as number | null)}
          </span>
        ),
      }),
      colHelper.accessor((c) => c.epsDerived.beat ?? -Infinity, {
        id: 'epsBeat',
        header: 'EPS Beat',
        enableSorting: true,
        sortUndefined: 'last',
        cell: (info) => {
          const v = info.row.original.epsDerived.beat
          return <span className={cn('num text-sm font-medium', signedToneClass(v))}>{formatPct(v)}</span>
        },
      }),
      colHelper.accessor((c) => c.epsDerived.yoy ?? -Infinity, {
        id: 'epsYoy',
        header: 'EPS YoY',
        enableSorting: true,
        cell: (info) => {
          const v = info.row.original.epsDerived.yoy
          return <span className={cn('num text-sm', signedToneClass(v))}>{formatPct(v)}</span>
        },
      }),
      colHelper.accessor((c) => c.revenue.actual ?? -Infinity, {
        id: 'revActual',
        header: 'Revenue',
        enableSorting: false,
        cell: (info) => (
          <span className="num text-sm text-[color:var(--text-primary)]">
            {formatMoney(info.row.original.revenue.actual)}
          </span>
        ),
      }),
      colHelper.accessor((c) => c.revenueDerived.beat ?? -Infinity, {
        id: 'revenueBeat',
        header: 'Rev Beat',
        enableSorting: true,
        cell: (info) => {
          const v = info.row.original.revenueDerived.beat
          return (
            <span className={cn('hidden md:inline-block num text-sm font-medium', signedToneClass(v))}>
              {formatPct(v)}
            </span>
          )
        },
      }),
      colHelper.accessor((c) => c.revenueDerived.yoy ?? -Infinity, {
        id: 'revenueYoy',
        header: 'Rev YoY',
        enableSorting: true,
        cell: (info) => {
          const v = info.row.original.revenueDerived.yoy
          return <span className={cn('num text-sm', signedToneClass(v))}>{formatPct(v)}</span>
        },
      }),
      colHelper.accessor((c) => c.marginProxyChangeBps ?? -Infinity, {
        id: 'marginChange',
        header: 'Margin Δ',
        enableSorting: true,
        cell: (info) => {
          const v = info.row.original.marginProxyChangeBps
          return (
            <span className={cn('hidden md:inline-block num text-xs', signedToneClass(v))}>
              {formatBps(v)}
            </span>
          )
        },
      }),
      colHelper.accessor((c) => c.marketCap ?? -Infinity, {
        id: 'marketCap',
        header: 'Mkt Cap',
        enableSorting: true,
        cell: (info) => (
          <span className="hidden md:inline-block num text-xs text-[color:var(--text-secondary)]">
            {formatMoney(info.row.original.marketCap)}
          </span>
        ),
      }),
      colHelper.accessor('qualityScore', {
        id: 'qualityScore',
        header: 'Quality',
        enableSorting: true,
        cell: (info) => {
          const score = info.getValue()
          const pct = Math.max(0, Math.min(100, score))
          return (
            <div className="flex items-center gap-2">
              <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-[var(--bg-surface-2)]">
                <div
                  className="quality-bar absolute inset-y-0 left-0"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="num text-xs font-semibold tabular-nums text-[color:var(--text-primary)]">
                {Math.round(score)}
              </span>
            </div>
          )
        },
      }),
      colHelper.accessor((c) => c.flags.length, {
        id: 'flags',
        header: 'Flags',
        enableSorting: false,
        cell: (info) => {
          const company = info.row.original
          const count = company.flags.length
          if (count === 0) {
            return <span className="text-xs text-[color:var(--text-muted)]">—</span>
          }
          const sev = company.topSeverity ?? 'low'
          const tone = SEVERITY_TONE[sev]
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={cn('inline-block h-2 w-2 rounded-full', SEVERITY_DOT[sev])}
                aria-hidden
              />
              <Badge tone={tone} size="xs">
                {count}
              </Badge>
            </div>
          )
        },
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: companies,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const sortedRows = table.getRowModel().rows
  const visibleRows =
    pageSize === 'all' ? sortedRows : sortedRows.slice(0, pageSize)

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const canSort = h.column.getCanSort()
                  const sortDir = h.column.getIsSorted()
                  return (
                    <th
                      key={h.id}
                      className={cn(
                        'sticky top-0 z-10 bg-[var(--bg-surface)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)] border-b border-[color:var(--border-soft)] whitespace-nowrap',
                        canSort && 'cursor-pointer select-none hover:text-[color:var(--text-primary)]',
                        h.column.id === 'quarter' && 'hidden md:table-cell',
                        h.column.id === 'name' && 'hidden md:table-cell',
                        h.column.id === 'revenueBeat' && 'hidden md:table-cell',
                        h.column.id === 'marginChange' && 'hidden md:table-cell',
                        h.column.id === 'marketCap' && 'hidden md:table-cell',
                      )}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {canSort ? (
                          <span
                            className={cn(
                              'text-[9px]',
                              sortDir ? 'text-indigo-300' : 'text-[color:var(--text-muted)] opacity-40',
                            )}
                          >
                            {sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '↕'}
                          </span>
                        ) : null}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/c/${row.original.ticker}`)}
                className="group cursor-pointer transition-colors hover:bg-[var(--bg-surface-2)]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'px-3 py-2 border-b border-[color:var(--border-soft)] align-middle whitespace-nowrap',
                      cell.column.id === 'quarter' && 'hidden md:table-cell',
                      cell.column.id === 'name' && 'hidden md:table-cell',
                      cell.column.id === 'revenueBeat' && 'hidden md:table-cell',
                      cell.column.id === 'marginChange' && 'hidden md:table-cell',
                      cell.column.id === 'marketCap' && 'hidden md:table-cell',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border-soft)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="text-xs text-[color:var(--text-muted)]">
          <span className="num font-semibold text-[color:var(--text-primary)]">{visibleRows.length}</span>
          <span className="mx-1">/</span>
          <span className="num">{sortedRows.length}</span>
          <span className="ml-1">rows</span>
          <span className="ml-3 text-[10px] uppercase tracking-wider">{mode}</span>
        </div>
        <div className="flex items-center gap-1">
          {PAGE_OPTIONS.map((p) => (
            <Button
              key={String(p.key)}
              size="sm"
              variant={pageSize === p.key ? 'primary' : 'ghost'}
              onClick={() => setPageSize(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default MoversTable
