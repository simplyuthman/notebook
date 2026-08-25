'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FieldErrors {
  email?: string;
  password?: string;
}

const errorMessageStyle: React.CSSProperties = {
  color: 'var(--color-error, #b3261e)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  marginTop: 'calc(var(--spacing-collection-extra-small-spacing, 4) * 1px)',
};

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

export default function SignInForm({ onSwitchMode }: { onSwitchMode: (mode: 'signup' | 'forgot-password') => void }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = emailValue.trim().length > 0 && passwordValue.trim().length > 0;

  const handleBlur = (fieldName: keyof FieldErrors, label: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trimEnd();
    if (fieldName === 'email') setEmailValue(value);
    if (fieldName === 'password') setPasswordValue(value);

    if (!value.trim()) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: `${label} field cannot be empty` }));
    }
  };

  const handleChange = (fieldName: keyof FieldErrors) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (fieldName === 'password') {
      setPasswordValue(value);
    } else if (fieldName === 'email') {
      setEmailValue(value);
    }
    setError('');
    if (value.trim() && fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string | null) ?? '';
    const password = (formData.get('password') as string | null) ?? '';

    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = 'Email field cannot be empty';
    if (!password.trim()) errors.password = 'Password field cannot be empty';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Sign in failed. Please check your credentials and try again.');
        setIsLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="auth-card"
      style={{
        width: '80%',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'calc(var(--spacing-collection-small-spacing) * 1px)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--typography-headline-large-fontfamily)',
          fontSize: 'var(--typography-headline-medium-fontsize)',
          fontWeight: 'var(--typography-headline-large-fontweight)',
          lineHeight: 'var(--typography-headline-large-lineheight)',
          letterSpacing: 'var(--typography-headline-large-letterspacing)',
          textDecoration: 'var(--typography-headline-large-textdecoration)',
          marginTop: 0,
          marginBottom: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
          textAlign: 'center',
        }}
      >
        Welcome Back!
      </h2>

      <p
        style={{
          fontFamily: 'var(--typography-body-medium-fontfamily)',
          fontSize: 'var(--typography-body-medium-fontsize)',
          color: 'var(--color-on-surface-variant)',
          textAlign: 'center',
          margin: '0 0 calc(var(--spacing-collection-extra-large-spacing) * 1px) 0',
          lineHeight: '1.5',
        }}
      >
        Sign in to continue to your Notebook.
      </p>


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
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontFamily: 'var(--typography-label-large-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: 'var(--typography-label-large-fontweight)',
              lineHeight: 'var(--typography-label-large-lineheight)',
              letterSpacing: 'var(--typography-label-large-letterspacing)',
              textDecoration: 'var(--typography-label-large-textdecoration)',
              marginBottom: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
            }}
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            value={emailValue}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            onBlur={handleBlur('email', 'Email')}
            onChange={handleChange('email')}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
              borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
              border: fieldErrors.email ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
            }}
          />
          {fieldErrors.email && <p id="email-error" role="alert" style={errorMessageStyle}>{fieldErrors.email}</p>}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontFamily: 'var(--typography-label-large-fontfamily)',
                fontSize: 'var(--typography-label-large-fontsize)',
                fontWeight: 'var(--typography-label-large-fontweight)',
                lineHeight: 'var(--typography-label-large-lineheight)',
                letterSpacing: 'var(--typography-label-large-letterspacing)',
                textDecoration: 'var(--typography-label-large-textdecoration)',
              }}
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => onSwitchMode('forgot-password')}
              style={{
                fontFamily: 'var(--typography-label-medium-fontfamily)',
                fontSize: 'var(--typography-label-medium-fontsize)',
                color: 'var(--color-primary)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Forgot password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={passwordValue}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              onBlur={handleBlur('password', 'Password')}
              onChange={handleChange('password')}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                paddingRight: '44px',
                borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
                border: fieldErrors.password ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-on-surface)',
              }}
            />
            {passwordValue.length > 0 && (
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
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          style={{
            backgroundColor: isFormValid ? 'var(--color-primary)' : 'var(--color-surface-variant, #e6e6e6)',
            color: isFormValid ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant, #4c4c4c)',
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
            transition: 'background-color 0.2s, color 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isLoading ? (
            <>
              <Spinner />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
      <div style={{ marginTop: 'calc(var(--spacing-collection-large-spacing) * 1px)', textAlign: 'center' }}>
        <button
          onClick={() => onSwitchMode('signup')}
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
          Need an account? <span style={{ color: 'var(--color-primary)' }}>Sign up</span>
        </button>
      </div>
    </div>
  );
}
