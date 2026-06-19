export interface ValidationError {
  field: string;
  message: string;
}

export interface RegistrationData {
  full_name: string;
  email: string;
  phone: string;
  location?: string;
}

export function validateRegistration(data: RegistrationData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Full Name
  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters.' });
  }
  if (data.full_name && data.full_name.trim().length > 100) {
    errors.push({ field: 'full_name', message: 'Full name must be under 100 characters.' });
  }

  // Email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  }

  // Phone
  const phoneDigits = data.phone ? data.phone.replace(/[^0-9]/g, '') : '';
  if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.push({ field: 'phone', message: 'Phone number must be 10–15 digits.' });
  }

  return errors;
}
