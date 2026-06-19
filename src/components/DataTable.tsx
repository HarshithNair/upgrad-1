'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Registration {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  created_at: string;
}

const PAGE_SIZE = 10;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function DataTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [locations, setLocations] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (locationFilter) params.set('location', locationFilter);

      const res = await fetch(`/api/registrations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setRegistrations(data.registrations || []);
      setTotal(data.total || 0);

      // Accumulate unique locations for the filter dropdown
      if (data.registrations) {
        setLocations((prev) => {
          const newSet = new Set(prev);
          data.registrations.forEach((r: Registration) => {
            if (r.location) newSet.add(r.location);
          });
          return Array.from(newSet).sort();
        });
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setRegistrations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, locationFilter, sortBy, sortOrder]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Also fetch all locations on mount for the filter dropdown
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/registrations?limit=1000&page=1');
        if (res.ok) {
          const data = await res.json();
          if (data.registrations) {
            const locs = new Set<string>();
            data.registrations.forEach((r: Registration) => {
              if (r.location) locs.add(r.location);
            });
            setLocations(Array.from(locs).sort());
          }
        }
      } catch {
        // Silently fail — locations will populate from regular fetches
      }
    }
    fetchLocations();
  }, []);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  }

  function renderSortArrow(column: string) {
    if (sortBy !== column) {
      return (
        <span className="sort-arrow sort-arrow-inactive">⇅</span>
      );
    }
    return (
      <span className="sort-arrow sort-arrow-active">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="data-table-container">
      {/* Controls */}
      <div className="table-controls">
        <div className="table-search-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="table-search"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <select
          className="table-filter"
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="table-th" style={{ width: '50px' }}>#</th>
              <th className="table-th sortable" onClick={() => handleSort('full_name')}>
                Full Name {renderSortArrow('full_name')}
              </th>
              <th className="table-th sortable" onClick={() => handleSort('email')}>
                Email {renderSortArrow('email')}
              </th>
              <th className="table-th">Phone</th>
              <th className="table-th sortable" onClick={() => handleSort('location')}>
                Location {renderSortArrow('location')}
              </th>
              <th className="table-th sortable" onClick={() => handleSort('created_at')}>
                Registered On {renderSortArrow('created_at')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="table-row">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={`skeleton-cell-${i}-${j}`} className="table-td">
                      <div className="skeleton-cell" />
                    </td>
                  ))}
                </tr>
              ))
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <p>No registrations found</p>
                    {(debouncedSearch || locationFilter) && (
                      <button
                        className="btn-text"
                        onClick={() => {
                          setSearch('');
                          setLocationFilter('');
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              registrations.map((reg, index) => (
                <tr key={reg.id} className="table-row">
                  <td className="table-td table-td-num">{startRow + index}</td>
                  <td className="table-td table-td-name">{reg.full_name}</td>
                  <td className="table-td table-td-email">{reg.email}</td>
                  <td className="table-td">{reg.phone}</td>
                  <td className="table-td">
                    <span className="location-badge">{reg.location}</span>
                  </td>
                  <td className="table-td table-td-date">{formatDate(reg.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: Row count + Pagination */}
      {!loading && total > 0 && (
        <div className="table-footer">
          <div className="table-row-count">
            Showing {startRow}–{endRow} of {total.toLocaleString()} registrations
          </div>
          <div className="table-pagination">
            <button
              className="pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              title="First page"
            >
              ««
            </button>
            <button
              className="pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Previous page"
            >
              «
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Next page"
            >
              »
            </button>
            <button
              className="pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
