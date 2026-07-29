import React from 'react';

export interface ERPKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  footer?: string;
  footerStatus?: 'positive' | 'negative' | 'neutral' | 'warning';
  badgeText?: string;
  badgeVariant?: 'active' | 'good' | 'today' | 'not_set' | 'warning' | 'danger' | 'info';
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export const ERPKpiCard: React.FC<ERPKpiCardProps> = ({
  title,
  value,
  subtitle,
  footer,
  footerStatus = 'neutral',
  badgeText,
  badgeVariant = 'today',
  icon,
  iconBg = '#F3F4F6',
  iconColor = '#4B5563',
  onClick,
  isSelected = false
}) => {
  // Badge Color Styles
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'active': return { bg: '#EFF6FF', text: '#1D4ED8' };
      case 'good': return { bg: '#ECFDF5', text: '#047857' };
      case 'today': return { bg: '#F3F4F6', text: '#4B5563' };
      case 'warning': return { bg: '#FEF3C7', text: '#B45309' };
      case 'danger': return { bg: '#FEE2E2', text: '#B91C1C' };
      case 'info': return { bg: '#E0F2FE', text: '#0369A1' };
      case 'not_set': default: return { bg: '#F3F4F6', text: '#9CA3AF' };
    }
  };

  const badgeStyle = getBadgeStyle();

  // Footer Color Styles
  const getFooterColor = () => {
    switch (footerStatus) {
      case 'positive': return '#059669'; // Green
      case 'negative': return '#DC2626'; // Red
      case 'warning': return '#D97706'; // Amber / Orange
      case 'neutral': default: return '#6B7280'; // Gray
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: `1.5px solid ${isSelected ? 'var(--primary-color, #2563EB)' : '#E5E7EB'}`,
        padding: '14px 16px',
        boxShadow: isSelected 
          ? '0 6px 16px -2px rgba(37, 99, 235, 0.15)' 
          : '0 2px 4px rgba(0, 0, 0, 0.02)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 18px -3px rgba(0, 0, 0, 0.08)';
          if (!isSelected) e.currentTarget.style.borderColor = '#CBD5E1';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isSelected 
            ? '0 6px 16px -2px rgba(37, 99, 235, 0.15)' 
            : '0 2px 4px rgba(0, 0, 0, 0.02)';
          if (!isSelected) e.currentTarget.style.borderColor = '#E5E7EB';
        }
      }}
    >
      {/* 1. Header Row (Icon + Title + Badge) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            backgroundColor: iconBg, color: iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: '#4B5563',
            textTransform: 'uppercase', letterSpacing: '0.4px'
          }}>
            {title}
          </span>
        </div>

        {badgeText && (
          <span style={{
            padding: '2px 7px', borderRadius: '10px', fontSize: '9px', fontWeight: 800,
            backgroundColor: badgeStyle.bg, color: badgeStyle.text, textTransform: 'uppercase',
            letterSpacing: '0.3px', whiteSpace: 'nowrap'
          }}>
            {badgeText}
          </span>
        )}
      </div>

      {/* 2. KPI Value */}
      <div style={{
        fontSize: '28px', fontWeight: 800, color: '#111827',
        marginTop: '8px', lineHeight: '1.1', fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {value}
      </div>

      {/* 3. Subtitle */}
      {subtitle && (
        <div style={{
          fontSize: '12px', color: '#6B7280', fontWeight: 500,
          marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {subtitle}
        </div>
      )}

      {/* 4. Footer Information */}
      {footer && (
        <div style={{
          fontSize: '11px', fontWeight: 700, color: getFooterColor(),
          marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          {footer}
        </div>
      )}
    </div>
  );
};
