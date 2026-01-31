import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRows?: (ids: string[]) => void;
  getRowId?: (row: T) => string;
  emptyMessage?: string;
  className?: string;
}

function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onSort,
  sortBy,
  sortOrder = 'desc',
  selectable = false,
  selectedRows = [],
  onSelectRows,
  getRowId = (row) => String((row as Record<string, unknown>)._id || (row as Record<string, unknown>).id),
  emptyMessage = 'No data found',
  className = '',
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<{ key: string; order: 'asc' | 'desc' } | null>(null);

  const currentSort = sortBy ? { key: sortBy, order: sortOrder } : internalSort;

  const handleSort = (key: string) => {
    const newOrder = currentSort?.key === key && currentSort.order === 'asc' ? 'desc' : 'asc';
    
    if (onSort) {
      onSort(key, newOrder);
    } else {
      setInternalSort({ key, order: newOrder });
    }
  };

  const handleSelectAll = () => {
    if (!onSelectRows) return;
    
    if (selectedRows.length === data.length) {
      onSelectRows([]);
    } else {
      onSelectRows(data.map(getRowId));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectRows) return;
    
    if (selectedRows.includes(id)) {
      onSelectRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      onSelectRows([...selectedRows, id]);
    }
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  // Skeleton rows for loading state
  const SkeletonRow = () => (
    <tr className="border-b border-gray-700">
      {selectable && (
        <td className="px-4 py-3">
          <div className="h-4 w-4 bg-gray-700 rounded animate-pulse"></div>
        </td>
      )}
      {columns.map((col, idx) => (
        <td key={idx} className="px-4 py-3">
          <div className="h-4 bg-gray-700 rounded animate-pulse" style={{ width: '60%' }}></div>
        </td>
      ))}
    </tr>
  );

  return (
    <div className={`bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#2a2a2a] border-b border-gray-700">
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-white' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortable && currentSort?.key === col.key && (
                      currentSort.order === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} />)
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const isSelected = selectedRows.includes(rowId);
                
                return (
                  <tr
                    key={rowId}
                    className={`hover:bg-[#2a2a2a] transition-colors ${
                      isSelected ? 'bg-red-900/20' : ''
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                        {col.render 
                          ? col.render(row, rowIndex)
                          : String(row[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum: number;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      pagination.page === pageNum
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
