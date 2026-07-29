import React from 'react';
import { createPortal } from 'react-dom';
import { useVisitor } from '../../context/VisitorContext';
import { Button } from './Button';
import { Check, X } from 'lucide-react';

interface AuditTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string | null;
}

export const AuditTimelineModal: React.FC<AuditTimelineModalProps> = ({ isOpen, onClose, visitorId }) => {
  const { visitors, auditLogs } = useVisitor();

  if (!isOpen || !visitorId) return null;

  const visitor = visitors.find(v => v.id === visitorId);
  if (!visitor) return null;

  // Audit logs for actor lookup
  const visitorLogs = auditLogs
    .filter(log => log.visitorId === visitorId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const approvalLog = visitorLogs.find(l => l.action.includes('APPROVED'));
  const entryLog = visitorLogs.find(l => l.action.includes('INSIDE'));
  const meetingLog = visitorLogs.find(l => l.action.includes('READY_FOR_EXIT') || l.action.includes('Completed'));
  const exitLog = visitorLogs.find(l => l.action.includes('COMPLETED'));

  const formatTime = (iso?: string) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const calculateDurationStr = (startIso?: string, endIso?: string) => {
    if (!startIso) return 'N/A';
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : new Date().getTime();
    const diffMins = Math.max(0, Math.floor((end - start) / 60000));
    if (diffMins < 60) return `${diffMins} Min`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs} Hr ${mins} Min`;
  };

  // Milestone steps calculation
  const isRegistered = true;
  const isApproved = visitor.status !== 'PENDING_APPROVAL' && visitor.status !== 'REJECTED';
  const isEntered = !!visitor.entryTime || visitor.status === 'INSIDE' || visitor.status === 'READY_FOR_EXIT' || visitor.status === 'COMPLETED';
  const isMeetingDone = visitor.meetingCompleted || !!visitor.meetingCompletedTime || visitor.status === 'READY_FOR_EXIT' || visitor.status === 'COMPLETED';
  const isCheckedOut = visitor.status === 'COMPLETED' || !!visitor.exitTime;

  const milestones = [
    { label: 'Registered', isDone: isRegistered },
    { label: 'Approved', isDone: isApproved },
    { label: 'Entered', isDone: isEntered },
    { label: 'Meeting Done', isDone: isMeetingDone },
    { label: 'Checked Out', isDone: isCheckedOut },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'INSIDE': return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
      case 'READY_FOR_EXIT': return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'REJECTED': return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
  };

  const statusStyle = getStatusColor(visitor.status);

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      padding: '24px 16px', overflowY: 'auto'
    }}>

      {/* ─── A5 GATE PASS CARD ─────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: '660px', maxHeight: 'calc(100vh - 48px)', backgroundColor: '#FCFCFA',
        borderRadius: '14px', border: '1px solid #E2E8F0',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.35)',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        margin: 'auto'
      }}>

        {/* Side Ticket Notches */}
        <div style={{
          position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)',
          width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 5
        }} />
        <div style={{
          position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)',
          width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 5
        }} />

        {/* Header */}
        <div style={{
          padding: '10px 18px', backgroundColor: '#FFFFFF',
          borderBottom: '2px dashed #E2E8F0', flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              VISITOR GATE PASS
            </h1>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
              Enterprise Gate Entry & Exit Pass
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
              letterSpacing: '0.4px', textTransform: 'uppercase',
              backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`
            }}>
              {visitor.status.replace('_', ' ')}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '3px', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Pass Content Body */}
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>

          {/* Section 1: Visitor Information (2-Column Grid) */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Visitor & Host Details
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px',
              padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9'
            }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Visitor Name:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{visitor.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Mobile Number:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontFamily: 'monospace', fontWeight: 700 }}>{visitor.mobile}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Company Name:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{visitor.company || 'Personal Visit'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Visitor Type:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{visitor.visitorType || (visitor.isPreRegistered ? 'Pre-Registered' : 'Walk-In')}</strong>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Department:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{visitor.department || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Host Employee:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{visitor.employeeToMeet}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Purpose of Visit:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{visitor.purpose || 'General Visit'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Registration Date:</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{formatDate(visitor.registrationTime)}</strong>
                </div>
                {visitor.vehicleNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Vehicle Number:</span>
                    <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>{visitor.vehicleNumber}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #E2E8F0' }} />

          {/* Section 2: Visit Timings (4 Compact Cards) */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Visit Timings
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div style={{ padding: '8px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '1px' }}>Check In</span>
                <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 800 }}>{formatTime(visitor.entryTime)}</strong>
              </div>

              <div style={{ padding: '8px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '1px' }}>Check Out</span>
                <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 800 }}>{formatTime(visitor.exitTime)}</strong>
              </div>

              <div style={{ padding: '8px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '1px' }}>Meeting Duration</span>
                <strong style={{ fontSize: '13px', color: '#059669', fontWeight: 800 }}>
                  {calculateDurationStr(visitor.entryTime, visitor.meetingCompletedTime || visitor.exitTime)}
                </strong>
              </div>

              <div style={{ padding: '8px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '1px' }}>Total Duration</span>
                <strong style={{ fontSize: '13px', color: '#2563EB', fontWeight: 800 }}>
                  {visitor.totalVisitDuration || calculateDurationStr(visitor.entryTime, visitor.exitTime)}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #E2E8F0' }} />

          {/* Section 3: Visit Status (Clean Milestone Progress) */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Visit Milestone Lifecycle
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9'
            }}>
              {milestones.map((m, idx) => (
                <React.Fragment key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      backgroundColor: m.isDone ? '#10B981' : '#E2E8F0',
                      color: m.isDone ? '#FFFFFF' : '#94A3B8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: m.isDone ? 700 : 500, color: m.isDone ? '#0F172A' : '#94A3B8' }}>
                      {m.label}
                    </span>
                  </div>
                  {idx < milestones.length - 1 && (
                    <div style={{ flex: 1, height: '2px', backgroundColor: m.isDone && milestones[idx + 1].isDone ? '#10B981' : '#E2E8F0', margin: '0 4px' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #E2E8F0' }} />

          {/* Section 4: Security Information */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Security & Approvals
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 14px',
              padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Approved By</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                  {approvalLog?.actor || (visitor.status !== 'PENDING_APPROVAL' ? visitor.employeeToMeet : 'N/A')}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Checked In By</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                  {entryLog?.actor || (visitor.entryTime ? 'Main Gate Security' : 'N/A')}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Meeting Done By</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                  {meetingLog?.actor || (visitor.meetingCompleted ? visitor.employeeToMeet : 'N/A')}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Checked Out By</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                  {visitor.checkedOutBy || exitLog?.actor || (visitor.exitTime ? 'Main Gate Security' : 'N/A')}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>Gate Name</span>
                <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                  {visitor.gateId || 'Main Gate 01'}
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* Card Footer — Single Centered Close Button */}
        <div style={{
          padding: '8px 18px', backgroundColor: '#FFFFFF',
          borderTop: '2px dashed #E2E8F0', display: 'flex', justifyContent: 'center', flexShrink: 0
        }}>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            style={{ width: '140px', borderRadius: '6px', fontWeight: 700, fontSize: '12px' }}
          >
            Close
          </Button>
        </div>

      </div>

    </div>,
    document.body
  );
};
