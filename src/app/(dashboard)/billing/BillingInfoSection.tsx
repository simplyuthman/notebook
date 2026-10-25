'use client';

import React, { useState } from 'react';
import { BillingCustomerInfo } from './types';

interface BillingInfoSectionProps {
  initialInfo: BillingCustomerInfo;
  onSaved?: () => Promise<void>;
}

export default function BillingInfoSection({
  initialInfo,
  onSaved,
}: BillingInfoSectionProps) {
  const [formData, setFormData] = useState<BillingCustomerInfo>(initialInfo);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/billing/info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update billing info.');

      setMsg({ type: 'success', text: 'Billing information updated successfully.' });
      if (onSaved) await onSaved();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error updating billing info.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-outline, #e6e6e6)',
    backgroundColor: 'var(--color-surface-container-lowest, #ffffff)',
    fontSize: '0.875rem',
    color: 'var(--color-on-surface, #191919)',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    marginTop: '6px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--color-on-surface, #191919)',
    marginBottom: '4px',
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
          Billing Information
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
          This information will appear on your formal subscription invoices and payment receipts.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: msg.type === 'success' ? 'var(--color-success-container)' : 'var(--color-error-container)',
            color: msg.type === 'success' ? 'var(--color-on-success-container)' : 'var(--color-on-error-container)',
            fontSize: '0.875rem',
            marginBottom: '20px',
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <label style={labelStyle}>
              Billing Full Name *
              <input
                type="text"
                name="billingName"
                value={formData.billingName}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="e.g. Chinelo Okeke"
              />
            </label>
          </div>

          <div>
            <label style={labelStyle}>
              Billing Email *
              <input
                type="email"
                name="billingEmail"
                value={formData.billingEmail}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="billing@example.com"
              />
            </label>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <label style={labelStyle}>
              Company / University / Organization (Optional)
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                style={inputStyle}
                placeholder="e.g. University of Lagos"
              />
            </label>
          </div>

          <div>
            <label style={labelStyle}>
              Tax ID / VAT / TIN (Optional)
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                style={inputStyle}
                placeholder="e.g. 12345678-0001"
              />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            Street Address
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              style={inputStyle}
              placeholder="e.g. 14 University Road, Akoka"
            />
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <label style={labelStyle}>
              City
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                style={inputStyle}
                placeholder="e.g. Yaba, Lagos"
              />
            </label>
          </div>

          <div>
            <label style={labelStyle}>
              Postal / Zip Code
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                style={inputStyle}
                placeholder="100001"
              />
            </label>
          </div>

          <div>
            <label style={labelStyle}>
              Country
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
                <option value="South Africa">South Africa</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
              </select>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--color-primary, #0741ff)',
              color: 'var(--color-on-primary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving Changes…' : 'Save Billing Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
