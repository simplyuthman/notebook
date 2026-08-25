'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ForgotPasswordForm from '../auth/ForgotPasswordForm';

function ResetPasswordWrapper() {
  const router = useRouter();

  useEffect(() => {
    document.title = 'Reset Password | NotesBook';
  }, []);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '420px', gap: 'calc(var(--spacing-collection-small-spacing) * 1px)' }}>
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--spacing-collection-small-spacing) * 1px)', textDecoration: 'none', marginBottom: 'calc(var(--spacing-collection-small-spacing) * 1px)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
            <rect width="100" height="100" rx="18" fill="#ffffff" />
            <path d="M18 30 C18 27 21 25 24 25 L48 25 L48 72 C38 70 26 68 18 72 Z" fill="#0741ff" />
            <path d="M82 30 C82 27 79 25 76 25 L52 25 L52 72 C62 70 74 68 82 72 Z" fill="#0741ff" />
            <line x1="50" y1="25" x2="50" y2="72" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </Link>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <ForgotPasswordForm onSwitchMode={() => router.push('/auth?view=signin')} />
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ResetPasswordWrapper />
    </Suspense>
  );
}
