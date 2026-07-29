import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisitor, type Visitor } from '../../context/VisitorContext';
import { Button } from '../../components/ui/Button';
import { 
  LogIn, LogOut, AlertOctagon, UserPlus, RefreshCw, 
  AlertTriangle, Search, Clock, ShieldCheck, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useSecurityShift } from '../../context/SecurityShiftContext';
import { SecurityShiftModal } from '../../components/ui/SecurityShiftModal';
import { AuditTimelineModal } from '../../components/ui/AuditTimelineModal';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { ERPKpiCard } from '../../components/ui/ERPKpiCard';

export type SortColumn = 
  | 'name'
  | 'company'
  | 'employeeToMeet'
  | 'department'
  | 'entryTime'
  | 'meetingCompletedTime'
  | 'duration'
  | 'status';

export type CategoryView = null | 'READY_EXIT' | 'WAITING' | 'INSIDE' | 'ALL';

export const SecurityDashboard: React.FC = () => {
  const { visitors, updateStatus } = useVisitor();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { activeShift } = useSecurityShift();

  // Selected Category View: null means Overview Boxes mode, non-null shows Category Table
  const [selectedCategory, setSelectedCategory] = useState<CategoryView>(null);
  
  // Search & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('entryTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & Override State
  const [isChangeShiftOpen, setIsChangeShiftOpen] = useState(false);
  const [timelineVisitorId, setTimelineVisitorId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    visitorId: string | null; 
    action: 'ENTRY' | 'EXIT' | 'FORCE_EXIT' | null 
  }>({
    isOpen: false, visitorId: null, action: null
  });

  const currentOfficerName = activeShift?.officerName || user?.name || user?.username || 'Main Gate Security';

  // 1. Filter Today's Visitors & Search Query
  const todaysVisitors = useMemo(() => {
    const today = new Date().toDateString();
    let filtered = visitors.filter(v => new Date(v.registrationTime).toDateString() === today);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(q) || 
        (v.mobile && v.mobile.includes(q)) ||
        (v.company && v.company.toLowerCase().includes(q)) || 
        (v.employeeToMeet && v.employeeToMeet.toLowerCase().includes(q)) ||
        (v.department && v.department.toLowerCase().includes(q)) ||
        (v.purpose && v.purpose.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [visitors, searchQuery]);

  // Tab Counts
  const waitingEntry = useMemo(() => todaysVisitors.filter(v => v.status === 'APPROVED'), [todaysVisitors]);
  const inside = useMemo(() => todaysVisitors.filter(v => v.status === 'INSIDE' && !v.meetingCompleted && !v.readyForExit), [todaysVisitors]);
  const readyForExit = useMemo(() => 
    todaysVisitors.filter(v => 
      v.status !== 'COMPLETED' && (
        v.status === 'READY_FOR_EXIT' || 
        (v.status === 'INSIDE' && (v.meetingCompleted || v.readyForExit))
      )
    )
  , [todaysVisitors]);

  const overdueVisitors = useMemo(() => todaysVisitors.filter(v => {
    if (v.status !== 'INSIDE' && v.status !== 'READY_FOR_EXIT') return false;
    if (!v.entryTime) return false;
    const hoursInside = (new Date().getTime() - new Date(v.entryTime).getTime()) / (1000 * 60 * 60);
    return hoursInside > settings.meetingDurationMaxHours;
  }), [todaysVisitors, settings.meetingDurationMaxHours]);

  const totalInsideCount = inside.length + readyForExit.length;

  // Active Category Visitors
  const activeTabVisitors = useMemo(() => {
    switch (selectedCategory) {
      case 'READY_EXIT': return readyForExit;
      case 'WAITING': return waitingEntry;
      case 'INSIDE': return inside;
      case 'ALL':
      default: return todaysVisitors;
    }
  }, [selectedCategory, todaysVisitors, readyForExit, waitingEntry, inside]);

  // Duration Helper (minutes integer for sorting)
  const getDurationMins = (entryTime?: string, endTime?: string) => {
    if (!entryTime) return 0;
    const start = new Date(entryTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : new Date().getTime();
    return Math.max(0, Math.floor((end - start) / 60000));
  };

  const formatDuration = (entryTime?: string, endTime?: string) => {
    if (!entryTime) return '-';
    const mins = getDurationMins(entryTime, endTime);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  // 2. Sort Visitors
  const sortedVisitors = useMemo(() => {
    const list = [...activeTabVisitors];

    list.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortColumn) {
        case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case 'company': aVal = (a.company || '').toLowerCase(); bVal = (b.company || '').toLowerCase(); break;
        case 'employeeToMeet': aVal = (a.employeeToMeet || '').toLowerCase(); bVal = (b.employeeToMeet || '').toLowerCase(); break;
        case 'department': aVal = (a.department || '').toLowerCase(); bVal = (b.department || '').toLowerCase(); break;
        case 'entryTime': aVal = a.entryTime ? new Date(a.entryTime).getTime() : 0; bVal = b.entryTime ? new Date(b.entryTime).getTime() : 0; break;
        case 'meetingCompletedTime': aVal = a.meetingCompletedTime ? new Date(a.meetingCompletedTime).getTime() : 0; bVal = b.meetingCompletedTime ? new Date(b.meetingCompletedTime).getTime() : 0; break;
        case 'duration': aVal = getDurationMins(a.entryTime, a.exitTime || a.meetingCompletedTime); bVal = getDurationMins(b.entryTime, b.exitTime || b.meetingCompletedTime); break;
        case 'status': aVal = a.status; bVal = b.status; break;
        default: aVal = new Date(a.registrationTime).getTime(); bVal = new Date(b.registrationTime).getTime(); break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [activeTabVisitors, sortColumn, sortDirection]);

  // 3. Paginate Visitors
  const totalRecords = sortedVisitors.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedVisitors.slice(start, start + rowsPerPage);
  }, [sortedVisitors, currentPage, rowsPerPage]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (col: SortColumn) => {
    if (sortColumn !== col) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // Status Badge Rendering
  const renderStatusBadge = (v: Visitor) => {
    let label = v.status.replace('_', ' ');
    let bg = '#F3F4F6';
    let color = '#374151';
    let border = '#E5E7EB';

    if (v.status === 'PENDING_APPROVAL') {
      label = 'Waiting Approval';
      bg = '#FEF3C7'; color = '#B45309'; border = '#FCD34D';
    } else if (v.status === 'APPROVED') {
      label = 'Approved';
      bg = '#DBEAFE'; color = '#1D4ED8'; border = '#93C5FD';
    } else if (v.status === 'INSIDE') {
      if (v.meetingCompleted || v.readyForExit) {
        label = 'Ready For Exit';
        bg = '#F3E8FF'; color = '#6B21A8'; border = '#D8B4FE';
      } else {
        label = 'Inside';
        bg = '#DCFCE7'; color = '#15803D'; border = '#86EFAC';
      }
    } else if (v.status === 'READY_FOR_EXIT') {
      label = 'Ready For Exit';
      bg = '#F3E8FF'; color = '#6B21A8'; border = '#D8B4FE';
    } else if (v.status === 'COMPLETED') {
      label = 'Completed';
      bg = '#F3F4F6'; color = '#374151'; border = '#E5E7EB';
    } else if (v.status === 'REJECTED') {
      label = 'Rejected';
      bg = '#FEE2E2'; color = '#B91C1C'; border = '#FCA5A5';
    }

    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
        backgroundColor: bg, color: color, border: `1px solid ${border}`,
        whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
        {label}
      </span>
    );
  };

  // Action Execution Handler
  const executeAction = async () => {
    if (!confirmModal.visitorId || !confirmModal.action) return;
    const targetVisitor = visitors.find(v => v.id === confirmModal.visitorId);
    const securityUsername = currentOfficerName;

    if (confirmModal.action === 'ENTRY') {
      await updateStatus(confirmModal.visitorId, 'INSIDE', securityUsername, { entryTime: new Date().toISOString() });
      toast(`Entry confirmed for ${targetVisitor?.name || 'Visitor'} by ${securityUsername}.`, 'success');
    } else if (confirmModal.action === 'EXIT') {
      const exitTime = new Date().toISOString();
      const entryTime = targetVisitor?.entryTime;
      let durationStr = '';
      if (entryTime) {
        const diffMins = Math.floor((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000);
        durationStr = `${diffMins} mins`;
      }
      
      await updateStatus(confirmModal.visitorId, 'COMPLETED', securityUsername, { 
        exitTime,
        checkedOutBy: securityUsername,
        totalVisitDuration: durationStr,
      });
      toast(`Manual checkout completed for ${targetVisitor?.name || 'Visitor'} by ${securityUsername}.`, 'success');
    } else if (confirmModal.action === 'FORCE_EXIT') {
      if (!overrideReason) {
        toast('Override reason is mandatory for Force Exit.', 'error');
        return;
      }
      const exitTime = new Date().toISOString();
      await updateStatus(
        confirmModal.visitorId, 
        'COMPLETED', 
        securityUsername, 
        { 
          exitTime,
          checkedOutBy: securityUsername,
          isOverride: true,
          overrideBy: securityUsername,
          overrideTime: exitTime,
          overrideReason
        }, 
        true
      );
      toast(`Force Exit recorded for ${targetVisitor?.name || 'Visitor'} by ${securityUsername}.`, 'warning');
    }
    
    setConfirmModal({ isOpen: false, visitorId: null, action: null });
    setOverrideReason('');
  };

  return (
    <div style={{
      width: '100%', padding: '0.85rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.85rem',
      boxSizing: 'border-box'
    }} className="animate-fade-in">
      
      {/* 1. Compact Header Bar & Security Officer Controls */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '10px', backgroundColor: '#FFFFFF', padding: '10px 16px',
        borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Title & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.2px' }}>
            Gate Operations
          </h1>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, borderLeft: '1px solid #CBD5E1', paddingLeft: '10px' }}>
            Security Control Panel
          </span>
        </div>
        
        {/* Controls: Officer Badge, Change Officer, Walk-in Registration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Officer Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '6px', backgroundColor: '#0F172A', color: '#FFFFFF',
            border: '1px solid #1E293B', height: '32px'
          }}>
            <ShieldCheck size={16} color="#38BDF8" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ color: '#F8FAFC' }}>{currentOfficerName}</span>
              <span style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 600 }}>
                ({activeShift?.shift || 'Morning'})
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsChangeShiftOpen(true)}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC', color: '#334155', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', height: '32px', display: 'flex', alignItems: 'center'
            }}
          >
            Change Officer
          </button>

          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<UserPlus size={14} />} 
            onClick={() => navigate('/register')}
            style={{ height: '32px', fontSize: '12px', fontWeight: 700, padding: '0 12px' }}
          >
            + Walk-in Registration
          </Button>
        </div>
      </div>

      {/* 2. Compact Alert Chips Bar */}
      {(readyForExit.length > 0 || totalInsideCount > 0 || overdueVisitors.length > 0 || waitingEntry.length > 0) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {readyForExit.length > 0 && (
            <div 
              onClick={() => { setSelectedCategory('READY_EXIT'); setCurrentPage(1); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '6px', backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D', color: '#B45309', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Clock size={14} />
              <span><strong>{readyForExit.length}</strong> visitor(s) Ready For Gate Checkout</span>
            </div>
          )}

          {totalInsideCount > 0 && (
            <div 
              onClick={() => navigate('/security/emergency')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '6px', backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <AlertTriangle size={14} />
              <span>Emergency Evac: <strong>{totalInsideCount}</strong> inside premises</span>
            </div>
          )}

          {overdueVisitors.length > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px', borderRadius: '6px', backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D', color: '#B45309', fontSize: '12px', fontWeight: 700
            }}>
              <AlertTriangle size={14} />
              <span><strong>{overdueVisitors.length}</strong> overdue visitor(s)</span>
            </div>
          )}

          {waitingEntry.length > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px', borderRadius: '6px', backgroundColor: '#DBEAFE',
              border: '1px solid #93C5FD', color: '#1D4ED8', fontSize: '12px', fontWeight: 700
            }}>
              <LogIn size={14} />
              <span><strong>{waitingEntry.length}</strong> waiting for gate entry</span>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------------------------- */}
      {/* MODE 1: OVERVIEW 4 BOXES VIEW (Table is NOT shown here, only large metric boxes) */}
      {/* ---------------------------------------------------------------------------------------- */}
      {selectedCategory === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select a Gate Category to View Visitors Table
            </h2>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Click any box to open category view</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            
            <ERPKpiCard
              title="Ready For Exit"
              value={readyForExit.length}
              subtitle="Meetings done by Host — awaiting checkout"
              footer="Open Checkout Queue →"
              footerStatus="warning"
              badgeText="PENDING EXIT"
              badgeVariant="warning"
              icon={<Clock size={18} />}
              iconBg="#FEF3C7"
              iconColor="#D97706"
              onClick={() => { setSelectedCategory('READY_EXIT'); setCurrentPage(1); }}
            />

            <ERPKpiCard
              title="Waiting Entry"
              value={waitingEntry.length}
              subtitle="Approved visitors present at main gate"
              footer="Open Entry Queue →"
              footerStatus="positive"
              badgeText="APPROVED"
              badgeVariant="active"
              icon={<LogIn size={18} />}
              iconBg="#EFF6FF"
              iconColor="#2563EB"
              onClick={() => { setSelectedCategory('WAITING'); setCurrentPage(1); }}
            />

            <ERPKpiCard
              title="Active Inside"
              value={inside.length}
              subtitle="Meetings currently in progress"
              footer="Open Active List →"
              footerStatus="positive"
              badgeText="INSIDE"
              badgeVariant="good"
              icon={<ShieldCheck size={18} />}
              iconBg="#ECFDF5"
              iconColor="#059669"
              onClick={() => { setSelectedCategory('INSIDE'); setCurrentPage(1); }}
            />

            <ERPKpiCard
              title="Total Today"
              value={todaysVisitors.length}
              subtitle="Total visitor registrations today"
              footer="Open All Records →"
              footerStatus="neutral"
              badgeText="TODAY"
              badgeVariant="today"
              icon={<Users size={18} />}
              iconBg="#F3F4F6"
              iconColor="#4B5563"
              onClick={() => { setSelectedCategory('ALL'); setCurrentPage(1); }}
            />

          </div>

          {/* Quick Gate Control Actions Footer */}
          <div style={{
            display: 'flex', gap: '1rem', padding: '16px', backgroundColor: '#FFFFFF',
            borderRadius: '12px', border: '1px solid #E2E8F0', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={() => navigate('/register')}>
                New Walk-in Registration
              </Button>
              <Button variant="secondary" leftIcon={<AlertTriangle size={16} />} onClick={() => navigate('/security/emergency')}>
                Emergency Evacuation Panel
              </Button>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Shift Logged In: <strong>{currentOfficerName}</strong> ({activeShift?.shift || 'Morning'} Shift)
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------------------------- */}
      {/* MODE 2: SEPARATE TABLE VIEW (Upper 4 Metric Boxes are HIDDEN completely) */}
      {/* ---------------------------------------------------------------------------------------- */}
      {selectedCategory !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Table Header Bar with Back Button */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#FFFFFF', padding: '12px 18px', borderRadius: '12px',
            border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC', color: '#0F172A', fontWeight: 700, fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} /> Back to Overview Boxes
              </button>

              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setSelectedCategory('ALL'); setCurrentPage(1); }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    backgroundColor: selectedCategory === 'ALL' ? '#0F172A' : '#F1F5F9',
                    color: selectedCategory === 'ALL' ? '#FFFFFF' : '#475569'
                  }}
                >
                  All Today ({todaysVisitors.length})
                </button>
                
                <button
                  onClick={() => { setSelectedCategory('READY_EXIT'); setCurrentPage(1); }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    backgroundColor: selectedCategory === 'READY_EXIT' ? '#FEF3C7' : '#F1F5F9',
                    color: selectedCategory === 'READY_EXIT' ? '#B45309' : '#475569',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Clock size={14} /> Ready For Exit ({readyForExit.length})
                </button>

                <button
                  onClick={() => { setSelectedCategory('WAITING'); setCurrentPage(1); }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    backgroundColor: selectedCategory === 'WAITING' ? '#DBEAFE' : '#F1F5F9',
                    color: selectedCategory === 'WAITING' ? '#1D4ED8' : '#475569',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <LogIn size={14} /> Waiting Entry ({waitingEntry.length})
                </button>

                <button
                  onClick={() => { setSelectedCategory('INSIDE'); setCurrentPage(1); }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    backgroundColor: selectedCategory === 'INSIDE' ? '#DCFCE7' : '#F1F5F9',
                    color: selectedCategory === 'INSIDE' ? '#15803D' : '#475569',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <ShieldCheck size={14} /> Inside Premises ({inside.length})
                </button>
              </div>
            </div>

            {/* Instant Search Bar & Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input 
                  type="text" 
                  placeholder="Search visitor, phone, host..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none',
                    backgroundColor: '#F8FAFC'
                  }}
                />
              </div>

              <button
                onClick={() => toast('Gate data refreshed', 'success')}
                style={{
                  padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: 600
                }}
                title="Refresh Table Data"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Full Width ERP Table Container */}
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '12px',
            border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto', minHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    
                    {/* 1. VISITOR NAME */}
                    <th 
                      onClick={() => handleSort('name')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        VISITOR NAME {renderSortIndicator('name')}
                      </div>
                    </th>

                    {/* 2. COMPANY */}
                    <th 
                      onClick={() => handleSort('company')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        COMPANY {renderSortIndicator('company')}
                      </div>
                    </th>

                    {/* 3. HOST EMPLOYEE */}
                    <th 
                      onClick={() => handleSort('employeeToMeet')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        HOST EMPLOYEE {renderSortIndicator('employeeToMeet')}
                      </div>
                    </th>

                    {/* 4. DEPARTMENT */}
                    <th 
                      onClick={() => handleSort('department')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        DEPARTMENT {renderSortIndicator('department')}
                      </div>
                    </th>

                    {/* 5. ENTRY TIME */}
                    <th 
                      onClick={() => handleSort('entryTime')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ENTRY TIME {renderSortIndicator('entryTime')}
                      </div>
                    </th>

                    {/* 6. MEETING COMPLETED */}
                    <th 
                      onClick={() => handleSort('meetingCompletedTime')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        MEETING COMPLETED {renderSortIndicator('meetingCompletedTime')}
                      </div>
                    </th>

                    {/* 7. DURATION */}
                    <th 
                      onClick={() => handleSort('duration')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        DURATION {renderSortIndicator('duration')}
                      </div>
                    </th>

                    {/* 8. STATUS */}
                    <th 
                      onClick={() => handleSort('status')}
                      style={{
                        position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                        padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800,
                        color: '#475569', borderBottom: '2px solid #E2E8F0', cursor: 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        STATUS {renderSortIndicator('status')}
                      </div>
                    </th>

                    {/* 9. ACTION */}
                    <th style={{
                      position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC',
                      padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 800,
                      color: '#475569', borderBottom: '2px solid #E2E8F0', whiteSpace: 'nowrap'
                    }}>
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVisitors.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8', fontSize: '14px' }}>
                        No matching visitor records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedVisitors.map((v, idx) => {
                      const isZebra = idx % 2 === 1;
                      const isReadyForExit = v.status === 'READY_FOR_EXIT' || (v.status === 'INSIDE' && (v.meetingCompleted || v.readyForExit));

                      return (
                        <tr 
                          key={v.id} 
                          style={{
                            backgroundColor: isReadyForExit ? '#FFFBEB' : (isZebra ? '#F8FAFC' : '#FFFFFF'),
                            transition: 'background-color 0.15s ease',
                            height: '58px'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isReadyForExit ? '#FFFBEB' : (isZebra ? '#F8FAFC' : '#FFFFFF'); }}
                        >
                          {/* 1. VISITOR NAME */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }} title={v.name}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                              {v.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span>📱 {v.mobile}</span>
                              {v.vehicleNumber && <span>🚗 {v.vehicleNumber}</span>}
                            </div>
                          </td>

                          {/* 2. COMPANY */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }} title={v.company || 'Personal Visit'}>
                            <div style={{ fontSize: '13px', color: '#334155', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                              {v.company || 'Personal Visit'}
                            </div>
                          </td>

                          {/* 3. HOST EMPLOYEE */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }} title={v.employeeToMeet}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                              {v.employeeToMeet}
                            </div>
                          </td>

                          {/* 4. DEPARTMENT */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }} title={v.department}>
                            <span style={{
                              fontSize: '12px', fontWeight: 600, color: '#475569',
                              backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px',
                              border: '1px solid #E2E8F0', whiteSpace: 'nowrap'
                            }}>
                              {v.department}
                            </span>
                          </td>

                          {/* 5. ENTRY TIME */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                              {v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                          </td>

                          {/* 6. MEETING COMPLETED */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            {v.meetingCompletedTime ? (
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', whiteSpace: 'nowrap' }}>
                                ✓ {new Date(v.meetingCompletedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : v.status === 'INSIDE' ? (
                              <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>In Progress</span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#94A3B8' }}>-</span>
                            )}
                          </td>

                          {/* 7. DURATION */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>
                              {formatDuration(v.entryTime, v.exitTime || v.meetingCompletedTime)}
                            </div>
                          </td>

                          {/* 8. STATUS */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            {renderStatusBadge(v)}
                          </td>

                          {/* 9. ACTION */}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                              {v.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => {
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
                                    toast(`Reminder sent to ${v.employeeToMeet}`, 'success');
                                  }}
                                  style={{
                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #E2E8F0',
                                    backgroundColor: '#FFFFFF', color: '#475569', fontSize: '12px', fontWeight: 600,
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  }}
                                >
                                  <AlertTriangle size={13} /> Send Reminder
                                </button>
                              )}
                              {v.status === 'APPROVED' && (
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'ENTRY' })}
                                  style={{
                                    padding: '6px 12px', borderRadius: '6px', border: 'none',
                                    backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: '12px', fontWeight: 700,
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  <LogIn size={13} /> Entry
                                </button>
                              )}

                              {(v.status === 'INSIDE' || v.status === 'READY_FOR_EXIT') && (
                                <>
                                  <button
                                    onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'EXIT' })}
                                    style={{
                                      padding: '6px 12px', borderRadius: '6px', border: 'none',
                                      backgroundColor: isReadyForExit ? '#D97706' : '#059669',
                                      color: '#FFFFFF', fontSize: '12px', fontWeight: 700,
                                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    <LogOut size={13} /> Checkout
                                  </button>

                                  {!v.meetingCompleted && v.status === 'INSIDE' && (
                                    <button
                                      title="Force Exit Override"
                                      onClick={() => setConfirmModal({ isOpen: true, visitorId: v.id, action: 'FORCE_EXIT' })}
                                      style={{
                                        padding: '6px 8px', borderRadius: '6px', border: '1px solid #DC2626',
                                        backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center'
                                      }}
                                    >
                                      <AlertOctagon size={13} />
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                onClick={() => setTimelineVisitorId(v.id)}
                                title="View Gate Pass Audit"
                                style={{
                                  padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1',
                                  backgroundColor: '#FFFFFF', color: '#475569', fontSize: '12px', fontWeight: 600,
                                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Clock size={13} /> Audit
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{
              padding: '12px 18px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '12px'
            }}>
              {/* Rows per page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748B' }}>
                <span>
                  Showing {totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, totalRecords)} of <strong>{totalRecords}</strong> visitors
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Rows per page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, outline: 'none'
                    }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1',
                    backgroundColor: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage === 1 ? '#94A3B8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', padding: '0 4px' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1',
                    backgroundColor: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage === totalPages ? '#94A3B8' : '#334155',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Confirmation & Audit Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          setConfirmModal({ isOpen: false, visitorId: null, action: null });
          setOverrideReason('');
        }}
        onConfirm={executeAction}
        title={
          confirmModal.action === 'ENTRY' ? 'Confirm Visitor Gate Entry' : 
          confirmModal.action === 'EXIT' ? 'Confirm Visitor Manual Gate Checkout' : 'Force Exit Override'
        }
        message={
          confirmModal.action === 'ENTRY' ? 'Confirm visitor entry at gate? Entry timestamp will be recorded under active security officer.' :
          confirmModal.action === 'EXIT' ? 'Confirm manual gate checkout for this visitor? Exit timestamp and total visit duration will be recorded.' :
          ''
        }
        isDestructive={confirmModal.action === 'FORCE_EXIT'}
        confirmText={confirmModal.action === 'FORCE_EXIT' ? 'Confirm Override' : 'Confirm'}
      >
        {confirmModal.action === 'FORCE_EXIT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>
              <strong>WARNING:</strong> This visitor's meeting has not been marked as completed by the host employee.
              Forcing an exit requires specifying a reason for audit logs.
            </p>
            <select 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
            >
              <option value="">Select an audit reason...</option>
              <option value="Host Employee Forgot">Host Employee Forgot</option>
              <option value="Emergency Evacuation">Emergency Evacuation</option>
              <option value="Visitor Left Early">Visitor Left Early</option>
              <option value="System Override">System Override</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}
      </ConfirmModal>

      <AuditTimelineModal 
        isOpen={!!timelineVisitorId}
        onClose={() => setTimelineVisitorId(null)}
        visitorId={timelineVisitorId}
      />

      {/* Unskippable Shift Login Modal when no active shift */}
      <SecurityShiftModal
        isOpen={!activeShift}
        isUnskippable={true}
      />

      {/* Manual Change Shift Modal */}
      <SecurityShiftModal
        isOpen={isChangeShiftOpen}
        onClose={() => setIsChangeShiftOpen(false)}
      />
    </div>
  );
};
