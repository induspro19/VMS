import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UserCircle, Search, Clock, Activity, Bell, Edit, XCircle, UserPlus, RefreshCw } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { useVisitor } from '../../context/VisitorContext';
import { useNotification } from '../../context/NotificationContext';
import { useCommunication } from '../../context/CommunicationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal, Modal } from '../../components/ui/Modal';

export const ReceptionDashboard: React.FC = () => {
  const { visitors, registerVisitor, updateStatus, auditLogs } = useVisitor();
  const { sendPush } = useNotification();
  const { sendCommunication } = useCommunication();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [search, setSearch] = useState('');
  
  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({ name: '', mobile: '', company: '', department: '', employeeToMeet: '', purpose: '', expectedDurationHours: 1, remarks: '' });

  // Quick Action Modal
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; visitorId: string | null; action: 'REMIND' | 'CANCEL' | null }>({ isOpen: false, visitorId: null, action: null });

  const todaysVisitors = useMemo(() => {
    const today = new Date().toDateString();
    return visitors.filter(v => new Date(v.registrationTime).toDateString() === today);
  }, [visitors]);

  const expected = todaysVisitors.filter(v => v.isPreRegistered && v.status === 'APPROVED');
  const waiting = todaysVisitors.filter(v => v.status === 'PENDING_APPROVAL');
  const approved = todaysVisitors.filter(v => v.status === 'APPROVED' && !v.isPreRegistered);
  const walkIns = todaysVisitors.filter(v => !v.isPreRegistered);

  let totalWaitMs = 0;
  waiting.forEach(v => {
    totalWaitMs += new Date().getTime() - new Date(v.registrationTime).getTime();
  });
  const avgWaitTimeMins = waiting.length > 0 ? (totalWaitMs / waiting.length) / 60000 : 0;

  const handleRegisterWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      registerVisitor(regData);
      sendPush('New Walk-in Visitor', `${regData.name} from ${regData.company} is waiting at reception for ${regData.employeeToMeet}.`, 'INFO');
      toast('Walk-in visitor registered. Host notified.', 'success');
      setIsRegisterOpen(false);
      setRegData({ name: '', mobile: '', company: '', department: '', employeeToMeet: '', purpose: '', expectedDurationHours: 1, remarks: '' });
    } catch (error: any) {
      toast(error.message, 'error');
    }
  };

  const handleAction = () => {
    if (!confirmModal.visitorId || !confirmModal.action) return;
    const v = visitors.find(v => v.id === confirmModal.visitorId);
    if (!v) return;

    if (confirmModal.action === 'REMIND') {
      sendPush('Visitor Reminder', `${v.name} is still waiting for you at the reception.`, 'WARNING');
      sendCommunication(v.name, v.employeeToMeet, 'Push Notification', 'Host Reminder', 'Visitor is waiting');
      toast(`Reminder sent to ${v.employeeToMeet}.`, 'success');
    } else if (confirmModal.action === 'CANCEL') {
      updateStatus(v.id, 'REJECTED', user?.name || 'Reception', { overrideReason: 'Visitor Left / Cancelled by Reception' });
      toast('Visit cancelled.', 'error');
    }
    setConfirmModal({ isOpen: false, visitorId: null, action: null });
  };

  const todaysLogs = useMemo(() => {
    const today = new Date().toDateString();
    return auditLogs.filter(log => new Date(log.timestamp).toDateString() === today).slice(0, 30);
  }, [auditLogs]);

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCircle size={24} style={{ color: 'var(--primary-color)' }} />
            Reception Command Center
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Clock size={14} /> {time.toLocaleTimeString()} • {time.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1rem', flexShrink: 0 }}>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Expected Today</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1 }}>{expected.length}</div>
        </div>
        <div className={`ui-card ${waiting.length > 0 ? 'bg-danger-light border-danger-color' : ''}`} style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: waiting.length > 0 ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Waiting in Lounge</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: waiting.length > 0 ? 'var(--danger-color)' : 'var(--text-primary)', lineHeight: 1 }}>{waiting.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Walk-ins</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--info-color)', lineHeight: 1 }}>{walkIns.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Approved</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-color)', lineHeight: 1 }}>{approved.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Avg Wait Time</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{avgWaitTimeMins.toFixed(0)}m</div>
        </div>
      </div>

      {/* Main Content Area (70/30 Split) */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Waiting Lounge Table */}
        <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '14px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Waiting Lounge</span>
            <div className="ui-search-box" style={{ width: '200px', position: 'relative' }}>
              <input className="ui-input" placeholder="Search waiting..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: '32px', fontSize: '13px', paddingLeft: '32px', margin: 0 }} />
              <Search size={14} className="ui-search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="ui-table" style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 1rem' }}>Visitor</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Host</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Waiting Time</th>
                  <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {waiting.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Waiting lounge is empty.
                    </td>
                  </tr>
                )}
                {waiting.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).map(v => {
                  const waitMins = Math.floor((time.getTime() - new Date(v.registrationTime).getTime()) / 60000);
                  return (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.company} • {v.mobile}</div>
                        {v.purpose.toLowerCase().includes('vip') && <Badge variant="warning" style={{ marginTop: '0.25rem' }}>VIP</Badge>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{v.employeeToMeet}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.department}</div>
                      </td>
                      <td>
                        <span style={{ color: waitMins > 15 ? 'var(--danger-color)' : 'inherit', fontWeight: waitMins > 15 ? 700 : 400 }}>
                          {waitMins} min{waitMins !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button title="Remind Host" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'REMIND' })} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--info-color)' }}><Bell size={16} /></button>
                        <button title="Edit Details" onClick={() => navigate(`/reception/visitor/${v.id}`)} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                        <button title="Cancel Visit" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'CANCEL' })} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}><XCircle size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Activity Timeline */}
        <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} style={{ color: 'var(--primary-color)' }} />
            Reception Timeline
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {todaysLogs.length === 0 && <div className="text-muted text-sm text-center py-4">No activity yet.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)' }}>
              {todaysLogs.map(log => {
                let dotColor = 'var(--text-muted)';
                if (log.action.includes('Registered')) dotColor = 'var(--primary-color)';
                else if (log.action.includes('APPROVED')) dotColor = 'var(--info-color)';
                else if (log.action.includes('Reminder')) dotColor = 'var(--warning-color)';
                else if (log.action.includes('REJECTED')) dotColor = 'var(--danger-color)';

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
        <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={() => setIsRegisterOpen(true)}>+ New Walk-in Registration</Button>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" leftIcon={<RefreshCw size={16} />} onClick={() => toast('Dashboard Refreshed', 'success')}>Refresh</Button>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, visitorId: null, action: null })}
        onConfirm={handleAction}
        title={confirmModal.action === 'REMIND' ? 'Send Reminder' : 'Cancel Visit'}
        message={confirmModal.action === 'REMIND' ? 'Send an urgent notification to the host?' : 'Cancel this visit and mark as visitor left?'}
        isDestructive={confirmModal.action === 'CANCEL'}
      />

      <Modal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        title="Register Walk-in Visitor"
      >
        <form onSubmit={handleRegisterWalkIn} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="ui-form-group"><label>Full Name</label><Input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} /></div>
            <div className="ui-form-group"><label>Mobile Number</label><Input required value={regData.mobile} onChange={e => setRegData({...regData, mobile: e.target.value})} /></div>
            <div className="ui-form-group"><label>Company</label><Input required value={regData.company} onChange={e => setRegData({...regData, company: e.target.value})} /></div>
            <div className="ui-form-group"><label>Purpose</label><Input required value={regData.purpose} onChange={e => setRegData({...regData, purpose: e.target.value})} /></div>
            <div className="ui-form-group"><label>Host Department</label><Input required value={regData.department} onChange={e => setRegData({...regData, department: e.target.value})} /></div>
            <div className="ui-form-group"><label>Host Employee</label><Input required value={regData.employeeToMeet} onChange={e => setRegData({...regData, employeeToMeet: e.target.value})} /></div>
            <div className="ui-form-group col-span-2"><label>Remarks (Optional)</label><Input value={regData.remarks} onChange={e => setRegData({...regData, remarks: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="ghost" type="button" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Register & Notify Host</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
