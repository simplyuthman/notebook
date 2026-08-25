import type { Metadata } from 'next';
import MarketingPageClient from './MarketingPageClient';
export const metadata: Metadata = {
  // Absolute bypasses the root template — the full brand tagline stands alone
  title: {
    absolute: 'NotesBook — Turn Handwritten Notes Into a Digital Book',
  },
  description:
    'NotesBook uses AI to turn photos of your handwritten notes into a clean, structured, editable digital book. Built for Nigerian students and self-learners across Africa.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'NotesBook — Turn Handwritten Notes Into a Digital Book',
    description:
      'Upload photos of your notes. Get back a clean, editable book grouped by topic — built for students in Nigeria and across Africa.',
    url: '/',
  },
};

export default function MarketingPage() {
  return <MarketingPageClient />;
}
