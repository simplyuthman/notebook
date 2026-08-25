'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BillingModal from './BillingModal';

interface UserAvatarMenuProps {
  displayName: string;
  initials: string;
}

export default function UserAvatarMenu({ displayName, initials }: UserAvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/auth');
        router.refresh();
      } else {
        // Fallback redirection if endpoint returns redirect header
        window.location.href = '/auth';
      }
    } catch {
      window.location.href = '/auth';
    }
  };

  const menuItemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-on-surface)',
    fontFamily: 'var(--typography-body-medium-fontfamily, inherit)',
    fontSize: 'var(--typography-body-medium-fontsize, 0.875rem)',
    cursor: 'pointer',
    textDecoration: 'none',
    boxSizing: 'border-box',
    transition: 'background-color 0.15s ease',
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${displayName}'s account menu`}
        title={displayName}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-container)',
          color: 'var(--color-on-primary-container)',
          border: '1px solid var(--color-on-primary-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--typography-label-large-fontfamily)',
          fontSize: 'var(--typography-label-large-fontsize)',
          fontWeight: '600',
          flexShrink: 0,
          cursor: 'pointer',
          padding: 0,
          outline: 'none',
          transition: 'box-shadow 0.2s ease, transform 0.1s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {initials}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-avatar-button"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            minWidth: '200px',
            backgroundColor: 'var(--color-on-primary, #ffffff)',
            borderRadius: 'calc(var(--spacing-collection-small-spacing, 8) * 1px)',
            border: '1px solid var(--color-outline, #e6e6e6)',
            boxShadow: 'var(--effect-medium-shadow, 0 4px 12px rgba(0,0,0,0.15))',
            padding: '6px 0',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-outline, #e6e6e6)',
              marginBottom: '4px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--typography-label-large-fontfamily)',
                fontSize: 'var(--typography-label-large-fontsize)',
                fontWeight: '600',
                color: 'var(--color-on-surface)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={menuItemStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-variant, #e6e6e6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            My Profile
          </button>

          <button
            type="button"
            id="avatar-menu-billing"
            role="menuitem"
            onClick={() => { setIsOpen(false); setBillingOpen(true); }}
            style={menuItemStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-variant, #e6e6e6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Billing
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={menuItemStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-variant, #e6e6e6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Settings
          </button>

          <div
            style={{
              borderTop: '1px solid var(--color-outline, #e6e6e6)',
              marginTop: '4px',
              paddingTop: '4px',
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              style={{
                ...menuItemStyle,
                color: 'var(--color-error, #b3261e)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-error-container, #ffebee)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <BillingModal isOpen={billingOpen} onClose={() => setBillingOpen(false)} />
    </div>
  );
}
