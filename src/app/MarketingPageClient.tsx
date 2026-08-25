'use client';

import { useState, useEffect } from 'react';
import MarketingHeader from '../components/MarketingHeader';
import Link from 'next/link';

const testimonials = [
  {
    id: 1,
    quote:
      'I used to spend hours rewriting notes before exams. NotesBook does it for me in minutes.',
    name: 'Amara O.',
    role: 'University of Lagos, 300 Level',
  },
  {
    id: 2,
    quote:
      'The AI grouped my biochemistry notes by topic automatically. My study sessions are so much better.',
    name: 'Chidi N.',
    role: 'UNIABUJA, Medical Student',
  },
  {
    id: 3,
    quote:
      'I self-study from textbooks and take lots of notes. NotesBook turns them into a proper reference manual.',
    name: 'Fatima B.',
    role: 'Self-learner, Kano',
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

const QuoteIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color: 'var(--color-primary)' }}
    aria-hidden="true"
  >
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

const Stars = () => (
  <div
    role="img"
    aria-label="Rated 5 out of 5"
    style={{ display: 'flex', gap: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)' }}
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <svg
        key={i}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="var(--color-primary)"
        aria-hidden="true"
      >
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ))}
  </div>
);

export default function MarketingPageClient() {
  const [activePage, setActivePage] = useState<'home' | 'testimonials' | 'contact'>('home');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (activePage === 'home') {
      document.title = 'NotesBook — Turn Handwritten Notes Into a Digital Book';
    } else if (activePage === 'testimonials') {
      document.title = 'Testimonials | NotesBook';
    } else if (activePage === 'contact') {
      document.title = 'Contact | NotesBook';
    }
  }, [activePage]);

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-on-surface)',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <MarketingHeader
        activePage={activePage}
        withBorder={activePage !== 'home'}
        onNavClick={(page) => setActivePage(page)}
      />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
            textAlign: 'center',
            overflowY: activePage === 'contact' ? 'hidden' : 'auto',
            ...(activePage === 'testimonials' ? { gap: 'calc(var(--spacing-collection-very-large-spacing) * 1px)' } : {}),
          }}
        >
        {activePage === 'home' && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              flex: 1,
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Background Lines Graphic */}
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5 }}
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <path d="M 0 300 Q 250 300, 500 450 T 1000 300" stroke="var(--color-outline)" strokeWidth="1" />
              <circle cx="150" cy="300" r="6" fill="var(--color-surface-container-low)" stroke="var(--color-outline)" strokeWidth="2" />
              <circle cx="850" cy="300" r="6" fill="var(--color-surface-container-low)" stroke="var(--color-outline)" strokeWidth="2" />
              <circle cx="280" cy="335" r="4" fill="var(--color-surface-container-low)" stroke="var(--color-outline)" strokeWidth="1.5" />
              <circle cx="720" cy="335" r="4" fill="var(--color-surface-container-low)" stroke="var(--color-outline)" strokeWidth="1.5" />
            </svg>

            {/* Content */}
            <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '800px', padding: '0 calc(var(--spacing-collection-large-spacing) * 1px)' }}>
              
              {/* Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '24px',
                  padding: '4px 16px 4px 4px',
                  border: '1px solid var(--color-outline)',
                  marginBottom: 'calc(var(--spacing-collection-large-spacing) * 1px)',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#dcfce7', // Using a soft green as it's not a semantic role but a specific badge color in the design, or we can use primary-container
                    color: '#166534',
                    borderRadius: '20px',
                    padding: '2px 10px',
                    fontFamily: 'var(--typography-label-medium-fontfamily)',
                    fontSize: 'var(--typography-label-medium-fontsize)',
                    fontWeight: '700',
                    marginRight: '12px',
                  }}
                >
                  Student
                </span>
                <span
                  style={{
                    fontFamily: 'var(--typography-label-medium-fontfamily)',
                    fontSize: 'var(--typography-label-medium-fontsize)',
                    color: 'var(--color-on-surface-variant)',
                    fontWeight: '600'
                  }}
                >
                  Note Converting app
                </span>
              </div>

              {/* Title */}
              <h1
                style={{
                  fontFamily: 'var(--typography-display-large-fontfamily)',
                  fontSize: 'var(--typography-display-large-fontsize)',
                  fontWeight: '600',
                  lineHeight: '1.1',
                  letterSpacing: 'var(--typography-display-large-letterspacing)',
                  color: 'var(--color-on-surface)',
                  margin: '0 0 calc(var(--spacing-collection-base-spacing) * 1px) 0',
                  textAlign: 'center',
                }}
              >
                Transform Your Handwritten Notes Into a Digital Book.
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontFamily: 'var(--typography-body-large-fontfamily)',
                  fontSize: 'var(--typography-body-large-fontsize)',
                  lineHeight: 'var(--typography-body-large-lineheight)',
                  color: 'var(--color-on-surface-variant)',
                  margin: '0 0 calc(var(--spacing-collection-very-large-spacing) * 1px) 0',
                  textAlign: 'center',
                  maxWidth: '600px',
                }}
              >
                Streamline Your Processes And Enhance Productivity With Our Cutting-Edge Solution.
              </p>

              {/* Button */}
              <Link
                href="/auth?view=signup"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  padding: 'calc(var(--spacing-collection-medium-spacing) * 1.5px) calc(var(--spacing-collection-extra-large-spacing) * 1px)',
                  borderRadius: '8px',
                  fontFamily: 'var(--typography-label-large-fontfamily)',
                  fontSize: 'var(--typography-label-large-fontsize)',
                  fontWeight: '700',
                  textDecoration: 'none',
                  boxShadow: 'var(--effect-soft-shadow)',
                  cursor: 'pointer',
                }}
              >
                Get Started For Free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {activePage === 'testimonials' && (
          <>
            <h1
              style={{
                fontFamily: 'var(--typography-headline-large-fontfamily)',
                fontSize: 'var(--typography-headline-large-fontsize)',
                fontWeight: 'var(--typography-headline-large-fontweight)',
                fontStyle: 'var(--typography-headline-large-fontstyle)',
                lineHeight: 'var(--typography-headline-large-lineheight)',
                letterSpacing: 'var(--typography-headline-large-letterspacing)',
                textDecoration: 'var(--typography-headline-large-textdecoration)',
                marginTop: 0,
                marginBottom: 0
              }}
            >
              What students are saying
            </h1>
            <p
              style={{
                fontFamily: 'var(--typography-body-large-fontfamily)',
                fontSize: 'var(--typography-body-large-fontsize)',
                fontWeight: 'var(--typography-body-large-fontweight)',
                lineHeight: 'var(--typography-body-small-lineheight)',
                letterSpacing: 'var(--typography-body-large-letterspacing)',
                textDecoration: 'var(--typography-body-large-textdecoration)',
                color: 'var(--color-on-surface-variant)',
                margin: '0 0 calc(var(--spacing-collection-small-spacing) * 0.2px) 0',
                textAlign: 'center',
                maxWidth: '36rem',
              }}
            >
              Real students and self-learners turning handwritten notes into structured books.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 'calc(var(--spacing-collection-large-spacing) * 1px)',
                width: '100%',
                maxWidth: '1000px',
                alignItems: 'stretch',
              }}
            >
              {testimonials.map((t) => (
                <blockquote
                  key={t.id}
                  style={{
                    margin: 0,
                    padding: 'calc(var(--spacing-collection-large-spacing) * 1px)',
                    backgroundColor: 'var(--color-surface-container-low)',
                    border: '1px solid var(--color-outline)',
                    borderRadius: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'calc(var(--spacing-collection-base-spacing) * 1px)',
                    textAlign: 'left',
                    height: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                    }}
                  >
                    <QuoteIcon />
                    <Stars />
                  </div>

                  <p
                    style={{
                      fontFamily: 'var(--typography-body-large-fontfamily)',
                      fontSize: 'var(--typography-body-large-fontsize)',
                      fontWeight: 'var(--typography-body-large-fontweight)',
                      lineHeight: 'var(--typography-body-large-lineheight)',
                      letterSpacing: 'var(--typography-body-large-letterspacing)',
                      textDecoration: 'var(--typography-body-large-textdecoration)',
                      color: 'var(--color-on-surface)',
                      margin: 0,
                      flexGrow: 1,
                    }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <footer
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                      borderTop: '1px solid var(--color-outline)',
                      paddingTop: 'calc(var(--spacing-collection-base-spacing) * 1px)',
                    }}
                  >
                    <div
                      role="img"
                      aria-label={`${t.name}'s avatar`}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-container)',
                        color: 'var(--color-on-primary-container)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--typography-label-large-fontfamily)',
                        fontSize: 'var(--typography-label-large-fontsize)',
                        fontWeight: '600',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(t.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontFamily: 'var(--typography-title-medium-fontfamily)',
                          fontSize: 'var(--typography-title-medium-fontsize)',
                          fontWeight: '600',
                          lineHeight: 'var(--typography-title-medium-lineheight)',
                          letterSpacing: 'var(--typography-title-medium-letterspacing)',
                          color: 'var(--color-on-surface)',
                        }}
                      >
                        {t.name}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontFamily: 'var(--typography-body-small-fontfamily)',
                          fontSize: 'var(--typography-body-small-fontsize)',
                          fontWeight: 'var(--typography-body-small-fontweight)',
                          lineHeight: 'var(--typography-body-small-lineheight)',
                          letterSpacing: 'var(--typography-body-small-letterspacing)',
                          color: 'var(--color-on-surface-variant)',
                        }}
                      >
                        {t.role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </>
        )}

        {activePage === 'contact' && (
          submitted ? (
            <p
              style={{
                fontFamily: 'var(--typography-body-large-fontfamily)',
                fontSize: 'var(--typography-body-large-fontsize)',
                fontWeight: 'var(--typography-body-large-fontweight)',
                lineHeight: 'var(--typography-body-large-lineheight)',
                color: 'var(--color-on-surface-variant)',
                textAlign: 'center',
              }}
            >
              Thanks — we&apos;ll be in touch.
            </p>
          ) : (
            <div className="contact-form" style={{ width: '100%', maxWidth: '28rem', margin: 'auto' }}>
              <h1
                style={{
                  fontFamily: 'var(--typography-headline-large-fontfamily)',
                  fontSize: 'var(--typography-headline-medium-fontsize)',
                  fontWeight: 'var(--typography-headline-large-fontweight)',
                  fontStyle: 'var(--typography-headline-large-fontstyle)',
                  letterSpacing: 'var(--typography-headline-large-letterspacing)',
                  textDecoration: 'var(--typography-headline-large-textdecoration)',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Get in touch
              </h1>
              <p
                style={{
                  fontFamily: 'var(--typography-body-large-fontfamily)',
                  fontSize: 'var(--typography-body-large-fontsize)',
                  fontWeight: 'var(--typography-body-large-fontweight)',
                  letterSpacing: 'var(--typography-body-large-letterspacing)',
                  textDecoration: 'var(--typography-body-large-textdecoration)',
                  color: 'var(--color-on-surface-variant)',
                  textAlign: 'center',
                }}
              >
                Have a question or feedback? Send us a message and we&apos;ll get back to you.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--color-on-primary-low)',
                  padding: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
                }}
              >
                <form
                  onSubmit={handleContactSubmit}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'calc(var(--spacing-collection-base-spacing) * 1px)',
                  }}
                >
                  <div>
                    <label
                      htmlFor="contact-email"
                      style={{
                        display: 'block',
                        fontFamily: 'var(--typography-label-medium-fontfamily)',
                        fontSize: 'var(--typography-label-medium-fontsize)',
                        fontWeight: 'var(--typography-label-medium-fontweight)',
                        lineHeight: 'var(--typography-label-medium-lineheight)',
                        letterSpacing: 'var(--typography-label-medium-letterspacing)',
                        marginBottom: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
                        color: 'var(--color-on-surface-variant)',
                        textAlign: 'left',
                      }}
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                        borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
                        border: '1px solid var(--color-outline)',
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        color: 'var(--color-on-surface)',
                        fontFamily: 'var(--typography-body-large-fontfamily)',
                        fontSize: 'var(--typography-body-large-fontsize)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      style={{
                        display: 'block',
                        fontFamily: 'var(--typography-label-medium-fontfamily)',
                        fontSize: 'var(--typography-label-medium-fontsize)',
                        fontWeight: 'var(--typography-label-medium-fontweight)',
                        lineHeight: 'var(--typography-label-medium-lineheight)',
                        letterSpacing: 'var(--typography-label-medium-letterspacing)',
                        marginBottom: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
                        color: 'var(--color-on-surface-variant)',
                        textAlign: 'left',
                      }}
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                        borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
                        border: '1px solid var(--color-outline)',
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        color: 'var(--color-on-surface)',
                        fontFamily: 'var(--typography-body-large-fontfamily)',
                        fontSize: 'var(--typography-body-large-fontsize)',
                        resize: 'both',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="primary-action-btn"
                    style={{
                      width: '100%',
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
                      marginTop: 'calc(var(--spacing-collection-small-spacing) * 1px)',
                    }}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
