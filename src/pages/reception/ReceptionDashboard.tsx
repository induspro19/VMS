import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisitor } from '../../context/VisitorContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { Search, Bell, Edit, XCircle, UserPlus, RefreshCw } from 'lucide-react';
import { Input } from '../../components/ui/Input';
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

  const [search, setSearch] = useState('');
  
  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({ name: '', mobile: '', company: '', department: '', employeeToMeet: '', purpose: '', expectedDurationHours: 1, remarks: '' });

  // Quick Action Modal
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; visitorId: string | null; action: 'REMIND' | 'CANCEL' | null }>({ isOpen: false, visitorId: null, action: null });

  const todaysLogs = useMemo(() => {
    const today = new Date().toDateString();
    return auditLogs.filter(log => new Date(log.timestamp).toDateString() === today).slice(0, 50);
  }, [auditLogs]);

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
      if (v.hostEmployeeId) {
        import('../../lib/supabase').then(({ supabase }) => {
          supabase.functions.invoke('send-host-push', {
            body: {
              hostEmployeeId: v.hostEmployeeId,
              visitorName: v.name,
              visitorId: v.id,
              company: v.company,
              notificationType: 'REMINDER',
              message: `${v.name} is still waiting for you.`
            }
          }).catch(err => console.warn('Reminder Push failed:', err));
        });
      }
      sendPush('Visitor Reminder', `${v.name} is still waiting for you at the reception.`, 'WARNING');
      sendCommunication(v.name, v.employeeToMeet, 'Push Notification', 'Host Reminder', 'Visitor is waiting');
      toast(`Reminder sent to ${v.employeeToMeet}.`, 'success');
    } else if (confirmModal.action === 'CANCEL') {
      updateStatus(v.id, 'REJECTED', user?.name || 'Reception', { overrideReason: 'Visitor Left / Cancelled by Reception' });
      toast('Visit cancelled.', 'error');
    }
    setConfirmModal({ isOpen: false, visitorId: null, action: null });
  };

  return (
    <div style={{ height: '100%', padding: '1rem 2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
      
      {/* 1. Header & Alerts */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Reception Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {waiting.length > 5 && <AlertBanner variant="warning">High volume: {waiting.length} visitors waiting in lounge</AlertBanner>}
          {avgWaitTimeMins > 15 && <AlertBanner variant="danger">High wait times: Avg {Math.round(avgWaitTimeMins)} mins</AlertBanner>}
          {expected.length > 0 && <AlertBanner variant="info">{expected.length} expected VIPs/Pre-registered today</AlertBanner>}
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <Card variant="primary">
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expected Today</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{expected.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>pre-registered</div>
          </CardContent>
        </Card>
        
        <Card variant="info">
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Walk-ins</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{walkIns.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>unregistered arrivals</div>
          </CardContent>
        </Card>

        <Card variant={waiting.length > 0 ? "warning" : "info"}>
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Waiting Lounge</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{waiting.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>avg wait {Math.round(avgWaitTimeMins)}m</div>
          </CardContent>
        </Card>

        <Card variant="success">
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Approved</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{approved.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ready for security</div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Middle Detail Cards (3 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1 }}>
        
        {/* Waiting Lounge */}
        <Card variant="warning" style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader style={{ paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <CardTitle style={{ whiteSpace: 'nowrap' }}>Waiting Lounge</CardTitle>
            <div style={{ position: 'relative', width: '110px', flexShrink: 0 }}>
              <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                placeholder="Search..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ width: '100%', padding: '0.2rem 0.2rem 0.2rem 1.5rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} 
              />
            </div>
          </CardHeader>
          <CardContent style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {waiting.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).map(v => {
                const waitMins = Math.floor((new Date().getTime() - new Date(v.registrationTime).getTime()) / 60000);
                return (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Badge minimal variant={waitMins > 15 ? 'danger' : 'warning'}>{waitMins}m WAIT</Badge>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Host: {v.employeeToMeet}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button title="Remind Host" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'REMIND' })} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--info-color)' }}><Bell size={16} /></button>
                      <button title="Cancel Visit" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'CANCEL' })} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}><XCircle size={16} /></button>
                    </div>
                  </div>
                );
              })}
              {waiting.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Lounge is empty</div>}
            </div>
          </CardContent>
        </Card>

        {/* Expected & Approved */}
        <Card variant="info" style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Expected & Approved</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...expected, ...approved].slice(0, 10).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Badge minimal variant={v.isPreRegistered ? 'info' : 'success'}>
                      {v.isPreRegistered ? 'EXPECTED' : 'APPROVED'}
                    </Badge>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.company}</div>
                    </div>
                  </div>
                  <button title="Edit Details" onClick={() => navigate(`/reception/visitor/${v.id}`)} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                </div>
              ))}
              {expected.length === 0 && approved.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No expected visitors</div>}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card variant="primary" style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Reception Logs</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
              {todaysLogs.slice(0, 10).map(log => {
                let dotColor = 'var(--text-muted)';
                if (log.action.includes('Registered')) dotColor = 'var(--primary-color)';
                else if (log.action.includes('APPROVED')) dotColor = 'var(--success-color)';
                else if (log.action.includes('Reminder')) dotColor = 'var(--warning-color)';
                else if (log.action.includes('REJECTED')) dotColor = 'var(--danger-color)';

                return (
                  <div key={log.id} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-1.35rem', top: '0.25rem', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor, border: '2px solid var(--bg-card)' }} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{log.action}</div>
                  </div>
                );
              })}
              {todaysLogs.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No logs yet</div>}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 4. Quick Action Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
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
