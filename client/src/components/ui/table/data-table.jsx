import { forwardRef, useState, useMemo, useEffect, useRef } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { cn } from '../../../lib/utils.js'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table.jsx'
import { Pagination } from '../pagination/pagination.jsx'

const getValue = (row, column) => {
  if (column.accessor) return column.accessor(row)
  return row[column.key]
}

const getAlign = (column) =>
  cn(
    column.align === 'center' && 'text-center',
    column.align === 'right' && 'text-right'
  )

const getItemsAlign = (column) =>
  cn(
    'items-start',
    column.align === 'center' && 'items-center',
    column.align === 'right' && 'items-end'
  )

const SelectAllCheckbox = ({ checked, indeterminate, onChange, ariaLabel }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="size-4 accent-primary"
    />
  )
}

const DataTable = forwardRef(
  (
    {
      columns,
      data = [],
      pageSize = 10,
      searchPlaceholder = 'Search...',
      emptyMessage = 'No results found.',
      showActions = false,
      actions,
      actionsHeader = 'Actions',
      selectable = false,
      selected,
      onSelectedChange,
      compact = false,
      className,
      ...props
    },
    ref
  ) => {
    const [sort, setSort] = useState(null)
    const [searches, setSearches] = useState({})
    const [page, setPage] = useState(1)
    const size = pageSize

    const selectedIds = useMemo(
      () => (selected instanceof Set ? selected : new Set(selected ?? [])),
      [selected]
    )

    const rowId = useMemo(() => {
      const map = new Map(data.map((row, index) => [row, row.id ?? index]))
      return (row) => map.get(row)
    }, [data])

    const handleSort = (key) => {
      setSort((prev) => {
        if (!prev || prev.key !== key) return { key, direction: 'asc' }
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        return null
      })
      setPage(1)
    }

    const handleSearch = (key, value) => {
      setSearches((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    }

    const filteredRows = useMemo(() => {
      let rows = data
      for (const column of columns) {
        if (!column.searchable) continue
        const query = String(searches[column.key] ?? '').trim().toLowerCase()
        if (!query) continue
        rows = rows.filter((row) =>
          String(getValue(row, column) ?? '')
            .toLowerCase()
            .includes(query)
        )
      }
      return rows
    }, [data, columns, searches])

    const sortedRows = useMemo(() => {
      if (!sort) return filteredRows
      const column = columns.find((c) => c.key === sort.key)
      if (!column) return filteredRows
      const direction = sort.direction === 'asc' ? 1 : -1
      return [...filteredRows].sort((a, b) => {
        const aValue = getValue(a, column)
        const bValue = getValue(b, column)
        if (column.sortFn) return column.sortFn(aValue, bValue) * direction
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * direction
        }
        return (
          String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, {
            numeric: true,
          }) * direction
        )
      })
    }, [filteredRows, sort, columns])

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / size))

    useEffect(() => {
      if (page > totalPages) setPage(totalPages)
    }, [page, totalPages])

    const visibleRows = useMemo(() => {
      const start = (page - 1) * size
      return sortedRows.slice(start, start + size)
    }, [sortedRows, page, size])

    const toggleRow = (id) => {
      if (!onSelectedChange) return
      const next = new Set(selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      onSelectedChange(next)
    }

    const filteredIds = useMemo(
      () => sortedRows.map((row) => rowId(row)),
      [sortedRows, rowId]
    )
    const selectedInView = filteredIds.filter((id) => selectedIds.has(id)).length
    const allChecked =
      filteredIds.length > 0 && selectedInView === filteredIds.length
    const someChecked = selectedInView > 0 && !allChecked

    const toggleAll = () => {
      if (!onSelectedChange) return
      const next = new Set(selectedIds)
      if (allChecked) filteredIds.forEach((id) => next.delete(id))
      else filteredIds.forEach((id) => next.add(id))
      onSelectedChange(next)
    }

    const columnCount = columns.length + (showActions ? 1 : 0) + (selectable ? 1 : 0)

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[48px]">
                  <SelectAllCheckbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={toggleAll}
                    ariaLabel="Select all rows"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(column.width, getAlign(column))}
                >
                  <div className={cn('flex flex-col gap-1.5', getItemsAlign(column))}>
                    <button
                      type="button"
                      disabled={!column.sortable}
                      onClick={() => handleSort(column.key)}
                      className={cn(
                        'inline-flex items-center gap-1 font-medium text-muted-foreground',
                        getAlign(column),
                        column.sortable
                          ? 'cursor-pointer select-none hover:text-foreground'
                          : 'cursor-default'
                      )}
                    >
                      {column.header}
                      {column.sortable &&
                        (sort?.key === column.key ? (
                          sort.direction === 'asc' ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-50" />
                        ))}
                    </button>

                    {column.searchable && (
                      <div className="relative w-full">
                        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={searches[column.key] ?? ''}
                          onChange={(e) =>
                            handleSearch(column.key, e.target.value)
                          }
                          placeholder={searchPlaceholder}
                          aria-label={`Search ${column.header}`}
                          className="h-8 w-full min-w-[120px] rounded-md border border-input bg-background pl-7 pr-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}

              {showActions && (
                <TableHead className="w-[80px] text-right">
                  <span className="inline-flex items-center justify-end font-medium text-muted-foreground">
                    {actionsHeader}
                  </span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const id = rowId(row)
                const isSelected = selectable && selectedIds.has(id)
                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      isSelected &&
                        'shadow-[inset_3px_0_0_0_var(--color-primary)]'
                    )}
                  >
                    {selectable && (
                      <TableCell className={cn(compact && 'py-1.5', 'w-[48px]')}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          aria-label={`Select ${row.name ?? 'row'}`}
                          className="size-4 accent-primary"
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = getValue(row, column)
                      return (
                        <TableCell
                          key={column.key}
                          className={cn(getAlign(column), compact && 'py-1.5')}
                        >
                          {column.render ? column.render(value, row) : value}
                        </TableCell>
                      )
                    })}
                    {showActions && (
                      <TableCell className="whitespace-nowrap text-right">
                        {actions ? actions(row) : null}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-end">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mx-0 w-auto"
          />
        </div>
      </div>
    )
  }
)
DataTable.displayName = 'DataTable'

export { DataTable }
