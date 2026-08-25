'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function ConfettiSplash() {
  const router = useRouter();

  useEffect(() => {
    // Only display on desktop devices — suppress on mobile and tablet screens
    const isMobileOrTablet =
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 ||
        window.matchMedia('(max-width: 1023px)').matches ||
        window.matchMedia('(pointer: coarse)').matches);

    if (!isMobileOrTablet) {
      // Fire a multi-burst confetti animation on desktop — no external fetch needed
      const duration = 4500; // ms
      const end = Date.now() + duration;

      const colors = ['#a855f7', '#6366f1', '#22d3ee', '#f59e0b', '#ec4899'];

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 65,
          origin: { x: 0 },
          colors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 65,
          origin: { x: 1 },
          colors,
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }

    // Remove the new_user query param from the URL so it doesn't replay on refresh
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [router]);

  return null; // canvas-confetti renders directly on a global canvas — no wrapper div needed
}
