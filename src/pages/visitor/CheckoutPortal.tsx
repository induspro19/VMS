import React from 'react';
import { Building, ShieldCheck } from 'lucide-react';
import './RegisterPortal.css';

export const CheckoutPortal: React.FC = () => {
  return (
    <div className="portal-container animate-fade-in">
      <div className="portal-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <ShieldCheck size={36} />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
          Gate Checkout Required
        </h1>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
          Visitor checkouts are managed manually at the Security Gate.
          Please proceed to the security guard station at the main exit to complete your visit checkout.
        </p>

        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
          <Building size={20} color="var(--primary-color)" />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>Enterprise Gate Security</strong>
            <div>Present yourself to the security officer for exit verification.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
