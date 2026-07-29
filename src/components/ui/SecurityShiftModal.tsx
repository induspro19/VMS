import React, { useState, useEffect } from 'react';
import { useSecurityShift, type ShiftType } from '../../context/SecurityShiftContext';
import { Button } from './Button';
import { ShieldCheck, User, Sun, Moon, Sunrise, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SecurityShiftModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isUnskippable?: boolean;
}

export const SecurityShiftModal: React.FC<SecurityShiftModalProps> = ({
  isOpen,
  onClose,
  isUnskippable = false
}) => {
  const { activeShift, officers, startShift } = useSecurityShift();

  const activeOfficers = officers.filter(o => o.isActive);

  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [customOfficerName, setCustomOfficerName] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [shift, setShift] = useState<ShiftType>('Morning');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (activeShift) {
      const exists = activeOfficers.some(o => o.name === activeShift.officerName);
      if (exists) {
        setSelectedOfficer(activeShift.officerName);
        setIsCustomMode(false);
      } else {
        setIsCustomMode(true);
        setCustomOfficerName(activeShift.officerName);
      }
      setShift(activeShift.shift);
    } else if (activeOfficers.length > 0) {
      setSelectedOfficer(activeOfficers[0].name);
    }
  }, [activeShift, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalName = isCustomMode ? customOfficerName.trim() : selectedOfficer.trim();

    if (!finalName) {
      setError('Please select or enter a Security Officer Name.');
      return;
    }

    startShift(finalName, shift);
    if (onClose) onClose();
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF',
        borderRadius: '16px', border: '1px solid #E2E8F0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', backgroundColor: '#0F172A', color: '#FFFFFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="#38BDF8" />
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                SECURITY SHIFT LOGIN
              </h2>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Select On-Duty Security Officer</span>
            </div>
          </div>
          {!isUnskippable && onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Officer Name Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
              Security Officer Name *
            </label>

            {!isCustomMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedOfficer}
                    onChange={e => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomMode(true);
                        setCustomOfficerName('');
                      } else {
                        setSelectedOfficer(e.target.value);
                      }
                    }}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                      border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 600,
                      color: '#0F172A', backgroundColor: '#F8FAFC', outline: 'none'
                    }}
                  >
                    {activeOfficers.map(o => (
                      <option key={o.id} value={o.name}>{o.name} {o.badgeNumber ? `(${o.badgeNumber})` : ''}</option>
                    ))}
                    <option value="__NEW__">➕ + Enter New Officer Name</option>
                  </select>
                  <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter new officer name (e.g. Amit Singh)"
                    value={customOfficerName}
                    onChange={e => setCustomOfficerName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                      border: '1px solid #2563EB', fontSize: '14px', fontWeight: 600,
                      color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none'
                    }}
                  />
                  <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#2563EB' }} />
                </div>
                {activeOfficers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    ← Select from Existing Officers List
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Shift Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
              Shift Selection *
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShift('Morning')}
                style={{
                  padding: '12px 8px', borderRadius: '10px', border: `2px solid ${shift === 'Morning' ? '#D97706' : '#E2E8F0'}`,
                  backgroundColor: shift === 'Morning' ? '#FEF3C7' : '#F8FAFC',
                  color: shift === 'Morning' ? '#B45309' : '#64748B',
                  fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                }}
              >
                <Sunrise size={18} />
                Morning
              </button>

              <button
                type="button"
                onClick={() => setShift('Evening')}
                style={{
                  padding: '12px 8px', borderRadius: '10px', border: `2px solid ${shift === 'Evening' ? '#2563EB' : '#E2E8F0'}`,
                  backgroundColor: shift === 'Evening' ? '#DBEAFE' : '#F8FAFC',
                  color: shift === 'Evening' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                }}
              >
                <Sun size={18} />
                Evening
              </button>

              <button
                type="button"
                onClick={() => setShift('Night')}
                style={{
                  padding: '12px 8px', borderRadius: '10px', border: `2px solid ${shift === 'Night' ? '#4F46E5' : '#E2E8F0'}`,
                  backgroundColor: shift === 'Night' ? '#EEF2FF' : '#F8FAFC',
                  color: shift === 'Night' ? '#3730A3' : '#64748B',
                  fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                }}
              >
                <Moon size={18} />
                Night
              </button>
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '8px' }}>
            <Button
              variant="primary"
              type="submit"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}
            >
              Start Shift
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
