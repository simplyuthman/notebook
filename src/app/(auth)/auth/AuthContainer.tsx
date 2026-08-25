'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import SignInForm from './SignInForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function AuthContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const viewParam = searchParams.get('view');
  const [view, setView] = useState<'signin' | 'signup' | 'forgot-password'>(
    viewParam === 'signup' ? 'signup' : viewParam === 'forgot-password' ? 'forgot-password' : 'signin'
  );

  useEffect(() => {
    if (view === 'signup') {
      document.title = 'Create Account | NotesBook';
    } else if (view === 'forgot-password') {
      document.title = 'Reset Password | NotesBook';
    } else {
      document.title = 'Sign In | NotesBook';
    }
  }, [view]);

  const handleSwitchMode = (newMode: 'signin' | 'signup' | 'forgot-password') => {
    setView(newMode);
    // Update the URL without a full page reload, maintaining history cleanly
    const params = new URLSearchParams(searchParams.toString());
    params.delete('mode'); // Remove legacy parameter if it exists
    params.set('view', newMode);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Link 
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'calc(var(--spacing-collection-small-spacing) * 1px)',
          fontFamily: 'var(--typography-label-large-fontfamily)',
          fontSize: 'var(--typography-headline-small-fontsize)',
          fontWeight: 'var(--typography-label-large-fontweight)',
          color: 'var(--color-on-surface)',
          textDecoration: 'none',
          marginBottom: 'calc(var(--spacing-collection-small-spacing) * 1px)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
          <rect width="100" height="100" rx="18" fill="#ffffff" />
          <path d="M18 30 C18 27 21 25 24 25 L48 25 L48 72 C38 70 26 68 18 72 Z" fill="#0741ff" />
          <path d="M82 30 C82 27 79 25 76 25 L52 25 L52 72 C62 70 74 68 82 72 Z" fill="#0741ff" />
          <line x1="50" y1="25" x2="50" y2="72" stroke="#ffffff" strokeWidth="2" />
          <line x1="27" y1="37" x2="44" y2="37" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="27" y1="45" x2="44" y2="45" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="27" y1="53" x2="44" y2="53" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="56" y1="37" x2="73" y2="37" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="56" y1="45" x2="73" y2="45" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="56" y1="53" x2="73" y2="53" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <g transform="translate(50, 14)">
            <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#0741ff" />
          </g>
          <circle cx="78" cy="18" r="2.5" fill="#0741ff" />
          <circle cx="22" cy="20" r="1.8" fill="#0741ff" />
        </svg>
      </Link>
      <div style={{ width: '100%' }}>
        {view === 'forgot-password' ? (
          <ForgotPasswordForm onSwitchMode={handleSwitchMode} />
        ) : view === 'signin' ? (
          <SignInForm onSwitchMode={handleSwitchMode} />
        ) : (
          <SignupForm onSwitchMode={handleSwitchMode} />
        )}
      </div>
    </div>
  );
}
