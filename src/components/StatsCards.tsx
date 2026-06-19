'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StatsProps {
  stats: {
    total: number;
    today: number;
    topLocations: Array<{ location: string; count: number }>;
    recentSignups: Array<{ full_name: string; email: string; created_at: string }>;
  };
}

function CountUp({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1000; // 1 second animation
    const startVal = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Ease out quad
      const easePercentage = percentage * (2 - percentage);
      const currentVal = Math.floor(startVal + (value - startVal) * easePercentage);
      
      setDisplayValue(currentVal);

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
}

export default function StatsCards({ stats }: StatsProps) {
  const topLocation = stats.topLocations?.[0];

  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 180,
        damping: 18,
      },
    },
  };

  return (
    <motion.div 
      className="stats-grid"
      variants={gridVariants}
      initial="hidden"
      animate="show"
    >
      {/* Total Registrations */}
      <motion.div className="stat-card" variants={cardVariants}>
        <div className="stat-card-icon stat-icon-red">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="stat-card-content">
          <div className="stat-card-value">
            <CountUp value={stats.total} />
          </div>
          <div className="stat-card-label">Total Registrations</div>
        </div>
      </motion.div>

      {/* Today's Registrations */}
      <motion.div className="stat-card" variants={cardVariants}>
        <div className="stat-card-icon stat-icon-green">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </div>
        <div className="stat-card-content">
          <div className="stat-card-value">
            <CountUp value={stats.today} />
          </div>
          <div className="stat-card-label">Today&apos;s Registrations</div>
        </div>
      </motion.div>

      {/* Top Location */}
      <motion.div className="stat-card" variants={cardVariants}>
        <div className="stat-card-icon stat-icon-blue">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="stat-card-content">
          <div className="stat-card-value" style={{ textTransform: 'capitalize' }}>
            {topLocation?.location || 'N/A'}
          </div>
          <div className="stat-card-label">
            Top Location{topLocation ? ` · ${topLocation.count} registrations` : ''}
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div className="stat-card" variants={cardVariants}>
        <div className="stat-card-icon stat-icon-orange">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="stat-card-content">
          <div className="stat-card-value">
            <CountUp value={stats.recentSignups?.length ?? 0} />
          </div>
          <div className="stat-card-label">Recent Activity · in last 24h</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
