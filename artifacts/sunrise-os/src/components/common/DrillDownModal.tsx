import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

export interface DrillDownColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  sortable?: boolean;
}

interface DrillDownModalProps {
  title: string;
  subtitle?: string;
  badge?: { label: string; color: string };
  rows: Record<string, unknown>[];
  columns: DrillDownColumn[];
  onClose: () => void;
  onNavigate?: () => void;
  navigateLabel?: string;
  /** Optional note shown at bottom */
  footnote?: string;
}

export function DrillDownModal({
  title, subtitle, badge, rows, columns, onClose, onNavigate, navigateLabel, footnote,
}: DrillDownModalProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-navy">{title}</h2>
              {badge && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-slate mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {onNavigate && (
              <button
                onClick={onNavigate}
                className="flex items-center gap-1.5 text-xs font-semibold text-sunrise-blue hover:underline"
              >
                {navigateLabel ?? 'View Full Page'}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate hover:text-navy transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate text-sm">
              No records match this filter.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-border z-10">
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={`text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate whitespace-nowrap ${col.sortable !== false ? 'cursor-pointer hover:text-navy select-none' : ''}`}
                      style={col.width ? { width: col.width } : undefined}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.sortable !== false && sortKey === col.key && (
                          sortDir === 'asc'
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-2.5 text-slate align-top">
                        {col.render
                          ? col.render(row[col.key], row)
                          : <span className="text-navy">{String(row[col.key] ?? '—')}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {(footnote || rows.length > 0) && (
          <div className="px-6 py-3 border-t border-border bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate">{footnote ?? `${rows.length} record${rows.length !== 1 ? 's' : ''} · Demo data only`}</span>
            <button onClick={onClose} className="text-xs text-slate hover:text-navy font-medium">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
