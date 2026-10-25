'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return email;
  return `${email.slice(0, 2)}***${email.slice(atIndex)}`;
}

export default function EmailVerificationBanner({ email }: { email: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'initial' | 'input'>('input');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [codeSent, setCodeSent] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maskedEmail = maskEmail(email);

  useEffect(() => {
    if (status !== 'success') return;
    const fadeTimer = setTimeout(() => setFadingOut(true), 9000);
    const dismissTimer = setTimeout(() => {
      setDismissed(true);
      router.refresh();
    }, 10000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [status, router]);

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissedInSession = sessionStorage.getItem('email_verification_dismissed');
      if (isDismissedInSession === 'true') {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismissSession = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('email_verification_dismissed', 'true');
    }
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleDigitChange = (index: number, value: string) => {
    const sanitised = value.replace(/\D/g, '');
    if (sanitised.length > 1) {
      const spread = sanitised.slice(0, 6).split('');
      const next = [...digits];
      spread.forEach((ch, i) => { if (index + i < 6) next[index + i] = ch; });
      setDigits(next);
      const focusIdx = Math.min(index + spread.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = sanitised;
    setDigits(next);
    if (sanitised && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Verification failed.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      const res = await fetch('/api/auth/send-verification', { method: 'POST' });
      if (res.ok) {
        setResendStatus('sent');
        setCodeSent(true);
        setErrorMsg('');
        startCooldown();
        setMode('input');
      } else {
        const data = await res.json();
        setResendStatus('error');
        setErrorMsg(data.error ?? 'Failed to resend code.');
      }
    } catch {
      setResendStatus('error');
      setErrorMsg('Failed to resend code.');
    }
    setTimeout(() => setResendStatus('idle'), 3000);
  };

  // ── Success state (Green Snackbar for 10 seconds) ──────────────────────────
  if (status === 'success') {
    if (dismissed) return null;
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: 'var(--color-success)',
          color: 'var(--color-on-success)',
          borderRadius: '8px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          fontFamily: 'var(--typography-body-medium-fontfamily, sans-serif)',
          fontSize: 'var(--typography-body-medium-fontsize, 0.875rem)',
          fontWeight: '500',
          opacity: fadingOut ? 0 : 1,
          transform: fadingOut ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          pointerEvents: fadingOut ? 'none' : 'auto',
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>✓</span>
        <span>Email verified successfully</span>
      </div>
    );
  }

  if (dismissed) return null;

  // ── Main banner ────────────────────────────────────────────────────────────
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'relative',
        backgroundColor: 'var(--color-surface-container)',
        borderRadius: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
        padding: 'calc(var(--spacing-collection-large-spacing) * 1px) calc(var(--spacing-collection-very-large-spacing) * 1px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
        border: '1px solid var(--color-outline)',
      }}
    >
      {/* Top right close button to dismiss for current session */}
      <button
        type="button"
        onClick={handleDismissSession}
        aria-label="Dismiss email verification"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-on-surface-variant)',
          opacity: 0.7,
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.2s ease, background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.backgroundColor = 'var(--color-surface-variant)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
          <svg
            aria-hidden="true"
            focusable="false"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-on-surface-variant)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </span>
        <p style={{
          margin: 0,
          fontFamily: 'var(--typography-title-medium-fontfamily)',
          fontSize: 'var(--typography-title-medium-fontsize)',
          fontWeight: '600',
          color: 'var(--color-on-surface)',
        }}>
          Verify your email address
        </p>
      </div>

      {/* Initial mode: prompt to send code */}
      {mode === 'initial' && (
        <p style={{
          margin: 0,
          fontFamily: 'var(--typography-body-medium-fontfamily)',
          fontSize: 'var(--typography-body-medium-fontsize)',
          color: 'var(--color-on-surface-variant)',
        }}>
          We&apos;ll send a verification code to <strong style={{ color: 'var(--color-on-surface)' }}>{maskedEmail}</strong>
        </p>
      )}

      {mode === 'initial' ? (
        <div style={{ marginTop: '4px' }}>
          <button
            onClick={handleResend}
            disabled={resendStatus === 'sending'}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'var(--typography-label-large-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: '500',
              cursor: resendStatus === 'sending' ? 'not-allowed' : 'pointer',
              opacity: resendStatus === 'sending' ? 0.7 : 1,
            }}
          >
            {resendStatus === 'sending' ? 'Sending...' : 'Send verification code'}
          </button>

          <button
            onClick={() => setMode('input')}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-on-surface-variant)',
              padding: '8px 16px',
              border: 'none',
              fontFamily: 'var(--typography-label-medium-fontfamily)',
              fontSize: 'var(--typography-label-medium-fontsize)',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '8px',
            }}
          >
            I already have a code
          </button>
        </div>
      ) : (
        <>
          {codeSent && (
            <p style={{
              margin: 0,
              fontFamily: 'var(--typography-body-medium-fontfamily)',
              fontSize: 'var(--typography-body-medium-fontsize)',
              color: 'var(--color-on-surface-variant)',
            }}>
              A verification code has been sent to{' '}
              <strong style={{ color: 'var(--color-on-surface)' }}>{maskedEmail}</strong>.
              {' '}Enter it below.
            </p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
            {/* OTP digit inputs — design preserved */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    width: '36px',
                    height: '42px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: errorMsg ? '1px solid var(--color-error)' : '1px solid var(--color-outline)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>

            {/* Primary Verify button — colour preserved */}
            <button
              type="submit"
              disabled={status === 'submitting' || digits.join('').length < 6}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                padding: '8px 20px',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'var(--typography-label-large-fontfamily)',
                fontSize: 'var(--typography-label-large-fontsize)',
                fontWeight: '500',
                cursor: digits.join('').length === 6 ? 'pointer' : 'not-allowed',
                opacity: status === 'submitting' || digits.join('').length < 6 ? 0.7 : 1,
              }}
            >
              {status === 'submitting' ? 'Verifying...' : 'Verify'}
            </button>

            {/* Resend link */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendStatus === 'sending'}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--typography-label-medium-fontfamily)',
                fontSize: 'var(--typography-label-medium-fontsize)',
                color: resendCooldown > 0
                  ? 'var(--color-on-surface-variant)'
                  : 'var(--color-primary)',
                cursor: resendCooldown > 0 ? 'default' : 'pointer',
                textDecoration: resendCooldown > 0 ? 'none' : 'underline',
              }}
            >
              {resendStatus === 'sending' ? 'Sending...' : resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend'}
            </button>

            {errorMsg && (
              <span role="alert" style={{
                color: 'var(--color-error)',
                fontFamily: 'var(--typography-label-small-fontfamily)',
                fontSize: 'var(--typography-label-small-fontsize)',
                marginLeft: '4px',
              }}>
                {errorMsg}
              </span>
            )}
          </form>
        </>
      )}
    </div>
  );
}
