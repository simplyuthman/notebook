'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface PasswordChecks {
  minLength: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

const errorMessageStyle: React.CSSProperties = {
  color: 'var(--color-error, #b3261e)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  marginTop: 'calc(var(--spacing-collection-extra-small-spacing, 4) * 1px)',
};

// Neutral while typing, only red after blur on unmet rules
const passwordHintNeutralStyle: React.CSSProperties = {
  color: 'var(--color-on-surface-variant, #49454f)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  margin: '2px 0 0 0',
  padding: 0,
};

const passwordHintErrorStyle: React.CSSProperties = {
  color: 'var(--color-error, #b3261e)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  margin: '2px 0 0 0',
  padding: 0,
};

const passwordHintSuccessStyle: React.CSSProperties = {
  color: 'var(--color-success, #146c2e)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  margin: '2px 0 0 0',
  padding: 0,
};

const FULL_NAME_REGEX = /^[a-zA-Z]+(?:\s+[a-zA-Z]+)+$/;
const LETTERS_ONLY_REGEX = /^[a-zA-Z\s]*$/;
const EMAIL_VALID_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordChecks(value: string): PasswordChecks {
  return {
    minLength: value.length >= 8,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[#@>^]/.test(value),
  };
}

function isPasswordValid(checks: PasswordChecks): boolean {
  return checks.minLength && checks.lowercase && checks.uppercase && checks.number && checks.special;
}

const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
);

