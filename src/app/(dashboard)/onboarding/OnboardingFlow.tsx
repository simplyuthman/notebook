'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const steps = [
  {
    type: 'marketing',
    title: 'Welcome to NotesBook',
    body: 'Turn your scattered handwritten notes into a beautifully structured, readable digital book.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'inherit' }}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        <path d="M12 7v14" />
      </svg>
    ),
  },
  {
    type: 'education',
    title: 'How it works',
    body: 'Snap photos of your notes. Our AI reads your handwriting and groups them into chapters. You export a clean PDF.',
    icons: [
      (
        <svg aria-hidden="true" focusable="false" key="upload" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      (
        <svg aria-hidden="true" focusable="false" key="ai" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
          <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
        </svg>
      ),
      (
        <svg aria-hidden="true" focusable="false" key="export" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
      ),
    ],
  },
  {
    type: 'sales',
    title: 'Choose your scale',
    body: 'Start for free with up to 3 books and 30 images a month. Need more? Upgrade to PRO for watermark-free exports and a 150-image allowance.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'inherit' }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [animPhase, setAnimPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const nextStepRef = useRef<number | null>(null);

  const changeStep = (next: number) => {
    nextStepRef.current = next;
    setAnimPhase('exit');
  };

  useEffect(() => {
    if (animPhase === 'exit') {
      const t = setTimeout(() => {
        if (nextStepRef.current !== null) {
          setCurrentStep(nextStepRef.current);
          nextStepRef.current = null;
        }
        setAnimPhase('enter');
      }, 180);
      return () => clearTimeout(t);
    }
    if (animPhase === 'enter') {
      const t = setTimeout(() => setAnimPhase('idle'), 220);
      return () => clearTimeout(t);
    }
  }, [animPhase]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      changeStep(currentStep + 1);
    } else {
      router.push('/dashboard?new_user=true');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      changeStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard?new_user=true');
  };

  const step = steps[currentStep];

  const contentStyle: React.CSSProperties = {
    transition: animPhase === 'idle' ? 'none' : 'opacity 0.18s ease, transform 0.18s ease',
    opacity: animPhase === 'exit' ? 0 : 1,
    transform:
      animPhase === 'exit'
        ? 'translateY(6px)'
        : animPhase === 'enter'
          ? 'translateY(-4px)'
          : 'translateY(0)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-on-surface)',
        padding: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface-container-lowest)',
          padding: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
          borderRadius: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
          boxShadow: 'var(--effect-soft-shadow)',
          border: '1px solid var(--color-outline)',
        }}
      >
        {/* Animated content area */}
        <div style={contentStyle}>
          {/* Icon area */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'calc(var(--spacing-collection-large-spacing) * 1px)',
              marginBottom: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
              minHeight: '80px',
            }}
          >
            {step.type === 'education' ? (
              step.icons?.map((icon, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                  backgroundColor: 'var(--color-primary-container)',
                  color: 'var(--color-on-primary-container)',
                  borderRadius: '50%',
                }}>
                  {icon}
                </div>
              ))
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'calc(var(--spacing-collection-large-spacing) * 1px)',
                backgroundColor: 'var(--color-primary-container)',
                color: 'var(--color-on-primary-container)',
                borderRadius: '50%',
              }}>
                {step.icon}
              </div>
            )}
          </div>

          <h1
            style={{
              fontFamily: 'var(--typography-headline-large-fontfamily)',
              fontSize: 'var(--typography-headline-large-fontsize)',
              fontWeight: 'var(--typography-headline-large-fontweight)',
              fontStyle: 'var(--typography-headline-large-fontstyle)',
              lineHeight: 'var(--typography-headline-large-lineheight)',
              letterSpacing: 'var(--typography-headline-large-letterspacing)',
              textDecoration: 'var(--typography-headline-large-textdecoration)',
              color: 'var(--color-on-surface)',
              marginTop: 0,
              marginBottom: 'calc(var(--spacing-collection-base-spacing) * 1px)',
              textAlign: 'center',
            }}
          >
            {step.title}
          </h1>

          <p
            style={{
              fontFamily: 'var(--typography-body-large-fontfamily)',
              fontSize: 'var(--typography-body-large-fontsize)',
              fontWeight: 'var(--typography-body-large-fontweight)',
              lineHeight: 'var(--typography-body-large-lineheight)',
              letterSpacing: 'var(--typography-body-large-letterspacing)',
              textDecoration: 'var(--typography-body-large-textdecoration)',
              color: 'var(--color-on-surface-variant)',
              marginTop: 0,
              marginBottom: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
              textAlign: 'center',
              maxWidth: '500px',
              minHeight: '80px',
            }}
          >
            {step.body}
          </p>
        </div>

        {/* Step counter + dot indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            marginBottom: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--typography-label-small-fontfamily)',
              fontSize: 'var(--typography-label-small-fontsize)',
              color: 'var(--color-on-surface-variant)',
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            Step {currentStep + 1} of {steps.length}
          </p>
          <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  width: currentStep === index ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: currentStep === index ? 'var(--color-primary)' : 'var(--color-outline)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', width: '100%', gap: 'calc(var(--spacing-collection-medium-spacing) * 1px)' }}>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                color: 'var(--color-primary)',
                padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
                fontFamily: 'var(--typography-label-large-fontfamily)',
                fontSize: 'var(--typography-label-large-fontsize)',
                fontWeight: 'var(--typography-label-large-fontweight)',
                lineHeight: 'var(--typography-label-large-lineheight)',
                letterSpacing: 'var(--typography-label-large-letterspacing)',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: currentStep > 0 ? 2 : 1,
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
              border: 'none',
              borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
              fontFamily: 'var(--typography-label-large-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: 'var(--typography-label-large-fontweight)',
              lineHeight: 'var(--typography-label-large-lineheight)',
              letterSpacing: 'var(--typography-label-large-letterspacing)',
              cursor: 'pointer',
              boxShadow: 'var(--effect-soft-shadow)',
              transition: 'opacity 0.2s ease',
            }}
          >
            {currentStep === steps.length - 1 ? 'Go to dashboard' : 'Next'}
          </button>
        </div>

        {currentStep < steps.length - 1 && (
          <button
            onClick={handleSkip}
            style={{
              width: '100%',
              marginTop: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
              backgroundColor: 'transparent',
              color: 'var(--color-secondary)',
              padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
              border: '1px solid var(--color-outline)',
              borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
              fontFamily: 'var(--typography-label-large-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: 'var(--typography-label-large-fontweight)',
              lineHeight: 'var(--typography-label-large-lineheight)',
              letterSpacing: 'var(--typography-label-large-letterspacing)',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
