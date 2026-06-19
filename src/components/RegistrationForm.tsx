'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessModal from './SuccessModal';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,15}$/;

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters';
  }

  if (!data.email || !EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone || !PHONE_REGEX.test(data.phone.trim())) {
    errors.phone = 'Phone number must be 10-15 digits';
  }

  return errors;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
    };
    
    setRipples((prev) => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
        }),
      });

      const data = await res.json();
 
      if (res.status === 201) {
        setShowSuccess(true);
        setFormData({ full_name: '', email: '', phone: '' });
      } else if (res.status === 409) {
        const dupErrors: FormErrors = {};
        if (data.error?.toLowerCase().includes('email')) {
          dupErrors.email = 'This email is already registered';
        }
        if (data.error?.toLowerCase().includes('phone')) {
          dupErrors.phone = 'This phone number is already registered';
        }
        if (Object.keys(dupErrors).length === 0) {
          setSubmitError(data.error || 'This entry already exists');
        }
        setErrors(dupErrors);
      } else if (res.status === 400) {
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
        } else {
          setSubmitError(data.error || 'Validation failed. Please check your inputs.');
        }
      } else {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}
      >
        <motion.div
          className="form-card"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        >
          <div className="form-card-header">
            <h2 className="form-title" style={{ fontSize: '1.65rem', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              Book your Spot
            </h2>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence>
              {submitError && (
                <motion.div 
                  className="form-error-alert"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{submitError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full Name */}
            <div className="form-group form-group-relative">
              <input
                type="text"
                id="full_name"
                name="full_name"
                className={`form-input ${errors.full_name ? 'input-error' : ''}`}
                placeholder=" "
                value={formData.full_name}
                onChange={handleChange}
                onFocus={() => setFocusedField('full_name')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                autoComplete="name"
                style={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderColor: errors.full_name 
                    ? 'var(--error)' 
                    : focusedField === 'full_name'
                      ? 'var(--upgrad-red)'
                      : 'var(--gray-300)',
                  boxShadow: focusedField === 'full_name' 
                    ? '0 0 0 4px rgba(229, 9, 19, 0.12)' 
                    : 'none',
                }}
              />
              <motion.label
                htmlFor="full_name"
                className={`floating-label ${focusedField === 'full_name' ? 'active' : ''}`}
                initial={false}
                animate={{
                  y: focusedField === 'full_name' || formData.full_name ? -26 : 0,
                  scale: focusedField === 'full_name' || formData.full_name ? 0.85 : 1,
                  x: focusedField === 'full_name' || formData.full_name ? -4 : 0,
                }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Full Name
              </motion.label>
              {errors.full_name && <span className="error-text">{errors.full_name}</span>}
            </div>

            {/* Email */}
            <div className="form-group form-group-relative">
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                autoComplete="email"
                style={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderColor: errors.email 
                    ? 'var(--error)' 
                    : focusedField === 'email'
                      ? 'var(--upgrad-red)'
                      : 'var(--gray-300)',
                  boxShadow: focusedField === 'email' 
                    ? '0 0 0 4px rgba(229, 9, 19, 0.12)' 
                    : 'none',
                }}
              />
              <motion.label
                htmlFor="email"
                className={`floating-label ${focusedField === 'email' ? 'active' : ''}`}
                initial={false}
                animate={{
                  y: focusedField === 'email' || formData.email ? -26 : 0,
                  scale: focusedField === 'email' || formData.email ? 0.85 : 1,
                  x: focusedField === 'email' || formData.email ? -4 : 0,
                }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Email Address
              </motion.label>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div className="form-group form-group-relative">
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
                placeholder=" "
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                autoComplete="tel"
                style={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderColor: errors.phone 
                    ? 'var(--error)' 
                    : focusedField === 'phone'
                      ? 'var(--upgrad-red)'
                      : 'var(--gray-300)',
                  boxShadow: focusedField === 'phone' 
                    ? '0 0 0 4px rgba(229, 9, 19, 0.12)' 
                    : 'none',
                }}
              />
              <motion.label
                htmlFor="phone"
                className={`floating-label ${focusedField === 'phone' ? 'active' : ''}`}
                initial={false}
                animate={{
                  y: focusedField === 'phone' || formData.phone ? -26 : 0,
                  scale: focusedField === 'phone' || formData.phone ? 0.85 : 1,
                  x: focusedField === 'phone' || formData.phone ? -4 : 0,
                }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Phone Number
              </motion.label>
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>



            <motion.button
              type="submit"
              className="btn-primary-ripple btn-primary"
              disabled={isLoading}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(229, 9, 19, 0.35)' }}
              whileTap={{ scale: 0.98 }}
              onMouseDown={handleButtonClick}
              style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                marginTop: '1rem'
              }}
            >
              {ripples.map((ripple) => (
                <span
                  key={ripple.id}
                  className="ripple"
                  style={{
                    left: ripple.x - 10,
                    top: ripple.y - 10,
                    width: 20,
                    height: 20,
                  }}
                />
              ))}
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <motion.svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </motion.svg>
                  Processing...
                </div>
              ) : (
                'Enroll Now'
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </>
  );
}