const Spinner = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color: 'inherit' }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="40 10"
      strokeLinecap="round"
      opacity="0.3"
    />
    <path
      d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5936 2.3725 15.0998 3.03352 16.4343"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export default function SignupForm({ onSwitchMode }: { onSwitchMode: (mode: 'signin') => void }) {
  const router = useRouter();
  const idempotencyKeyRef = useRef(typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7));
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Track blur separately from typing to control hint colour
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [passwordBlurred, setPasswordBlurred] = useState(false);

  const passwordChecks = getPasswordChecks(passwordValue);
  const passwordHasStartedTyping = passwordValue.length > 0;

  const isNameValid = nameValue.trim().length > 0 && FULL_NAME_REGEX.test(nameValue.trim());
  const isEmailValid = emailValue.trim().length > 0 && EMAIL_VALID_REGEX.test(emailValue);
  const isPasswordValidState = isPasswordValid(passwordChecks);
  const passwordsMatch = confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue;

  const isFormValid = isNameValid && isEmailValid && isPasswordValidState && passwordsMatch;

  const handleBlur = (fieldName: keyof FieldErrors, label: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trimEnd();
    if (fieldName === 'name') setNameValue(value);
    if (fieldName === 'email') setEmailValue(value);
    if (fieldName === 'password') {
      setPasswordValue(value);
      setPasswordBlurred(true);
    }

    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    if (!value.trim() && fieldName !== 'confirmPassword') {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: `${label} field cannot be empty` }));
    } else if (fieldName === 'name') {
      if (!LETTERS_ONLY_REGEX.test(value)) {
        setFieldErrors((prev) => ({ ...prev, name: 'Full name must use only letters' }));
      } else if (!FULL_NAME_REGEX.test(value.trim())) {
        setFieldErrors((prev) => ({ ...prev, name: 'Full name must contain at least two words' }));
      }
    } else if (fieldName === 'confirmPassword') {
      if (value !== passwordValue) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setFieldErrors((prev) => { const n = { ...prev }; delete n.confirmPassword; return n; });
      }
    }
  };

  const handleChange = (fieldName: keyof FieldErrors) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (fieldName === 'name') {
      setNameValue(value);
      if (value.trim() && FULL_NAME_REGEX.test(value.trim()) && fieldErrors.name) {
        setFieldErrors((prev) => { const next = { ...prev }; delete next.name; return next; });
      } else if (value.trim()) {
        if (!LETTERS_ONLY_REGEX.test(value)) {
          setFieldErrors((prev) => ({ ...prev, name: 'Full name must use only letters' }));
        } else if (!FULL_NAME_REGEX.test(value.trim())) {
          setFieldErrors((prev) => ({ ...prev, name: 'Full name must contain at least two words' }));
        }
      }
    } else if (fieldName === 'email') {
      setEmailValue(value);
      if (value.trim() && !EMAIL_VALID_REGEX.test(value)) {
        setFieldErrors((prev) => ({ ...prev, email: 'Enter a valid email address' }));
      } else if (value.trim() && EMAIL_VALID_REGEX.test(value) && fieldErrors.email) {
        setFieldErrors((prev) => { const next = { ...prev }; delete next.email; return next; });
      }
    } else if (fieldName === 'password') {
      setPasswordValue(value);
      if (fieldErrors.password) setFieldErrors((prev) => { const n = { ...prev }; delete n.password; return n; });
      // Re-validate confirm on password change
      if (confirmPasswordValue.length > 0) {
        if (value === confirmPasswordValue) {
          setFieldErrors((prev) => { const n = { ...prev }; delete n.confirmPassword; return n; });
        } else {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        }
      }
    } else if (fieldName === 'confirmPassword') {
      setConfirmPasswordValue(value);
      if (value === passwordValue) {
        setFieldErrors((prev) => { const n = { ...prev }; delete n.confirmPassword; return n; });
      } else if (touched.confirmPassword) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const errors: FieldErrors = {};
    if (!nameValue.trim()) {
      errors.name = 'Full name field cannot be empty';
    } else if (!LETTERS_ONLY_REGEX.test(nameValue)) {
      errors.name = 'Full name must use letters';
    } else if (!FULL_NAME_REGEX.test(nameValue.trim())) {
      errors.name = 'Full name must contain at least two words';
    }
    if (!emailValue.trim()) {
      errors.email = 'Email field cannot be empty';
    } else if (!EMAIL_VALID_REGEX.test(emailValue)) {
      errors.email = 'Enter a valid email address';
    }
    if (!passwordValue.trim()) errors.password = 'Password field cannot be empty';
    if (!confirmPasswordValue.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordValue !== confirmPasswordValue) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!isPasswordValid(passwordChecks)) {
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue, email: emailValue, password: passwordValue, idempotencyKey: idempotencyKeyRef.current }),
      });

      if (res.ok) {
        router.push('/onboarding');
      } else {
        const data = await res.json();
        setError(data.error || 'Account creation failed. Please try again.');
        setIsLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--typography-label-large-fontfamily)',
    fontSize: 'var(--typography-label-large-fontsize)',
    fontWeight: 'var(--typography-label-large-fontweight)',
    lineHeight: 'var(--typography-label-large-lineheight)',
    letterSpacing: 'var(--typography-label-large-letterspacing)',
    textDecoration: 'var(--typography-label-large-textdecoration)',
    marginBottom: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
  };

  const submitButtonStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface-variant, #e6e6e6)',
    color: active ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant, #4c4c4c)',
    padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
    border: 'none',
    borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
    fontFamily: 'var(--typography-label-large-fontfamily)',
    fontSize: 'var(--typography-label-large-fontsize)',
    fontWeight: 'var(--typography-label-large-fontweight)',
    lineHeight: 'var(--typography-label-large-lineheight)',
    letterSpacing: 'var(--typography-label-large-letterspacing)',
    cursor: active ? 'pointer' : 'not-allowed',
    boxShadow: active ? 'var(--effect-soft-shadow)' : 'none',
    marginTop: 'calc(var(--spacing-collection-small-spacing) * 1px)',
    transition: 'background-color 0.2s, color 0.2s, box-shadow 0.2s',
    width: '100%',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
    borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
    border: '1px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-on-surface)',
  };

  return (
    <div
      className="auth-card"
      style={{
        width: '80%',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'calc(var(--spacing-collection-small-spacing) * 1px)',
        position: 'relative',
      }}
    >
      <button
        onClick={() => onSwitchMode('signin')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--color-on-surface-variant)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          borderRadius: '50%',
          transition: 'background-color 0.2s ease',
        }}
        aria-label="Back to Sign In"
        title="Back to Sign In"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-variant)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <h2
        style={{
          fontFamily: 'var(--typography-headline-large-fontfamily)',
          fontSize: 'var(--typography-headline-large-fontsize)',
          fontWeight: 'var(--typography-headline-large-fontweight)',
          lineHeight: 'var(--typography-headline-large-lineheight)',
          letterSpacing: 'var(--typography-headline-large-letterspacing)',
          textDecoration: 'var(--typography-headline-large-textdecoration)',
          marginTop: 0,
          marginBottom: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
          textAlign: 'center',
        }}
      >
        Create an Account
      </h2>

      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--color-error-container)',
            color: 'var(--color-on-error-container)',
            padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
            marginBottom: 'calc(var(--spacing-collection-base-spacing) * 1px)',
            borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(var(--spacing-collection-small-spacing) * 1px)',
            fontFamily: 'var(--typography-body-medium-fontfamily)',
            fontSize: 'var(--typography-body-medium-fontsize)',
          }}
        >
          <span aria-hidden="true">⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--spacing-collection-base-spacing) * 1px)' }}>
        {/* Full name */}
        <div>
          <label htmlFor="name" style={labelStyle}>Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            autoComplete="name"
            placeholder="Jane Doe"
            value={nameValue}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            onBlur={handleBlur('name', 'Full name')}
            onChange={handleChange('name')}
            style={{
              ...inputStyle,
              border: fieldErrors.name ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)',
              backgroundColor: touched.name && isNameValid ? 'var(--color-primary-container)' : 'var(--color-surface)',
            }}
          />
          {fieldErrors.name && <p id="name-error" role="alert" style={errorMessageStyle}>{fieldErrors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={emailValue}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            onBlur={handleBlur('email', 'Email')}
            onChange={handleChange('email')}
            style={{
              ...inputStyle,
              border: fieldErrors.email ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)',
              backgroundColor: touched.email && isEmailValid ? 'var(--color-primary-container)' : 'var(--color-surface)',
            }}
          />
          {fieldErrors.email && <p id="email-error" role="alert" style={errorMessageStyle}>{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={passwordValue}
              aria-invalid={!!fieldErrors.password || (!isPasswordValidState && passwordHasStartedTyping)}
              aria-describedby={["password-rules", fieldErrors.password ? "password-error" : ""].filter(Boolean).join(" ")}
              onBlur={handleBlur('password', 'Password')}
              onChange={handleChange('password')}
              style={{
                ...inputStyle,
                paddingRight: '44px',
                border: fieldErrors.password ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)',
                backgroundColor: touched.password && isPasswordValidState ? 'var(--color-primary-container)' : 'var(--color-surface)',
              }}
            />
            {passwordHasStartedTyping && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-on-surface-variant, #49454f)',
                }}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            )}
          </div>
          {fieldErrors.password && <p id="password-error" role="alert" style={errorMessageStyle}>{fieldErrors.password}</p>}
          {/* Password hints: neutral while typing, red only after blur on unmet rule */}
          {passwordHasStartedTyping && (
            <div id="password-rules" style={{ marginTop: '4px' }}>
              <p style={passwordChecks.lowercase ? passwordHintSuccessStyle : (passwordBlurred ? passwordHintErrorStyle : passwordHintNeutralStyle)}>
                <span aria-hidden="true">{passwordChecks.lowercase ? '✓ ' : 'x '}</span>Must contain a lowercase letter
              </p>
              <p style={passwordChecks.uppercase ? passwordHintSuccessStyle : (passwordBlurred ? passwordHintErrorStyle : passwordHintNeutralStyle)}>
                <span aria-hidden="true">{passwordChecks.uppercase ? '✓ ' : 'x '}</span>Must contain an uppercase letter
              </p>
              <p style={passwordChecks.number ? passwordHintSuccessStyle : (passwordBlurred ? passwordHintErrorStyle : passwordHintNeutralStyle)}>
                <span aria-hidden="true">{passwordChecks.number ? '✓ ' : 'x '}</span>Must contain a number
              </p>
              <p style={passwordChecks.special ? passwordHintSuccessStyle : (passwordBlurred ? passwordHintErrorStyle : passwordHintNeutralStyle)}>
                <span aria-hidden="true">{passwordChecks.special ? '✓ ' : 'x '}</span>Must contain one of: # @ &gt; ^
              </p>
              <p style={passwordChecks.minLength ? passwordHintSuccessStyle : (passwordBlurred ? passwordHintErrorStyle : passwordHintNeutralStyle)}>
                <span aria-hidden="true">{passwordChecks.minLength ? '✓ ' : 'x '}</span>Must be at least 8 characters long
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm-password" style={labelStyle}>Confirm password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPasswordValue}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
              onBlur={handleBlur('confirmPassword', 'Confirm password')}
              onChange={handleChange('confirmPassword')}
              style={{
                ...inputStyle,
                paddingRight: '44px',
                border: fieldErrors.confirmPassword ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)',
                backgroundColor: touched.confirmPassword && passwordsMatch ? 'var(--color-primary-container)' : 'var(--color-surface)',
              }}
            />
            {confirmPasswordValue.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-on-surface-variant, #49454f)',
                }}
              >
                {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            )}
          </div>
          {fieldErrors.confirmPassword && <p id="confirm-password-error" role="alert" style={errorMessageStyle}>{fieldErrors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          style={{
            backgroundColor: isFormValid ? 'var(--color-primary)' : 'var(--color-primary-container)',
            color: isFormValid ? 'var(--color-on-primary)' : 'var(--color-on-primary-container)',
            padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
            border: 'none',
            borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
            fontFamily: 'var(--typography-label-large-fontfamily)',
            fontSize: 'var(--typography-label-large-fontsize)',
            fontWeight: 'var(--typography-label-large-fontweight)',
            lineHeight: 'var(--typography-label-large-lineheight)',
            letterSpacing: 'var(--typography-label-large-letterspacing)',
            textDecoration: 'var(--typography-label-large-textdecoration)',
            cursor: isFormValid && !isLoading ? 'pointer' : 'not-allowed',
            boxShadow: isFormValid && !isLoading ? 'var(--effect-soft-shadow)' : 'none',
            marginTop: 'calc(var(--spacing-collection-small-spacing) * 1px)',
            opacity: isFormValid && !isLoading ? 1 : 0.5,
            transition: 'background-color 0.2s, opacity 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isLoading ? (
            <>
              <Spinner />
              <span>Creating account...</span>
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
      <div style={{ marginTop: 'calc(var(--spacing-collection-large-spacing) * 1px)', textAlign: 'center' }}>
        <button
          onClick={() => onSwitchMode('signin')}
          style={{
            fontFamily: 'var(--typography-label-large-fontfamily)',
            fontSize: 'var(--typography-label-large-fontsize)',
            fontWeight: 'var(--typography-label-large-fontweight)',
            lineHeight: 'var(--typography-label-large-lineheight)',
            letterSpacing: 'var(--typography-label-large-letterspacing)',
            color: 'var(--color-on-surface-variant)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Already have an account? <span style={{ color: 'var(--color-primary)' }}>Sign in</span>
        </button>
      </div>
    </div>
  );
}
