'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import StatsCards from './StatsCards';
import DataTable from './DataTable';
import ExportButtons from './ExportButtons';

interface Stats {
  total: number;
  today: number;
  topLocations: Array<{ location: string; count: number }>;
  recentSignups: Array<{ full_name: string; email: string; created_at: string; location: string }>;
}

function AnimatedChart({ data }: { data: Array<{ location: string; count: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <motion.div 
      className="dashboard-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.2 }}
      style={{ 
        background: 'var(--white)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '2rem', 
        boxShadow: 'var(--shadow-md)', 
        border: '1px solid var(--gray-200)',
        flex: 1
      }}
    >
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
        Registration Distribution
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {data.map((d, index) => {
          const percentage = (d.count / maxCount) * 100;
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '100px', 
                fontSize: '0.875rem', 
                color: 'var(--gray-700)', 
                fontWeight: 500, 
                textTransform: 'capitalize', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {d.location}
              </div>
              <div style={{ flex: 1, height: '14px', background: 'var(--gray-100)', borderRadius: '7px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.2, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(90deg, var(--upgrad-red) 0%, #ff5252 100%)', 
                    borderRadius: '7px' 
                  }}
                />
              </div>
              <div style={{ width: '32px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                {d.count}
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            No location data available.
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch stats');

      const data = await res.json();
      setStats(data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch stats on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div>
            <div className="skeleton-text skeleton-title" />
            <div className="skeleton-text skeleton-subtitle" />
          </div>
        </div>
        <div className="stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card stat-card-skeleton">
              <div className="skeleton-icon" />
              <div className="stat-card-content">
                <div className="skeleton-text skeleton-value" />
                <div className="skeleton-text skeleton-label" />
              </div>
            </div>
          ))}
        </div>
        <div className="dashboard-section">
          <div className="skeleton-table" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, color: '#ef4444' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => { setLoading(true); setError(''); fetchStats(); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor registrations and manage your data
          </p>
        </div>
        <motion.button
          className="btn-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loggingOut ? (
            <>
              <svg className="btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Logging out...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Two Columns for Location Distribution & Recent List */}
      {stats && stats.topLocations && stats.topLocations.length > 0 && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <AnimatedChart data={stats.topLocations} />
        </div>
      )}

      {/* Data Section */}
      <motion.div 
        className="dashboard-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="section-header">
          <h2 className="section-title">All Registrations</h2>
          <ExportButtons />
        </div>
        <DataTable />
      </motion.div>
    </div>
  );
}
