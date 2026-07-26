import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisitor } from '../../context/VisitorContext';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, Clock, LogIn, LogOut, AlertOctagon, Activity, QrCode, UserPlus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { AuditTimelineModal } from '../../components/ui/AuditTimelineModal';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

export const SecurityDashboard: React.FC = () => {
  const { visitors, updateStatus, auditLogs } = useVisitor();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    visitorId: string | null; 
    action: 'ENTRY' | 'EXIT' | 'FORCE_EXIT' | null 
  }>({
    isOpen: false, visitorId: null, action: null
  });

  const [overrideReason, setOverrideReason] = useState<string>('');
  const [timelineVisitorId, setTimelineVisitorId] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todaysLogs = useMemo(() => {
    const today = new Date().toDateString();
    return auditLogs.filter(log => new Date(log.timestamp).toDateString() === today).slice(0, 50);
  }, [auditLogs]);

  const getShift = () => {
    const h = time.getHours();
    if (h >= 6 && h < 14) return 'Morning Shift (06:00 - 14:00)';
    if (h >= 14 && h < 22) return 'Evening Shift (14:00 - 22:00)';
    return 'Night Shift (22:00 - 06:00)';
  };

  const todaysVisitors = useMemo(() => {
    const today = new Date().toDateString();
    return visitors.filter(v => new Date(v.registrationTime).toDateString() === today);
  }, [visitors]);

  const activeVisitors = useMemo(() => todaysVisitors.filter(v => v.status !== 'COMPLETED'), [todaysVisitors]);
  const waitingEntry = useMemo(() => todaysVisitors.filter(v => v.status === 'APPROVED'), [todaysVisitors]);
  const inside = useMemo(() => todaysVisitors.filter(v => v.status === 'INSIDE'), [todaysVisitors]);
  const readyForExit = useMemo(() => todaysVisitors.filter(v => v.status === 'INSIDE' && v.meetingCompleted), [todaysVisitors]);
  const expectedVisitors = useMemo(() => todaysVisitors.filter(v => v.isPreRegistered && v.status === 'APPROVED'), [todaysVisitors]);
  const checkedOut = useMemo(() => todaysVisitors.filter(v => v.status === 'COMPLETED'), [todaysVisitors]);

  const { settings } = useSettings();
  const overdueVisitors = useMemo(() => inside.filter(v => {
    if (!v.entryTime) return false;
    const hoursInside = (new Date().getTime() - new Date(v.entryTime).getTime()) / (1000 * 60 * 60);
    return hoursInside > settings.meetingDurationMaxHours;
  }), [inside, settings.meetingDurationMaxHours]);

  const totalInside = inside.length + readyForExit.length;

  const executeAction = () => {
    if (!confirmModal.visitorId || !confirmModal.action) return;
    
    if (confirmModal.action === 'ENTRY') {
      updateStatus(confirmModal.visitorId, 'INSIDE', user?.name || 'Security', { entryTime: new Date().toISOString() });
      toast('Visitor entry recorded.', 'success');
    } else if (confirmModal.action === 'EXIT') {
      updateStatus(confirmModal.visitorId, 'COMPLETED', user?.name || 'Security', { exitTime: new Date().toISOString() });
      toast('Manual checkout successful.', 'success');
    } else if (confirmModal.action === 'FORCE_EXIT') {
      if (!overrideReason) {
        toast('Override reason is mandatory.', 'error');
        return;
      }
      updateStatus(
        confirmModal.visitorId, 
        'COMPLETED', 
        user?.name || 'Security', 
        { 
          exitTime: new Date().toISOString(),
          isOverride: true,
          overrideBy: user?.name,
          overrideTime: new Date().toISOString(),
          overrideReason
        }, 
        true
      );
      toast('Force Exit recorded.', 'warning');
    }
    
    setConfirmModal({ isOpen: false, visitorId: null, action: null });
    setOverrideReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return <Badge variant="warning">Pending</Badge>;
      case 'APPROVED': return <Badge variant="info">Ready to Enter</Badge>;
      case 'INSIDE': return <Badge variant="success">Inside</Badge>;
      case 'READY_FOR_EXIT': return <Badge variant="default">Ready for Exit</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header Row (approx 60px) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary-color)' }} />
            Gate Control Command Center
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Clock size={14} /> {time.toLocaleTimeString()} • {time.toLocaleDateString()} • {getShift()}
          </div>
        </div>
      </div>

      {/* KPI Row (approx 80-90px) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.75rem', marginBottom: '1rem', flexShrink: 0 }}>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Today's Visitors</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{todaysVisitors.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Expected</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1 }}>{expectedVisitors.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Waiting Entry</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--info-color)', lineHeight: 1 }}>{waitingEntry.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Inside</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-color)', lineHeight: 1 }}>{inside.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Ready for Exit</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1 }}>{readyForExit.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Checked Out</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1 }}>{checkedOut.length}</div>
        </div>
        <div className={`ui-card ${overdueVisitors.length > 0 ? 'border-danger-color bg-danger-light' : ''}`} style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: overdueVisitors.length > 0 ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Overdue</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: overdueVisitors.length > 0 ? 'var(--danger-color)' : 'var(--text-primary)', lineHeight: 1 }}>{overdueVisitors.length}</div>
        </div>
        <div className={`ui-card ${totalInside > 0 ? 'border-danger-color bg-danger-light' : 'border-success-color bg-success-light'}`} style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('/security/emergency')}>
          <div style={{ fontSize: '12px', color: totalInside > 0 ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 500, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={14} /> Emergency (Click)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: totalInside > 0 ? 'var(--danger-color)' : 'var(--success-color)', lineHeight: 1 }}>{totalInside}</div>
        </div>
      </div>

      {/* Main Content Area (Remaining height) */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Live Visitor Operations Table */}
        <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
            Live Visitor Operations
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="ui-table" style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 1rem' }}>Visitor</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Company</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Host</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Purpose</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeVisitors.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No active visitors at the moment.
                    </td>
                  </tr>
                )}
                {activeVisitors.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.company}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.employeeToMeet}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.purpose}</td>
                    <td>{getStatusBadge(v.status)}</td>
                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button title="Timeline" onClick={() => setTimelineVisitorId(v.id)} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Clock size={16} /></button>
                      
                      {v.status === 'APPROVED' && (
                        <button title="Confirm Entry" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'ENTRY' })} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--info-color)' }}><LogIn size={16} /></button>
                      )}
                      
                      {v.status === 'INSIDE' && (
                        <button title="Force Exit" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'FORCE_EXIT' })} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}><AlertOctagon size={16} /></button>
                      )}
                      
                      {v.status === 'READY_FOR_EXIT' && (
                        <button title="Manual Checkout" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'EXIT' })} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><LogOut size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Activity Timeline */}
        <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} style={{ color: 'var(--info-color)' }} />
            Live Activity Feed
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {todaysLogs.length === 0 && <div className="text-muted text-sm text-center py-4">No activity yet.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)' }}>
              {todaysLogs.map(log => {
                let dotColor = 'var(--text-muted)';
                if (log.action.includes('Registered')) dotColor = 'var(--success-color)';
                else if (log.action.includes('APPROVED')) dotColor = 'var(--info-color)';
                else if (log.action.includes('READY_FOR_EXIT')) dotColor = 'var(--warning-color)';
                else if (log.action.includes('COMPLETED')) dotColor = 'var(--primary-color)';
                else if (log.action.includes('FORCE EXIT') || log.action.includes('Override')) dotColor = 'var(--danger-color)';

                return (
                  <div key={log.id} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-1.35rem', top: '0.25rem', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dotColor, border: '2px solid var(--bg-card)' }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{log.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {log.actor}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar (Fixed Bottom) */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexShrink: 0, padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <Button variant="primary" leftIcon={<QrCode size={16} />} onClick={() => toast('Scanner Activated', 'info')}>Scan QR Code</Button>
        <Button variant="secondary" leftIcon={<UserPlus size={16} />} onClick={() => navigate('/register')}>Walk-in Registration</Button>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" leftIcon={<RefreshCw size={16} />} onClick={() => toast('Dashboard Refreshed', 'success')}>Refresh</Button>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          setConfirmModal({ isOpen: false, visitorId: null, action: null });
          setOverrideReason('');
        }}
        onConfirm={executeAction}
        title={
          confirmModal.action === 'ENTRY' ? 'Confirm Visitor Entry' : 
          confirmModal.action === 'EXIT' ? 'Confirm Manual Exit' : 'Force Exit Override'
        }
        message={
          confirmModal.action === 'ENTRY' ? 'Are you sure you want to mark this visitor as inside the premises? This will log their entry time.' :
          confirmModal.action === 'EXIT' ? 'Are you sure you want to manually checkout this visitor? They should normally scan their QR.' :
          ''
        }
        isDestructive={confirmModal.action === 'FORCE_EXIT'}
        confirmText={confirmModal.action === 'FORCE_EXIT' ? 'Confirm Override' : 'Confirm'}
      >
        {confirmModal.action === 'FORCE_EXIT' && (
          <div className="flex flex-col gap-4">
            <p className="text-danger">
              <strong>WARNING:</strong> This visitor's meeting has not been marked as completed by the host. 
              Forcing an exit will bypass standard workflow and require an audit log reason.
            </p>
            <div className="ui-form-group">
              <select 
                className="ui-input"
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="Employee Forgot">Employee Forgot</option>
                <option value="Emergency Evacuation">Emergency Evacuation</option>
                <option value="Visitor Left Without Notification">Visitor Left Without Notification</option>
                <option value="System Issue">System Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}
      </ConfirmModal>

      <AuditTimelineModal 
        isOpen={!!timelineVisitorId}
        onClose={() => setTimelineVisitorId(null)}
        visitorId={timelineVisitorId}
      />
    </div>
  );
};
