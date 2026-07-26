import React, { useState, useMemo } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
// Removed unused input import
import { ConfirmModal } from '../../components/ui/Modal';
import { Bell, Check, X, LogOut, Search, Clock, Users } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { visitors, updateStatus } = useVisitor();
  const { user } = useAuth();
  const { notifications, sendWhatsApp, markAsRead, markAllAsRead } = useNotification();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD'>('UNREAD');
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; visitorId: string | null; action: 'APPROVE' | 'REJECT' | 'COMPLETE' | null }>({
    isOpen: false, visitorId: null, action: null
  });

  const myVisitors = useMemo(() => visitors.filter(v => v.employeeToMeet === user?.name || user?.name === 'John Doe'), [visitors, user?.name]);
  
  const filteredVisitors = useMemo(() => myVisitors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.company.toLowerCase().includes(search.toLowerCase())
  ), [myVisitors, search]);

  const currentVisitors = useMemo(() => filteredVisitors.filter(v => v.status !== 'COMPLETED' && v.status !== 'REJECTED'), [filteredVisitors]);
  const historyVisitors = useMemo(() => filteredVisitors.filter(v => v.status === 'COMPLETED' || v.status === 'REJECTED'), [filteredVisitors]);
  
  const unreadNotifications = notifications.filter(n => !n.read && n.type === 'PUSH');
  const filteredNotifs = notifications.filter(n => n.type === 'PUSH' && (notifFilter === 'ALL' || !n.read));

  const executeAction = () => {
    if (!confirmModal.visitorId || !confirmModal.action) return;
    const vId = confirmModal.visitorId;
    const visitor = visitors.find(v => v.id === vId);
    
    if (confirmModal.action === 'APPROVE') {
      updateStatus(vId, 'APPROVED', user?.name || 'Employee');
      toast('Visitor request approved.', 'success');
    } else if (confirmModal.action === 'REJECT') {
      updateStatus(vId, 'REJECTED', user?.name || 'Employee');
      toast('Visitor request rejected.', 'error');
    } else if (confirmModal.action === 'COMPLETE') {
      updateStatus(vId, 'INSIDE', user?.name || 'Employee', { 
        meetingCompleted: true, 
        readyForExit: true, 
        meetingCompletedTime: new Date().toISOString() 
      });
      if (visitor) {
        sendWhatsApp(visitor.mobile, `Dear ${visitor.name},\nYour meeting is complete.\nPlease proceed to the security gate and scan your original QR code to exit.`);
        toast('Meeting completed. Visitor notified.', 'success');
      }
    }
    
    setConfirmModal({ isOpen: false, visitorId: null, action: null });
  };

  const getModalProps = () => {
    switch (confirmModal.action) {
      case 'APPROVE': return { title: 'Approve Visitor', message: 'Approve this visit request? They will be allowed entry at the gate.' };
      case 'REJECT': return { title: 'Reject Visitor', message: 'Reject this visit request? They will not be allowed entry.', isDestructive: true };
      case 'COMPLETE': return { title: 'Finish Meeting', message: 'Mark meeting as completed? This generates their checkout token.' };
      default: return { title: '', message: '' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return <Badge variant="warning">Action Required</Badge>;
      case 'APPROVED': return <Badge variant="info">Upcoming / Approved</Badge>;
      case 'INSIDE': return <Badge variant="success">Currently with You</Badge>;
      case 'READY_FOR_EXIT': return <Badge variant="default">Meeting Ended</Badge>;
      case 'COMPLETED': return <Badge variant="default">Completed</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} style={{ color: 'var(--primary-color)' }} />
            My Visitors Command Center
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Welcome back, {user?.name}
          </div>
        </div>
        <div 
          className="ui-card flex items-center justify-center p-3 cursor-pointer transition-all hover:bg-card-hover relative" 
          onClick={() => setIsNotificationCenterOpen(true)}
          style={{ width: '48px', height: '48px', padding: 0 }}
        >
          <Bell size={20} className="text-secondary" />
          {unreadNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger-color text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" style={{ fontSize: '10px', width: '18px', height: '18px' }}>
              {unreadNotifications.length}
            </span>
          )}
        </div>
      </div>

      {isNotificationCenterOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="ui-card" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Notification Center</h2>
              <button onClick={() => setIsNotificationCenterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20}/></button>
            </div>
            
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#E5E7EB', padding: '4px', borderRadius: '8px' }}>
                <button 
                  onClick={() => setNotifFilter('UNREAD')}
                  style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: notifFilter === 'UNREAD' ? '#FFFFFF' : 'transparent', color: notifFilter === 'UNREAD' ? '#111827' : '#4B5563', boxShadow: notifFilter === 'UNREAD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                >
                  Unread
                </button>
                <button 
                  onClick={() => setNotifFilter('ALL')}
                  style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: notifFilter === 'ALL' ? '#FFFFFF' : 'transparent', color: notifFilter === 'ALL' ? '#111827' : '#4B5563', boxShadow: notifFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                >
                  All
                </button>
              </div>
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 500, color: '#3B82F6', cursor: 'pointer' }}>Mark All Read</button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#FFFFFF' }}>
              {filteredNotifs.length === 0 && <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px', padding: '2rem 0', margin: 0 }}>No notifications found.</p>}
              {filteredNotifs.map(n => (
                <div key={n.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px', border: n.read ? '1px solid #F3F4F6' : '1px solid #BFDBFE', borderRadius: '8px', backgroundColor: n.read ? '#FFFFFF' : '#EFF6FF', opacity: n.read ? 0.7 : 1, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: n.priority === 'CRITICAL' ? '#EF4444' : '#111827' }}>{n.title}</span>
                      {!n.read && <span style={{ fontSize: '9px', fontWeight: 700, color: '#2563EB', backgroundColor: '#DBEAFE', padding: '2px 6px', borderRadius: '9999px', letterSpacing: '0.5px' }}>NEW</span>}
                    </div>
                    {!n.read && (
                      <button onClick={() => markAsRead(n.id)} style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 600, color: '#3B82F6', cursor: 'pointer', padding: 0 }}>Mark Read</button>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.5 }}>{n.message}</p>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>{new Date(n.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#E5E7EB', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('CURRENT')}
            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'CURRENT' ? '#FFFFFF' : 'transparent', color: activeTab === 'CURRENT' ? '#111827' : '#4B5563', boxShadow: activeTab === 'CURRENT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Active Workflows ({currentVisitors.length})
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'HISTORY' ? '#FFFFFF' : 'transparent', color: activeTab === 'HISTORY' ? '#111827' : '#4B5563', boxShadow: activeTab === 'HISTORY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            History
          </button>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px', flex: '1 1 auto' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input 
            type="text"
            placeholder="Search your visitors..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0 12px 0 36px', height: '36px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none' }}
          />
        </div>
      </div>

      {/* Main Table Area (Flexible height) */}
      <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
          {activeTab === 'CURRENT' ? 'Unified Active Operations' : 'Visitor History'}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="ui-table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem 1rem' }}>Visitor Details</th>
                <th style={{ padding: '0.5rem 1rem' }}>Company</th>
                <th style={{ padding: '0.5rem 1rem' }}>Time</th>
                <th style={{ padding: '0.5rem 1rem' }}>Status</th>
                <th style={{ padding: '0.5rem 3.5rem 0.5rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'CURRENT' ? (
                <>
                  {currentVisitors.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No active visitor workflows at the moment.
                      </td>
                    </tr>
                  )}
                  {currentVisitors.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.purpose}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{v.company}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          {v.entryTime ? new Date(v.entryTime).toLocaleTimeString() : new Date(v.registrationTime).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>{getStatusBadge(v.status)}</td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
                          {v.status === 'PENDING_APPROVAL' && (
                            <>
                              <button 
                                onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'APPROVE' })}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  backgroundColor: 'transparent',
                                  border: '2px solid #10B981', 
                                  borderRadius: '9999px',
                                  padding: '4px 6px 4px 12px',
                                  color: '#10B981',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  letterSpacing: '0.5px',
                                  cursor: 'pointer',
                                  gap: '8px',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                APPROVE
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #10B981', boxSizing: 'border-box', marginTop: '1px' }}>
                                  <Check size={10} strokeWidth={4} />
                                </div>
                              </button>
                              <button 
                                onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'REJECT' })}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  backgroundColor: 'transparent',
                                  border: '2px solid #EF4444', 
                                  borderRadius: '9999px',
                                  padding: '4px 6px 4px 12px',
                                  color: '#EF4444',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  letterSpacing: '0.5px',
                                  cursor: 'pointer',
                                  gap: '8px',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                REJECT
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #EF4444', boxSizing: 'border-box', marginTop: '1px' }}>
                                  <X size={10} strokeWidth={4} />
                                </div>
                              </button>
                            </>
                          )}
                          {v.status === 'INSIDE' && (
                            <Button size="sm" variant="primary" onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'COMPLETE' })} leftIcon={<LogOut size={14} />} style={{ fontSize: '12px', height: '28px', padding: '0 0.5rem' }}>Meeting Done</Button>
                          )}
                          {v.status !== 'PENDING_APPROVAL' && v.status !== 'INSIDE' && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No action needed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {historyVisitors.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No history found.
                      </td>
                    </tr>
                  )}
                  {historyVisitors.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.purpose}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{v.company}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          {new Date(v.registrationTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td>{getStatusBadge(v.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Archived</span>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, visitorId: null, action: null })}
        onConfirm={executeAction}
        {...getModalProps()}
      />
    </div>
  );
};
