'use client';

import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface MarketingHeaderProps {
  activePage?: 'home' | 'testimonials' | 'contact';
  withBorder?: boolean;
  onNavClick?: (page: 'home' | 'testimonials' | 'contact') => void;
}

export default function MarketingHeader({ activePage = 'home', withBorder = false, onNavClick }: MarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding:
            'calc(var(--spacing-collection-large-spacing) * 1px) calc(var(--spacing-collection-extra-large-spacing) * 1px)',
        }}
      >
        {/* Left: Logo */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onNavClick) onNavClick('home');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'calc(var(--spacing-collection-small-spacing) * 1px)',
              fontFamily: 'var(--typography-label-large-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: 'var(--typography-label-large-fontweight)',
              color: 'var(--color-on-surface)',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              marginLeft: '-12px',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32">
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
            NotesBook
          </a>
        </div>

        {/* Center: Nav */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)' }}>
          <a
            href="#"
            className={`nav-link ${activePage === 'testimonials' ? 'nav-link-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              if (onNavClick) onNavClick('testimonials');
            }}
            style={{
              fontFamily: 'var(--typography-label-medium-fontfamily)',
              fontSize: 'var(--typography-label-medium-fontsize)',
              fontWeight: 'var(--typography-label-medium-fontweight)',
              color: 'var(--color-on-surface-variant)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            Testimonials
          </a>
          <a
            href="#"
            className={`nav-link ${activePage === 'contact' ? 'nav-link-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              if (onNavClick) onNavClick('contact');
            }}
            style={{
              fontFamily: 'var(--typography-label-medium-fontfamily)',
              fontSize: 'var(--typography-label-medium-fontsize)',
              fontWeight: 'var(--typography-label-medium-fontweight)',
              color: 'var(--color-on-surface-variant)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            Contact
          </a>
        </nav>

        {/* Right: Theme, CTA & Hamburger */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 'calc(var(--spacing-collection-small-spacing) * 1px)',
          }}
        >
          <ThemeToggle />
          <div className="desktop-nav">
            <Link 
              href="/auth?view=signin"
              className="header-cta"
              style={{
                display: 'inline-block',
                color: 'var(--color-primary)',
                padding:
                  'calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-large-spacing) * 1px)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
                fontFamily: 'var(--typography-label-medium-fontfamily)',
                fontSize: 'var(--typography-label-medium-fontsize)',
                fontWeight: 'var(--typography-label-medium-fontweight)',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ color: 'var(--color-on-surface)' }}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="mobile-nav-container"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            height: 'calc(100vh - 100%)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'calc(var(--spacing-collection-large-spacing) * 1px)',
            gap: 'calc(var(--spacing-collection-large-spacing) * 1px)',
            boxShadow: 'var(--effect-medium-shadow)',
          }}
        >
          <a
            href="#"
            className={`nav-link ${activePage === 'testimonials' ? 'nav-link-active' : ''}`}
            style={{
              fontFamily: 'var(--typography-label-medium-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: 'var(--typography-label-medium-fontweight)',
              color: 'var(--color-on-surface-variant)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              if (onNavClick) onNavClick('testimonials');
            }}
          >
            Testimonials
          </a>
          <a
            href="#"
            className={`nav-link ${activePage === 'contact' ? 'nav-link-active' : ''}`}
            style={{
              fontFamily: 'var(--typography-label-medium-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: 'var(--typography-label-medium-fontweight)',
              color: 'var(--color-on-surface-variant)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              if (onNavClick) onNavClick('contact');
            }}
          >
            Contact
          </a>
          <Link 
            href="/auth?view=signin" 
            className="header-cta"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              display: 'block',
              textAlign: 'center',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
              border: 'none',
              borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
              fontFamily: 'var(--typography-label-large-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: 'var(--typography-label-large-fontweight)',
              cursor: 'pointer',
              width: '100%',
              boxSizing: 'border-box',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
}
