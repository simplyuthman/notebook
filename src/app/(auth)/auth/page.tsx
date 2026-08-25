import { Suspense } from 'react';
import type { Metadata } from 'next';
import AuthContainer from './AuthContainer';

export const metadata: Metadata = {
  title: 'Authentication | NotesBook',
  description: 'Sign in or create your NotesBook account.',
  alternates: { canonical: '/auth' },
  openGraph: {
    title: 'Authentication | NotesBook',
    description: 'Sign in or create your NotesBook account.',
    url: '/auth',
  },
};

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>}>
      <AuthContainer />
    </Suspense>
  );
}
