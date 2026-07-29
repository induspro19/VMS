import React, { useState, useMemo, useEffect } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import type { Visitor } from '../../context/VisitorContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { updateAppBadge } from '../../lib/badging';
import { NotificationCenter } from '../../components/NotificationCenter/NotificationCenter';

import { ConfirmModal } from '../../components/ui/Modal';
import { 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  Check, 
  X, 
  LogOut, 
  Search, 
  Bell, 
  BellRing,
  Home, 
  Calendar, 
  User, 
  Eye, 
  Sparkles,
  XCircle,
  PhoneCall,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import './EmployeeDashboard.css';

export const EmployeeDashboard: React.FC = () => {
  const { visitors, updateStatus } = useVisitor();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // State Management
  const [activeNavTab, setActiveNavTab] = useState<'HOME' | 'VISITORS' | 'APPOINTMENTS' | 'NOTIFICATIONS' | 'PROFILE'>('HOME');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'INSIDE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle URL Parameters (e.g. from Push Notifications)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const visitorIdParam = params.get('visitor');
    
    if (tabParam === 'pending') {
      setActiveNavTab('HOME'); // Visitors are shown on home tab by default
      setStatusFilter('PENDING');
      
      if (visitorIdParam && visitors.length > 0) {
        const foundVisitor = visitors.find(v => v.id === visitorIdParam);
        if (foundVisitor) {
          setSelectedVisitor(foundVisitor);
          setIsDrawerOpen(true);
          
          // Clean up URL after opening
          navigate('/employee', { replace: true });
        }
      }
    }
  }, [location.search, visitors, navigate]);

  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    visitorId: string | null; 
    action: 'APPROVE' | 'REJECT' | 'COMPLETE' | null 
  }>({
    isOpen: false, 
    visitorId: null, 
    action: null
  });

  // Calculate dynamic greeting time
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  // Data Filtering
  const myVisitors = useMemo(() => {
    return visitors.filter(v => v.employeeToMeet === user?.name || user?.name === 'John Doe' || !v.employeeToMeet);
  }, [visitors, user?.name]);
  
  const todaysVisitors = useMemo(() => {
    const today = new Date().toDateString();
    return myVisitors.filter(v => new Date(v.registrationTime).toDateString() === today);
  }, [myVisitors]);

  const pendingApproval = useMemo(() => todaysVisitors.filter(v => v.status === 'PENDING_APPROVAL'), [todaysVisitors]);
  const inside = useMemo(() => todaysVisitors.filter(v => v.status === 'INSIDE' && !v.meetingCompleted && !v.readyForExit), [todaysVisitors]);
  const completed = useMemo(() => todaysVisitors.filter(v => v.status === 'COMPLETED'), [todaysVisitors]);
  // Use local state for employee notifications instead of NotificationContext which is for generic app alerts
  const [empNotifications, setEmpNotifications] = useState<import('../../components/NotificationCenter/NotificationCenter').EmployeeNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [, setForceUpdate] = useState(0);

  const unreadCount = useMemo(() => empNotifications.filter(n => !n.is_read).length, [empNotifications]);

  // Update App Badge
  useEffect(() => {
    updateAppBadge(pendingApproval.length);
  }, [pendingApproval.length]);

  // Fetch initial notifications
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('employee_notifications')
      .select('*')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (data && !error) {
          setEmpNotifications(data as any);
        }
      });
  }, [user?.id]);

  // Tab & Search filtered list
  const filteredVisitors = useMemo(() => {
    return todaysVisitors.filter(v => {
      // Status Filter
      if (statusFilter === 'PENDING' && v.status !== 'PENDING_APPROVAL') return false;
      if (statusFilter === 'INSIDE' && (v.status !== 'INSIDE' || v.meetingCompleted || v.readyForExit)) return false;
      if (statusFilter === 'COMPLETED' && v.status !== 'COMPLETED') return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.company.toLowerCase().includes(q) ||
          v.mobile.includes(q) ||
          v.purpose.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [todaysVisitors, statusFilter, searchQuery]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!user?.id) return;

    const visitorChannel = supabase.channel(`host-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors', filter: `host_employee_id=eq.${user.id}` },
        (payload) => {
          // Play sound and show toast based on status
          if (payload.eventType === 'INSERT') {
            const newVisitor = payload.new as Visitor;
            const audio = new Audio('/VMS/sounds/visitor-arrived.mp3');
            audio.play().catch(e => console.warn('Audio play failed', e));
            toast(`🔔 New Visitor: ${newVisitor.name} is waiting.`, 'info');
          } else if (payload.eventType === 'UPDATE') {
            const updatedVisitor = payload.new as Visitor;
            if (updatedVisitor.status === 'APPROVED') {
              const audio = new Audio('/VMS/sounds/approval.mp3');
              audio.play().catch(e => console.warn('Audio play failed', e));
            } else if (updatedVisitor.status === 'REJECTED') {
              const audio = new Audio('/VMS/sounds/rejected.mp3');
              audio.play().catch(e => console.warn('Audio play failed', e));
            } else if (updatedVisitor.status === 'COMPLETED' || updatedVisitor.meetingCompletedTime) {
              const audio = new Audio('/VMS/sounds/meeting-completed.mp3');
              audio.play().catch(e => console.warn('Audio play failed', e));
            }
          }
        }
      )
      .subscribe();

    const notifChannel = supabase.channel(`notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_notifications', filter: `employee_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEmpNotifications(prev => [payload.new as any, ...prev]);
            if (payload.new.type === 'REMINDER') {
              const audio = new Audio('/VMS/sounds/reminder.mp3');
              audio.play().catch(e => console.warn('Audio play failed', e));
              toast(payload.new.message, 'warning');
            }
          } else if (payload.eventType === 'UPDATE') {
            setEmpNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as any : n));
          } else if (payload.eventType === 'DELETE') {
            setEmpNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(visitorChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id, toast]);

  const handleMarkAsRead = async (id: string) => {
    setEmpNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('employee_notifications').update({ is_read: true }).eq('id', id);
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = empNotifications.filter(n => !n.is_read).map(n => n.id);
    setEmpNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (unreadIds.length > 0) {
      await supabase.from('employee_notifications').update({ is_read: true }).in('id', unreadIds);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setEmpNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('employee_notifications').delete().eq('id', id);
  };

  const handleOpenVisitor = (visitorId: string) => {
    const v = visitors.find(v => v.id === visitorId);
    if (v) {
      setSelectedVisitor(v);
      setStatusFilter('ALL');
      setActiveNavTab('VISITORS');
    }
  };

  // Action Execution Handler
  const executeAction = async () => {
    if (!confirmModal.visitorId || !confirmModal.action) return;
    const vId = confirmModal.visitorId;
    const actorName = user?.name || 'Employee';
    
    if (confirmModal.action === 'APPROVE') {
      await updateStatus(vId, 'APPROVED', actorName);
      toast('Visitor request approved.', 'success');
    } else if (confirmModal.action === 'REJECT') {
      await updateStatus(vId, 'REJECTED', actorName);
      toast('Visitor request rejected.', 'error');
    } else if (confirmModal.action === 'COMPLETE') {
      await updateStatus(vId, 'READY_FOR_EXIT', actorName, { 
        meetingCompleted: true, 
        readyForExit: true,
        meetingCompletedTime: new Date().toISOString(),
      });
      toast('Meeting marked completed. Visitor queued for Security exit.', 'success');
    }
    
    setConfirmModal({ isOpen: false, visitorId: null, action: null });
    setSelectedVisitor(null);
  };

  const getModalProps = () => {
    switch (confirmModal.action) {
      case 'APPROVE': return { title: 'Approve Visitor Entry', message: 'Approve this visit request? Security will allow gate entry upon arrival.' };
      case 'REJECT': return { title: 'Reject Visitor Entry', message: 'Reject this visit request? The visitor will not be allowed entry at the gate.', isDestructive: true };
      case 'COMPLETE': return { title: 'Finish Active Meeting', message: 'Mark this meeting as completed? The visitor will be sent to Security for checkout.' };
      default: return { title: '', message: '' };
    }
  };

  // Duration Helper
  const calculateDuration = (entryTime?: string, exitTime?: string) => {
    if (!entryTime) return '0 min';
    const start = new Date(entryTime).getTime();
    const end = exitTime ? new Date(exitTime).getTime() : new Date().getTime();
    const diffMs = Math.max(0, end - start);
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  return (
    <div className="employee-mobile-root">
      
      {/* 1. Hero Greeting Section */}
      <div className="hero-greeting-section">
        <div className="hero-text-group">
          <h1 className="hero-title">{greeting} 👋</h1>
          <div className="hero-name">{user?.name || 'Bency Shinu'}</div>
          <div className="hero-role">Administrator</div>
          <div className="hero-date">{formattedDate}</div>
        </div>

        <div className="hero-right-actions">
          {('Notification' in window) && Notification.permission !== 'granted' && (
            <button 
              className="hero-icon-btn" 
              onClick={async () => {
                const perm = await Notification.requestPermission();
                if (perm === 'granted' && user) {
                  import('../../lib/pushNotifications').then(({ registerPushSubscription }) => {
                    registerPushSubscription(user.id);
                  });
                  setForceUpdate(Date.now());
                }
              }}
              title="Enable Notifications"
              style={{ color: '#DC2626', backgroundColor: '#FEE2E2' }}
            >
              <BellRing size={18} />
            </button>
          )}

          <button 
            className="hero-icon-btn" 
            onClick={() => setIsNotificationCenterOpen(true)}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge-dot" />}
          </button>
          
          <div 
            className="hero-profile-avatar"
            onClick={() => setIsDrawerOpen(true)}
            title="Open Menu"
          >
            {(user?.name || 'BS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <NotificationCenter 
        isOpen={isNotificationCenterOpen} 
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={empNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDeleteNotification}
        onOpenVisitor={handleOpenVisitor}
      />

      {/* 2. iOS Native Search Bar */}
      <div className="ios-search-wrapper">
        <div className="ios-search-bar">
          <Search size={18} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Search visitor by name, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <XCircle size={18} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
          )}
        </div>
      </div>

      {/* 3. 2x2 Dashboard Cards Grid (130px Height, 20px Radius, 16px Equal Spacing) */}
      <div className="dashboard-cards-grid">
        
        <div 
          className="compact-kpi-card"
          onClick={() => { setStatusFilter('ALL'); setActiveNavTab('VISITORS'); }}
        >
          <div className="kpi-top-row">
            <div className="kpi-icon-24" style={{ color: '#2563EB' }}>
              <Users size={20} />
            </div>
            <span className="kpi-pill-badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>TODAY</span>
          </div>
          <div>
            <div className="kpi-number-val">{todaysVisitors.length}</div>
            <div className="kpi-title-text">Visitors</div>
            <div className="kpi-subtitle-text">Scheduled & Walk-ins</div>
          </div>
        </div>

        <div 
          className="compact-kpi-card"
          onClick={() => { setStatusFilter('PENDING'); setActiveNavTab('VISITORS'); }}
        >
          <div className="kpi-top-row">
            <div className="kpi-icon-24" style={{ color: '#D97706' }}>
              <Clock size={20} />
            </div>
            <span className="kpi-pill-badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>WAITING</span>
          </div>
          <div>
            <div className="kpi-number-val">{pendingApproval.length}</div>
            <div className="kpi-title-text">Pending</div>
            <div className="kpi-subtitle-text">Action required</div>
          </div>
        </div>

        <div 
          className="compact-kpi-card"
          onClick={() => { setStatusFilter('INSIDE'); setActiveNavTab('VISITORS'); }}
        >
          <div className="kpi-top-row">
            <div className="kpi-icon-24" style={{ color: '#059669' }}>
              <UserCheck size={20} />
            </div>
            <span className="kpi-pill-badge" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>ACTIVE</span>
          </div>
          <div>
            <div className="kpi-number-val">{inside.length}</div>
            <div className="kpi-title-text">Inside</div>
            <div className="kpi-subtitle-text">In active meeting</div>
          </div>
        </div>

        <div 
          className="compact-kpi-card"
          onClick={() => { setStatusFilter('COMPLETED'); setActiveNavTab('VISITORS'); }}
        >
          <div className="kpi-top-row">
            <div className="kpi-icon-24" style={{ color: '#7E22CE' }}>
              <CheckCircle2 size={20} />
            </div>
            <span className="kpi-pill-badge" style={{ backgroundColor: '#F3E8FF', color: '#7E22CE' }}>DONE</span>
          </div>
          <div>
            <div className="kpi-number-val">{completed.length}</div>
            <div className="kpi-title-text">Completed</div>
            <div className="kpi-subtitle-text">Checked out today</div>
          </div>
        </div>

      </div>

      {/* 4. Approval Notification Banner (Requirement #14) */}
      {pendingApproval.length > 0 && (
        <div className="approval-notification-card">
          <div className="approval-notif-left">
            <Bell size={20} color="#D97706" />
            <span>{pendingApproval.length} Pending Approval{pendingApproval.length > 1 ? 's' : ''}</span>
          </div>
          <button 
            className="approval-notif-btn"
            onClick={() => { setStatusFilter('PENDING'); setActiveNavTab('VISITORS'); }}
          >
            Approve Now →
          </button>
        </div>
      )}

      {/* 5. 2-Column Quick Action Pills (Requirement #6) */}
      <div className="quick-actions-2col">
        <button 
          className="quick-action-pill"
          onClick={() => { setStatusFilter('PENDING'); setActiveNavTab('VISITORS'); }}
        >
          <Check size={16} color="#10B981" /> Approve
        </button>

        <button 
          className="quick-action-pill"
          onClick={() => { setStatusFilter('INSIDE'); setActiveNavTab('VISITORS'); }}
        >
          <LogOut size={16} color="#2563EB" /> Meeting
        </button>

        <button 
          className="quick-action-pill"
          onClick={() => navigate('/employee/appointments')}
        >
          <Calendar size={16} color="#EC4899" /> Appointments
        </button>

        <button 
          className="quick-action-pill"
          onClick={() => {
            const gatePhone = localStorage.getItem('securityGatePhone') || '9876543210';
            window.location.href = `tel:${gatePhone}`;
          }}
        >
          <PhoneCall size={16} color="#D97706" /> Security
        </button>
      </div>

      {/* 6. Segmented Control Tabs */}
      <div className="segmented-control-bar">
        <button 
          className={`segmented-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusFilter('ALL')}
        >
          All
        </button>
        
        <button 
          className={`segmented-tab ${statusFilter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending
        </button>

        <button 
          className={`segmented-tab ${statusFilter === 'INSIDE' ? 'active' : ''}`}
          onClick={() => setStatusFilter('INSIDE')}
        >
          Inside
        </button>

        <button 
          className={`segmented-tab ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('COMPLETED')}
        >
          Done
        </button>
      </div>

      {/* 7. Compact Visitor List Cards (Requirement #7 & #8) */}
      {filteredVisitors.length > 0 ? (
        <div className="compact-visitor-list">
          {filteredVisitors.map(v => {
            const isPending = v.status === 'PENDING_APPROVAL';
            const isInside = v.status === 'INSIDE' && !v.meetingCompleted && !v.readyForExit;
            const isDone = v.status === 'COMPLETED';

            return (
              <div key={v.id} className="compact-visitor-card">
                
                {/* Visitor Main Line */}
                <div className="card-visitor-main">
                  <div className="visitor-avatar-initials-44">
                    {v.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="visitor-name-company">
                    <div className="visitor-name-title">{v.name}</div>
                    <div className="visitor-company-subtitle">{v.company || 'Independent Visitor'}</div>
                  </div>

                  <span 
                    className="kpi-pill-badge"
                    style={{
                      backgroundColor: isPending ? '#FEF3C7' : isInside ? '#ECFDF5' : isDone ? '#F3E8FF' : '#FEE2E2',
                      color: isPending ? '#B45309' : isInside ? '#047857' : isDone ? '#6B21A8' : '#B91C1C'
                    }}
                  >
                    {isPending ? 'Pending' : isInside ? 'Inside' : isDone ? 'Done' : v.status}
                  </span>
                </div>

                <div className="card-divider" />

                {/* Bottom Time & Duration Line */}
                <div className="card-bottom-info">
                  <span>{v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not entered'}</span>
                  <span>{calculateDuration(v.entryTime, v.exitTime)}</span>
                </div>

                {/* Contextual Action Buttons */}
                <div className="compact-card-actions">
                  {isPending && (
                    <>
                      <button 
                        className="compact-btn compact-btn-approve"
                        onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'APPROVE' })}
                      >
                        <Check size={14} /> Approve
                      </button>

                      <button 
                        className="compact-btn compact-btn-reject"
                        onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'REJECT' })}
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}

                  {isInside && (
                    <button 
                      className="compact-btn compact-btn-complete"
                      onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'COMPLETE' })}
                    >
                      <LogOut size={14} /> Meeting Done
                    </button>
                  )}

                  <button 
                    className="compact-btn compact-btn-details"
                    onClick={() => setSelectedVisitor(v)}
                    title="View Visitor Profile Details"
                  >
                    <Eye size={16} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* 8. Center Empty State (Requirement #16) */
        <div className="ios-empty-state-card">
          <div className="empty-sparkle-icon">
            <Sparkles size={24} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>No Visitors</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '260px' }}>
            No visitor requests matching this filter.
          </div>
        </div>
      )}

      {/* 9. Visitor Details Bottom Sheet Drawer */}
      {selectedVisitor && (
        <div className="bottom-sheet-overlay" onClick={() => setSelectedVisitor(null)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="visitor-avatar-initials-44">
                  {selectedVisitor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>{selectedVisitor.name}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>{selectedVisitor.company || 'Independent Visitor'}</p>
                </div>
              </div>

              <XCircle size={20} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSelectedVisitor(null)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card-details-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', padding: '14px', borderRadius: '12px', backgroundColor: '#F8FAFC', gap: '10px' }}>
                <div className="detail-item">
                  <span className="detail-label">Mobile</span>
                  <span className="detail-val">{selectedVisitor.mobile}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-val">{selectedVisitor.department || 'General'}</span>
                </div>
                <div className="detail-item" style={{ marginTop: '8px' }}>
                  <span className="detail-label">Purpose</span>
                  <span className="detail-val">{selectedVisitor.purpose || 'Official Meeting'}</span>
                </div>
                <div className="detail-item" style={{ marginTop: '8px' }}>
                  <span className="detail-label">Vehicle No.</span>
                  <span className="detail-val">{selectedVisitor.vehicleNumber || 'N/A'}</span>
                </div>
              </div>

              {selectedVisitor.status === 'PENDING_APPROVAL' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    className="compact-btn compact-btn-approve" 
                    style={{ height: '40px', fontSize: '13px' }}
                    onClick={() => setConfirmModal({ isOpen: true, visitorId: selectedVisitor.id, action: 'APPROVE' })}
                  >
                    <Check size={14} /> Approve
                  </button>

                  <button 
                    className="compact-btn compact-btn-reject" 
                    style={{ height: '40px', fontSize: '13px' }}
                    onClick={() => setConfirmModal({ isOpen: true, visitorId: selectedVisitor.id, action: 'REJECT' })}
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}

              {selectedVisitor.status === 'INSIDE' && !selectedVisitor.meetingCompleted && (
                <button 
                  className="compact-btn compact-btn-complete" 
                  style={{ height: '40px', fontSize: '13px', marginTop: '8px' }}
                  onClick={() => setConfirmModal({ isOpen: true, visitorId: selectedVisitor.id, action: 'COMPLETE' })}
                >
                  <LogOut size={14} /> Meeting Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10. Slide Drawer Menu (Requirement #17) */}
      {isDrawerOpen && (
        <div className="slide-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="slide-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="drawer-profile-box">
                <div className="hero-profile-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                  {(user?.name || 'BS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{user?.name || 'Bency Shinu'}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{(user as any)?.email || 'admin@enterprise.com'}</div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: '#2563EB', marginTop: '2px' }}>Administrator</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '20px' }}>
                <button 
                  className="drawer-menu-item"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun size={18} color="#EAB308" /> : <Moon size={18} color="#6366F1" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <button 
                  className="drawer-menu-item"
                  onClick={() => { setIsDrawerOpen(false); navigate('/admin/settings'); }}
                >
                  <Settings size={18} color="#64748B" />
                  <span>Settings</span>
                </button>

                <button 
                  className="drawer-menu-item"
                  onClick={() => { setIsDrawerOpen(false); navigate('/help'); }}
                >
                  <HelpCircle size={18} color="#64748B" />
                  <span>Help & Support</span>
                </button>

                <button 
                  className="drawer-menu-item"
                  onClick={() => { setIsDrawerOpen(false); toast('Enterprise VMS Version 2.4.0 (Build 2026.07)', 'info'); }}
                >
                  <Info size={18} color="#64748B" />
                  <span>About App</span>
                </button>
              </div>
            </div>

            <button 
              className="drawer-menu-item"
              onClick={logout}
              style={{ color: '#EF4444', borderTop: '1px solid #F1F5F9', paddingTop: '16px', borderRadius: 0 }}
            >
              <LogOut size={18} color="#EF4444" />
              <span>Logout Account</span>
            </button>
          </div>
        </div>
      )}

      {/* 11. Floating iOS Bottom Navigation Bar (72px Height, 20px Top Corners) */}
      <div className="ios-floating-bottom-nav">
        <button 
          className={`ios-nav-item ${activeNavTab === 'HOME' ? 'active' : ''}`}
          onClick={() => { setActiveNavTab('HOME'); setStatusFilter('ALL'); }}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button 
          className={`ios-nav-item ${activeNavTab === 'VISITORS' ? 'active' : ''}`}
          onClick={() => { setActiveNavTab('VISITORS'); setStatusFilter('ALL'); }}
        >
          <Users size={20} />
          <span>Visitors</span>
        </button>

        <button 
          className={`ios-nav-item ${activeNavTab === 'APPOINTMENTS' ? 'active' : ''}`}
          onClick={() => navigate('/employee/appointments')}
        >
          <Calendar size={20} />
          <span>Appts</span>
        </button>

        <button 
          className={`ios-nav-item ${activeNavTab === 'NOTIFICATIONS' ? 'active' : ''}`}
          onClick={() => setIsNotificationCenterOpen(true)}
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge-dot" style={{ top: 2, right: 18 }} />}
          <span>Alerts</span>
        </button>

        <button 
          className={`ios-nav-item ${activeNavTab === 'PROFILE' ? 'active' : ''}`}
          onClick={() => setIsDrawerOpen(true)}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, visitorId: null, action: null })}
        onConfirm={executeAction}
        {...getModalProps()}
      />
    </div>
  );
};
