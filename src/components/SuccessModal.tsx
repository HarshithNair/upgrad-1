'use client';
import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface SuccessModalProps {
  onClose: () => void;
}

export default function SuccessModal({ onClose }: SuccessModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Auto-close after 6 seconds
  useEffect(() => {
    const timer = setTimeout(handleClose, 6000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Trigger confetti burst on mount
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#E50913', '#FFFFFF', '#4CAF50', '#ff8f00'],
    });

    // Sub-burst for premium feel
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E50913', '#4CAF50'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E50913', '#4CAF50'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <AnimatePresence>
      <div 
        className="modal-overlay" 
        onClick={handleClose} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="success-title"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
        }}
      >
        <motion.div 
          className="modal-card" 
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '440px',
            width: '90%',
            textAlign: 'center',
          }}
        >
          {/* Animated Checkmark */}
          <div className="success-icon-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <svg
              width="72"
              height="72"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.circle
                cx="32"
                cy="32"
                r="30"
                stroke="#22c55e"
                strokeWidth="3.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <motion.path
                d="M20 33l8 8 16-16"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
              />
            </svg>
          </div>

          <h3 id="success-title" className="modal-title" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
            Registration Successful!
          </h3>

          <p className="modal-message" style={{ color: '#4b5563', fontSize: '0.975rem', lineHeight: 1.5, marginBottom: '2rem' }}>
            Your details have been recorded successfully.
          </p>

          <motion.button 
            className="btn-primary-ripple btn-primary" 
            onClick={handleClose}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--upgrad-red) 0%, var(--upgrad-red-dark) 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
