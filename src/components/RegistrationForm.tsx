'use client';
import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessModal from './SuccessModal';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  ready_to_relocate: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  ready_to_relocate?: string;
  resume?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,15}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

function validateForm(data: FormData, resumeFile: File | null): FormErrors {
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

  if (!data.location || data.location.trim().length < 2) {
    errors.location = 'Please enter your location';
  }

  if (!data.ready_to_relocate) {
    errors.ready_to_relocate = 'Please select Yes or No';
  }

  if (resumeFile) {
    if (resumeFile.size > MAX_FILE_SIZE) {
      errors.resume = 'File must be under 5MB';
    }
    const ext = '.' + resumeFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      errors.resume = 'Only PDF, DOC, or DOCX files are allowed';
    }
  }

  return errors;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    ready_to_relocate: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
    if (errors.resume) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.resume;
        return next;
      });
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setResumeFile(file);
      if (errors.resume) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.resume;
          return next;
        });
      }
    }
  }

  function removeFile() {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    const validationErrors = validateForm(formData, resumeFile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const submitData = new window.FormData();
      submitData.append('full_name', formData.full_name.trim());
      submitData.append('email', formData.email.trim().toLowerCase());
      submitData.append('phone', formData.phone.trim());
      submitData.append('location', formData.location.trim());
      submitData.append('ready_to_relocate', formData.ready_to_relocate);
      if (resumeFile) {
        submitData.append('resume', resumeFile);
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        body: submitData,
      });

      const data = await res.json();
 
      if (res.status === 201) {
        setShowSuccess(true);
        setFormData({ full_name: '', email: '', phone: '', location: '', ready_to_relocate: '' });
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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

  // Reusable styled input field
  function renderTextField(
    name: keyof FormData,
    label: string,
    type: string,
    autoComplete: string,
    icon: React.ReactNode
  ) {
    const value = formData[name];
    const error = errors[name];
    const isFocused = focusedField === name;

    return (
      <div className="form-group form-group-relative">
        <input
          type={type}
          id={name}
          name={name}
          className={`form-input ${error ? 'input-error' : ''}`}
          placeholder=" "
          value={value}
          onChange={handleChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          disabled={isLoading}
          autoComplete={autoComplete}
          style={{
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            borderColor: error
              ? 'var(--error)'
              : isFocused
                ? 'var(--upgrad-red)'
                : 'var(--gray-300)',
            boxShadow: isFocused
              ? '0 0 0 4px rgba(229, 9, 19, 0.12)'
              : 'none',
          }}
        />
        <motion.label
          htmlFor={name}
          className={`floating-label ${isFocused ? 'active' : ''}`}
          initial={false}
          animate={{
            y: isFocused || value ? -26 : 0,
            scale: isFocused || value ? 0.85 : 1,
            x: isFocused || value ? -4 : 0,
          }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {icon}
          {label}
        </motion.label>
        {error && <span className="error-text">{error}</span>}
      </div>
    );
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
            {renderTextField(
              'full_name',
              'Full Name',
              'text',
              'name',
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}

            {/* Email */}
            {renderTextField(
              'email',
              'Email Address',
              'email',
              'email',
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            )}

            {/* Phone */}
            {renderTextField(
              'phone',
              'Phone Number',
              'tel',
              'tel',
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            )}

            {/* Location */}
            {renderTextField(
              'location',
              'Location (City)',
              'text',
              'address-level2',
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}

            {/* Ready to Relocate */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--gray-600)',
                marginBottom: '10px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l2 2" />
                </svg>
                Ready to Relocate?
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['Yes', 'No'].map((option) => (
                  <label
                    key={option}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${
                        errors.ready_to_relocate
                          ? 'var(--error)'
                          : formData.ready_to_relocate === option
                            ? 'var(--upgrad-red)'
                            : 'var(--gray-300)'
                      }`,
                      background: formData.ready_to_relocate === option
                        ? 'rgba(229, 9, 19, 0.06)'
                        : 'var(--gray-50)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: formData.ready_to_relocate === option ? 600 : 400,
                      color: formData.ready_to_relocate === option
                        ? 'var(--upgrad-red)'
                        : 'var(--gray-600)',
                      fontSize: '0.95rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="ready_to_relocate"
                      value={option}
                      checked={formData.ready_to_relocate === option}
                      onChange={handleChange}
                      disabled={isLoading}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${
                        formData.ready_to_relocate === option
                          ? 'var(--upgrad-red)'
                          : 'var(--gray-400)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}>
                      {formData.ready_to_relocate === option && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: 'var(--upgrad-red)',
                          }}
                        />
                      )}
                    </span>
                    {option}
                  </label>
                ))}
              </div>
              {errors.ready_to_relocate && <span className="error-text">{errors.ready_to_relocate}</span>}
            </div>

            {/* Resume Upload */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--gray-600)',
                marginBottom: '10px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="12" y2="12" />
                  <line x1="15" y1="15" x2="12" y2="12" />
                </svg>
                Attach Resume
              </label>

              {!resumeFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${
                      errors.resume
                        ? 'var(--error)'
                        : isDragging
                          ? 'var(--upgrad-red)'
                          : 'var(--gray-300)'
                    }`,
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isDragging ? 'rgba(229, 9, 19, 0.04)' : 'var(--gray-50)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', margin: 0 }}>
                    <span style={{ color: 'var(--upgrad-red)', fontWeight: 600 }}>Click to upload</span> or drag & drop
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', margin: '4px 0 0' }}>
                    PDF, DOC, DOCX (max 5MB)
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid var(--upgrad-red)',
                    background: 'rgba(229, 9, 19, 0.04)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--upgrad-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {resumeFile.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', margin: '2px 0 0' }}>
                      {(resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      color: 'var(--gray-400)',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gray-400)')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </motion.div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
              {errors.resume && <span className="error-text">{errors.resume}</span>}
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
