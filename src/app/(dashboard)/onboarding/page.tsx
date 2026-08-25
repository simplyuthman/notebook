import type { Metadata } from 'next';
import OnboardingFlow from './OnboardingFlow';

// Private post-signup flow — no indexing
export const metadata: Metadata = {
  title: 'Welcome Aboard',
  description: 'Get started with NotesBook — upload your handwritten notes and build your first digital book.',
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
