'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const EMAIL_VALID_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
  borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
  border: '1px solid var(--color-outline)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-on-surface)',
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

const errorBannerStyle: React.CSSProperties = {
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
};

const hintStyle: React.CSSProperties = {
  color: 'var(--color-error, #b3261e)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  margin: '2px 0 0 0',
  padding: 0,
};

const hintNeutralStyle: React.CSSProperties = {
  color: 'var(--color-on-surface-variant, #49454f)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  margin: '2px 0 0 0',
  padding: 0,
};

const hintSuccessStyle: React.CSSProperties = {
  color: 'var(--color-success, #146c2e)',
  fontSize: 'var(--typography-label-small-fontsize, 0.75rem)',
  fontFamily: 'var(--typography-label-small-fontfamily, inherit)',
  margin: '2px 0 0 0',
  padding: 0,
};

const DismissButton = ({ onDismiss }: { onDismiss: () => void }) => (
  <button
    type="button"
    onClick={onDismiss}
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
      marginLeft: 'auto',
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
);

const cardStyle: React.CSSProperties = {
  width: '80%',
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'calc(var(--spacing-collection-small-spacing) * 1px)',
};

interface PasswordChecks {
  minLength: boolean; lowercase: boolean; uppercase: boolean; number: boolean; special: boolean;
}
function getPasswordChecks(v: string): PasswordChecks {
  return { minLength: v.length >= 8, lowercase: /[a-z]/.test(v), uppercase: /[A-Z]/.test(v), number: /[0-9]/.test(v), special: /[#@>^]/.test(v) };
}
function isPasswordValid(c: PasswordChecks) {
  return c.minLength && c.lowercase && c.uppercase && c.number && c.special;
}

const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
);
function CheckCircleIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordForm({ onSwitchMode }: { onSwitchMode: (mode: 'signin') => void }) {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') ?? '';
  const codeFromUrl = searchParams.get('code') ?? '';

  const [step, setStep] = useState<Step>(
    emailFromUrl && codeFromUrl ? 'password' : emailFromUrl ? 'code' : 'email'
  );

  // Step 1 state
  const [emailValue, setEmailValue] = useState(emailFromUrl);
  const [emailError, setEmailError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [sendError, setSendError] = useState('');

  // Step 2 state
  const [code, setCode] = useState(codeFromUrl);
  const [codeError, setCodeError] = useState('');

  // Step 3 state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [passwordBlurred, setPasswordBlurred] = useState(false);

  const isEmailValid = EMAIL_VALID_REGEX.test(emailValue.trim());
  const isCodeValid = /^\d{6}$/.test(code.trim());
  const passwordChecks = getPasswordChecks(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordFormValid = isCodeValid && isPasswordValid(passwordChecks) && passwordsMatch;

  // ── Step 1: Email ─────────────────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendError('');
    if (!emailValue.trim()) { setEmailError('Email field cannot be empty'); return; }
    if (!isEmailValid) { setEmailError('Enter a valid email address'); return; }
    setEmailError('');
    setSendingCode(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });
      if (res.ok) {
        setStep('code');
      } else {
        const data = await res.json();
        setSendError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSendError('An unexpected error occurred. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  // ── Step 2: Code verification → advance to password step ─────────────────
  const handleVerifyCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isCodeValid) { setCodeError('Please enter a valid 6-digit code.'); return; }
    setCodeError('');
    setStep('password');
  };

  // ── Step 3: New password submission ──────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isPasswordFormValid) return;
    setSaveError('');
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue.trim(), code: code.trim(), password }),
      });
      if (res.ok) {
        setStep('success');
      } else {
        const data = await res.json();
        // If token/code is wrong, send the user back to code entry
        if (data.error?.toLowerCase().includes('code')) {
          setSaveError('');
          setCode('');
          setCodeError(data.error);
          setStep('code');
        } else {
          setSaveError(data.error || 'Something went wrong. Please try again.');
        }
      }
    } catch {
      setSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Heading helper ────────────────────────────────────────────────────────
  const headingText: Record<Step, string> = {
    email: 'Reset your password',
    code: 'Enter your reset code',
    password: 'Choose a new password',
    success: 'Password updated!',
  };

  const stepIndicator = (current: Step) => {
    const steps: Step[] = ['email', 'code', 'password'];
    const currentIdx = steps.indexOf(current);
    if (currentIdx === -1) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: 'calc(var(--spacing-collection-base-spacing) * 1px)' }}>
        <p style={{ fontFamily: 'var(--typography-label-small-fontfamily)', fontSize: 'var(--typography-label-small-fontsize)', color: 'var(--color-on-surface-variant)', margin: 0, letterSpacing: '0.05em' }}>
          Step {currentIdx + 1} of {steps.length}
        </p>
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {steps.map((s, i) => (
            <div key={s} style={{
              width: i === currentIdx ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: i <= currentIdx ? 'var(--color-primary)' : 'var(--color-outline)',
              transition: 'width 0.3s, background-color 0.3s',
            }} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="auth-card" style={cardStyle}>

      {/* ── Success ───────────────────────────────────────────────────── */}
      {step === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'calc(var(--spacing-collection-base-spacing) * 1px)', textAlign: 'center' }}>
          <CheckCircleIcon />
          <h2 style={{ fontFamily: 'var(--typography-headline-large-fontfamily)', fontSize: 'var(--typography-headline-large-fontsize)', fontWeight: 'var(--typography-headline-large-fontweight)', margin: 0 }}>
            {headingText.success}
          </h2>
          <p style={{ fontFamily: 'var(--typography-body-medium-fontfamily)', fontSize: 'var(--typography-body-medium-fontsize)', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
            Your password has been changed. You can now sign in with your new password.
          </p>
          <button onClick={() => onSwitchMode('signin')} style={submitButtonStyle(true)}>
            Go to Sign In
          </button>
        </div>
      )}

      {/* ── Step 1: Email ─────────────────────────────────────────────── */}
      {step === 'email' && (
        <>
          {stepIndicator('email')}
          <h2 style={{ fontFamily: 'var(--typography-headline-large-fontfamily)', fontSize: 'var(--typography-headline-large-fontsize)', fontWeight: 'var(--typography-headline-large-fontweight)', marginTop: 0, marginBottom: 'calc(var(--spacing-collection-small-spacing) * 1px)', textAlign: 'center' }}>
            {headingText.email}
          </h2>
          <p style={{ fontFamily: 'var(--typography-body-medium-fontfamily)', fontSize: 'var(--typography-body-medium-fontsize)', color: 'var(--color-on-surface-variant)', textAlign: 'center', margin: '0 0 calc(var(--spacing-collection-extra-large-spacing) * 1px) 0', lineHeight: '1.5' }}>
            Enter the email address linked to your account and we&apos;ll send you a 6-digit reset code.
          </p>
          {sendError && <div role="alert" style={errorBannerStyle}><span aria-hidden="true">⚠️</span><span style={{ flex: 1 }}>{sendError}</span><DismissButton onDismiss={() => setSendError('')} /></div>}
          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--spacing-collection-base-spacing) * 1px)' }}>
            <div>
              <label htmlFor="email" style={labelStyle}>Email address</label>
              <input
                id="email" name="email" type="email" required
                autoFocus
                autoComplete="email"
                value={emailValue}
                onChange={(e) => { setEmailValue(e.target.value); if (emailError && EMAIL_VALID_REGEX.test(e.target.value)) setEmailError(''); }}
                onBlur={(e) => { const v = e.target.value.trim(); if (!v) setEmailError('Email field cannot be empty'); else if (!EMAIL_VALID_REGEX.test(v)) setEmailError('Enter a valid email address'); else setEmailError(''); }}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                style={{ ...inputStyle, border: emailError ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)' }}
              />
              {emailError && <p id="email-error" role="alert" style={hintStyle}>{emailError}</p>}
            </div>
            <button type="submit" disabled={!isEmailValid || sendingCode} style={submitButtonStyle(isEmailValid && !sendingCode)}>
              {sendingCode ? 'Sending code...' : 'Send reset code'}
            </button>
          </form>
          <div style={{ marginTop: 'calc(var(--spacing-collection-large-spacing) * 1px)', textAlign: 'center' }}>
            <button onClick={() => onSwitchMode('signin')} style={{ fontFamily: 'var(--typography-label-large-fontfamily)', fontSize: 'var(--typography-label-large-fontsize)', color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Remember your password? <span style={{ color: 'var(--color-primary)' }}>Sign in</span>
            </button>
          </div>
        </>
      )}

      {/* ── Step 2: Code ──────────────────────────────────────────────── */}
      {step === 'code' && (
        <>
          {stepIndicator('code')}
          <h2 style={{ fontFamily: 'var(--typography-headline-large-fontfamily)', fontSize: 'var(--typography-headline-large-fontsize)', fontWeight: 'var(--typography-headline-large-fontweight)', marginTop: 0, marginBottom: 'calc(var(--spacing-collection-small-spacing) * 1px)', textAlign: 'center' }}>
            {headingText.code}
          </h2>
          <p style={{ fontFamily: 'var(--typography-body-medium-fontfamily)', fontSize: 'var(--typography-body-medium-fontsize)', color: 'var(--color-on-surface-variant)', textAlign: 'center', margin: '0 0 calc(var(--spacing-collection-extra-large-spacing) * 1px) 0', lineHeight: '1.5' }}>
            We sent a 6-digit code to <strong>{emailValue}</strong>. Enter it below.
          </p>
          {codeError && <div role="alert" style={errorBannerStyle}><span aria-hidden="true">⚠️</span><span style={{ flex: 1 }}>{codeError}</span><DismissButton onDismiss={() => setCodeError('')} /></div>}
          <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--spacing-collection-base-spacing) * 1px)' }}>
            <div>
              <label htmlFor="code" style={labelStyle}>6-digit reset code</label>
              <input
                id="code" name="code" type="text" inputMode="numeric" maxLength={6} required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (codeError) setCodeError(''); }}
                placeholder="123456"
                aria-invalid={!!codeError}
                aria-describedby={codeError ? "code-error" : undefined}
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '8px', fontSize: '1.4rem', textAlign: 'center' }}
              />
              {codeError && <p id="code-error" role="alert" style={hintStyle}>{codeError}</p>}
            </div>
            <button type="submit" disabled={!isCodeValid} style={submitButtonStyle(isCodeValid)}>
              Continue
            </button>
          </form>
          <div style={{ marginTop: 'calc(var(--spacing-collection-base-spacing) * 1px)', textAlign: 'center' }}>
            <button
              onClick={() => { setSendError(''); setStep('email'); }}
              style={{ fontFamily: 'var(--typography-label-large-fontfamily)', fontSize: 'var(--typography-label-large-fontsize)', color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Didn&apos;t get a code? <span style={{ color: 'var(--color-primary)' }}>Resend</span>
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: New password ──────────────────────────────────────── */}
      {step === 'password' && (
        <>
          {stepIndicator('password')}
          <h2 style={{ fontFamily: 'var(--typography-headline-large-fontfamily)', fontSize: 'var(--typography-headline-large-fontsize)', fontWeight: 'var(--typography-headline-large-fontweight)', marginTop: 0, marginBottom: 'calc(var(--spacing-collection-small-spacing) * 1px)', textAlign: 'center' }}>
            {headingText.password}
          </h2>
          <p style={{ fontFamily: 'var(--typography-body-medium-fontfamily)', fontSize: 'var(--typography-body-medium-fontsize)', color: 'var(--color-on-surface-variant)', textAlign: 'center', margin: '0 0 calc(var(--spacing-collection-extra-large-spacing) * 1px) 0', lineHeight: '1.5' }}>
            Your new password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
          </p>
          {saveError && <div role="alert" style={errorBannerStyle}><span aria-hidden="true">⚠️</span><span style={{ flex: 1 }}>{saveError}</span><DismissButton onDismiss={() => setSaveError('')} /></div>}
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--spacing-collection-base-spacing) * 1px)' }}>
            <div>
              <label htmlFor="newPassword" style={labelStyle}>New password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword" name="password" type={showPassword ? 'text' : 'password'} required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); }}
                  onBlur={() => setPasswordBlurred(true)}
                  aria-invalid={password.length > 0 && !isPasswordValid(passwordChecks)}
                  aria-describedby="password-rules"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface-variant)' }}
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                )}
              </div>
              {password.length > 0 && (
                <div id="password-rules" style={{ marginTop: '4px' }}>
                  <p style={passwordChecks.lowercase ? hintSuccessStyle : (passwordBlurred ? hintStyle : hintNeutralStyle)}>
                    <span aria-hidden="true">{passwordChecks.lowercase ? '✓ ' : '✕ '}</span>Must contain a lowercase letter
                  </p>
                  <p style={passwordChecks.uppercase ? hintSuccessStyle : (passwordBlurred ? hintStyle : hintNeutralStyle)}>
                    <span aria-hidden="true">{passwordChecks.uppercase ? '✓ ' : '✕ '}</span>Must contain an uppercase letter
                  </p>
                  <p style={passwordChecks.number ? hintSuccessStyle : (passwordBlurred ? hintStyle : hintNeutralStyle)}>
                    <span aria-hidden="true">{passwordChecks.number ? '✓ ' : '✕ '}</span>Must contain a number
                  </p>
                  <p style={passwordChecks.special ? hintSuccessStyle : (passwordBlurred ? hintStyle : hintNeutralStyle)}>
                    <span aria-hidden="true">{passwordChecks.special ? '✓ ' : '✕ '}</span>Must contain one of: # @ &gt; ^
                  </p>
                  <p style={passwordChecks.minLength ? hintSuccessStyle : (passwordBlurred ? hintStyle : hintNeutralStyle)}>
                    <span aria-hidden="true">{passwordChecks.minLength ? '✓ ' : '✕ '}</span>Must be at least 8 characters long
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirm new password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                  aria-describedby={confirmPassword.length > 0 && !passwordsMatch ? "confirm-password-error" : undefined}
                  style={{ ...inputStyle, paddingRight: '44px', border: confirmPassword.length > 0 && !passwordsMatch ? '1px solid var(--color-error, #b3261e)' : '1px solid var(--color-outline)' }}
                />
                {confirmPassword.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface-variant)' }}
                  >
                    {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                )}
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p id="confirm-password-error" role="alert" style={hintStyle}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={!isPasswordFormValid || savingPassword} style={submitButtonStyle(isPasswordFormValid && !savingPassword)}>
              {savingPassword ? 'Saving password...' : 'Set new password'}
            </button>
          </form>
          <div style={{ marginTop: 'calc(var(--spacing-collection-base-spacing) * 1px)', textAlign: 'center' }}>
            <button
              onClick={() => setStep('code')}
              style={{ fontFamily: 'var(--typography-label-large-fontfamily)', fontSize: 'var(--typography-label-large-fontsize)', color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              ← Back to code entry
            </button>
          </div>
        </>
      )}
    </div>
  );
}
