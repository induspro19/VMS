import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useVisitor, type Visitor } from '../../context/VisitorContext';
import { 
  Search, Download, Clock, RotateCcw, Plus, Calendar, 
  Shield, MoreVertical, Printer, Eye, User, DoorOpen, CheckCircle2, X
} from 'lucide-react';
import { AuditTimelineModal } from '../../components/ui/AuditTimelineModal';
import { utils, writeFile } from 'xlsx';

export type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'CUSTOM';

export const VisitorHistory: React.FC = () => {
  const { visitors, updateStatus } = useVisitor();
  const navigate = useNavigate();

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Modals & Menu State
  const [timelineVisitorId, setTimelineVisitorId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [checkoutModalVisitor, setCheckoutModalVisitor] = useState<Visitor | null>(null);
  const [printVisitor, setPrintVisitor] = useState<Visitor | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Handle Preset Changes
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'TODAY') {
      const todayStr = formatDateStr(now);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const yestStr = formatDateStr(yest);
      setFromDate(yestStr);
      setToDate(yestStr);
    } else if (preset === 'LAST_7') {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 6);
      setFromDate(formatDateStr(past7));
      setToDate(formatDateStr(now));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(now));
    }
  };

  // Filter Visitors by Search, Status, and Date Range
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      // 1. Search filter
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || (
        v.name.toLowerCase().includes(q) || 
        (v.mobile && v.mobile.includes(q)) || 
        (v.company && v.company.toLowerCase().includes(q)) ||
        (v.employeeToMeet && v.employeeToMeet.toLowerCase().includes(q)) ||
        (v.department && v.department.toLowerCase().includes(q)) ||
        (v.id && v.id.toLowerCase().includes(q))
      );

      // 2. Status filter
      let matchesStatus = true;
      if (statusFilter === 'READY_FOR_EXIT') {
        matchesStatus = v.status === 'READY_FOR_EXIT' || (v.status === 'INSIDE' && Boolean(v.meetingCompleted || v.readyForExit));
      } else if (statusFilter !== 'ALL') {
        matchesStatus = v.status === statusFilter;
      }

      // 3. Date range filter
      let matchesDate = true;
      const vTime = v.entryTime ? new Date(v.entryTime) : new Date(v.registrationTime);

      if (fromDate) {
        const fDate = new Date(fromDate);
        fDate.setHours(0, 0, 0, 0);
        if (vTime < fDate) matchesDate = false;
      }
      if (toDate && matchesDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59, 999);
        if (vTime > tDate) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime());
  }, [visitors, search, statusFilter, fromDate, toDate]);

  const totalRecords = filteredVisitors.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  
  const paginatedVisitors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVisitors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVisitors, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, fromDate, toDate]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setFromDate('');
    setToDate('');
  };

  // Check In Handler
  const handleCheckIn = (v: Visitor) => {
    const officer = localStorage.getItem('securityOfficerName') || 'Main Gate Security';
    updateStatus(v.id, 'INSIDE', officer, {
      entryTime: new Date().toISOString(),
      checkedInBy: officer
    });
  };

  // Print Gate Pass Handler (Prints ONLY Selected Visitor's Pass)
  const handlePrintVisitor = (v: Visitor) => {
    setPrintVisitor(v);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExport = () => {
    const exportData = filteredVisitors.map(v => ({
      ID: v.id,
      Name: v.name,
      Mobile: v.mobile,
      Company: v.company || 'Personal Visit',
      Department: v.department,
      Host: v.employeeToMeet,
      Security_Officer: v.checkedInBy || 'Not Assigned',
      Status: v.status,
      Registration_Time: new Date(v.registrationTime).toLocaleString(),
      Entry_Time: v.entryTime ? new Date(v.entryTime).toLocaleString() : '-',
      Exit_Time: v.exitTime ? new Date(v.exitTime).toLocaleString() : '-',
      Pre_Registered: v.isPreRegistered ? 'Yes' : 'No',
      Force_Exit: v.isOverride ? 'Yes' : 'No',
      Override_Reason: v.overrideReason || '-',
    }));
    
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Visitor History");
    writeFile(wb, `Visitor_History_${fromDate || 'All'}_to_${toDate || 'All'}.xlsx`);
  };

  // Department Badge Style Helper
  const getDepartmentStyle = (dept: string) => {
    const d = (dept || '').toLowerCase().trim();
    if (d.includes('admin')) return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    if (d.includes('maint')) return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    if (d.includes('hr')) return { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8' };
    if (d.includes('prod')) return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
    if (d.includes('plan')) return { bg: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF' };
    if (d.includes('ehs') || d.includes('safe')) return { bg: '#FFF7ED', color: '#C2410C', border: '#FFEDD5' };
    if (d.includes('sales') || d.includes('mark')) return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' };
    return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  };

  // Status Badge Style Helper
  const getStatusBadge = (v: Visitor) => {
    let label = v.status.replace('_', ' ');
    let bg = '#F3F4F6';
    let color = '#374151';
    let border = '#E5E7EB';

    if (v.status === 'PENDING_APPROVAL') {
      label = 'Pending';
      bg = '#FFEDD5'; color = '#C2410C'; border = '#FDBA74';
    } else if (v.status === 'APPROVED') {
      label = 'Approved';
      bg = '#D1FAE5'; color = '#047857'; border = '#6EE7B7';
    } else if (v.status === 'INSIDE') {
      if (v.meetingCompleted || v.readyForExit) {
        label = 'Ready Exit';
        bg = '#FEF3C7'; color = '#B45309'; border = '#FCD34D';
      } else {
        label = 'Inside';
        bg = '#DBEAFE'; color = '#1E40AF'; border = '#93C5FD';
      }
    } else if (v.status === 'READY_FOR_EXIT') {
      label = 'Ready Exit';
      bg = '#FEF3C7'; color = '#B45309'; border = '#FCD34D';
    } else if (v.status === 'COMPLETED') {
      label = 'Completed';
      bg = '#DCFCE7'; color = '#15803D'; border = '#86EFAC';
    } else if (v.status === 'REJECTED') {
      label = 'Rejected';
      bg = '#FEE2E2'; color = '#B91C1C'; border = '#FCA5A5';
    }

    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        height: '26px', padding: '0 12px', borderRadius: '13px',
        fontSize: '12px', fontWeight: 600,
        backgroundColor: bg, color: color, border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
        {label}
      </span>
    );
  };

  // Format Date & Time onto 1 single clean line: "28 Jul 2026 • 1:49 PM"
  const formatSingleLineDT = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}`;
  };

  const formatSingleTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Duration Calculator
  const calculateDuration = (v: Visitor) => {
    if (!v.entryTime) return '-';
    const start = new Date(v.entryTime).getTime();
    const end = v.exitTime ? new Date(v.exitTime).getTime() : new Date().getTime();
    const diffMins = Math.max(0, Math.floor((end - start) / 60000));
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs === 0) return `${mins} Min`;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} Hr`;
  };

  return (
    <div style={{
      width: '100%', padding: '1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.85rem',
      boxSizing: 'border-box'
    }} className="animate-fade-in" onClick={() => setActiveMenuId(null)}>
      
      {/* 1. Page Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0F172A', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={22} color="var(--primary-color)" /> Visitor Logs & History
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            Enterprise Gate Activity Audit Trail & Visitor Management System
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={resetFilters}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF', color: '#475569', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={14} /> Reset Filters
          </button>

          <button
            onClick={handleExport}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <Download size={14} color="#2563EB" /> Export Excel
          </button>

          <button
            onClick={() => navigate('/register')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: 'var(--primary-color)', color: '#FFFFFF', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Plus size={15} /> New Walk-In Registration
          </button>
        </div>
      </div>

      {/* 2. Compact ERP Filter Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF', padding: '8px 14px', borderRadius: '10px',
        border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '10px', minHeight: '46px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              placeholder="Search visitor, mobile, company, host..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 34px', borderRadius: '8px',
                border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none',
                backgroundColor: '#F8FAFC', color: '#0F172A', fontWeight: 500
              }}
            />
          </div>

          {/* Date Presets Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', padding: '3px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', height: '34px' }}>
            <Calendar size={14} color="#64748B" />
            <select
              value={datePreset}
              onChange={e => handlePresetChange(e.target.value as DatePreset)}
              style={{ border: 'none', backgroundColor: 'transparent', fontSize: '12px', fontWeight: 600, color: '#0F172A', outline: 'none', cursor: 'pointer' }}
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {(datePreset === 'CUSTOM' || fromDate || toDate) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}>
              <input
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setDatePreset('CUSTOM'); }}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 600, outline: 'none', backgroundColor: '#F8FAFC' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setDatePreset('CUSTOM'); }}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 600, outline: 'none', backgroundColor: '#F8FAFC' }}
              />
            </div>
          )}

          {/* Status Filter Dropdown */}
          <select 
            style={{
              padding: '6px 10px', borderRadius: '8px', border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC', fontSize: '12px', fontWeight: 600, color: '#0F172A',
              outline: 'none', cursor: 'pointer', height: '34px'
            }}
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="INSIDE">Inside Premises</option>
            <option value="READY_FOR_EXIT">Ready For Exit</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>

        </div>

        {/* Counter Info */}
        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
          Total Logs: <strong>{totalRecords}</strong>
        </div>
      </div>

      {/* 3. Compact Enterprise ERP Data Grid */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px',
        border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'auto' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', height: '48px' }}>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  VISITOR NAME & MOBILE
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  COMPANY
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  DEPARTMENT
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  HOST EMPLOYEE
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  SECURITY OFFICER
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  STATUS
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  ENTRY TIME
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  EXIT TIME
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  DURATION
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC', padding: '10px 14px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1.5px solid #E2E8F0' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedVisitors.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8', fontSize: '13px' }}>
                    No matching visitor records found.
                  </td>
                </tr>
              ) : (
                paginatedVisitors.map((v, idx) => {
                  const isZebra = idx % 2 === 1;
                  const deptStyle = getDepartmentStyle(v.department);
                  const entryTimeStr = formatSingleLineDT(v.entryTime || v.registrationTime);
                  const exitTimeStr = v.exitTime ? formatSingleTime(v.exitTime) : null;
                  const durationStr = calculateDuration(v);

                  const isReadyForExit = v.status === 'READY_FOR_EXIT' || (v.status === 'INSIDE' && (v.meetingCompleted || v.readyForExit));

                  return (
                    <tr 
                      key={v.id} 
                      style={{
                        backgroundColor: isZebra ? '#F8FAFC' : '#FFFFFF',
                        transition: 'all 0.15s ease',
                        height: '54px',
                        cursor: 'pointer',
                        borderLeft: '4px solid transparent'
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.backgroundColor = '#EFF6FF'; 
                        e.currentTarget.style.borderLeft = '4px solid #2563EB';
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.backgroundColor = isZebra ? '#F8FAFC' : '#FFFFFF'; 
                        e.currentTarget.style.borderLeft = '4px solid transparent';
                      }}
                      onClick={() => setTimelineVisitorId(v.id)}
                    >
                      {/* 1. VISITOR NAME & MOBILE (Single Line: 👤 Name • Mobile) */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: '#E0F2FE', color: '#0369A1',
                            fontSize: '13px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {v.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                              {v.name}
                            </span>
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>
                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, fontFamily: 'monospace' }}>
                              {v.mobile || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. COMPANY */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>
                            {v.company || 'Personal Visit'}
                          </span>
                          {!v.isPreRegistered && (
                            <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>
                              Walk-In
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. DEPARTMENT */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: 600, color: deptStyle.color,
                          backgroundColor: deptStyle.bg, border: `1px solid ${deptStyle.border}`,
                          height: '24px', padding: '0 10px', borderRadius: '12px', whiteSpace: 'nowrap',
                          display: 'inline-flex', alignItems: 'center'
                        }}>
                          {v.department || 'General'}
                        </span>
                      </td>

                      {/* 4. HOST EMPLOYEE */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <User size={14} color="#64748B" />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>
                            {v.employeeToMeet}
                          </span>
                        </div>
                      </td>

                      {/* 5. SECURITY OFFICER */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <Shield size={14} color={v.checkedInBy ? '#0284C7' : '#94A3B8'} />
                          <span style={{ fontSize: '12px', fontWeight: 500, color: v.checkedInBy ? '#0F172A' : '#94A3B8' }}>
                            {v.checkedInBy || 'Not Assigned'}
                          </span>
                        </div>
                      </td>

                      {/* 6. STATUS */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        {getStatusBadge(v)}
                      </td>

                      {/* 7. ENTRY TIME */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {entryTimeStr}
                        </span>
                      </td>

                      {/* 8. EXIT TIME */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        {exitTimeStr ? (
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                            {exitTimeStr}
                          </span>
                        ) : v.status === 'INSIDE' || v.status === 'READY_FOR_EXIT' ? (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '8px' }}>
                            Inside
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>
                        )}
                      </td>

                      {/* 9. DURATION */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <span style={{ 
                          fontSize: '12px', fontWeight: 700, 
                          color: v.status === 'COMPLETED' ? '#059669' : v.status === 'INSIDE' || isReadyForExit ? '#2563EB' : '#64748B',
                          whiteSpace: 'nowrap' 
                        }}>
                          {durationStr}
                        </span>
                      </td>

                      {/* 10. ACTIONS (Contextual Icons: 👁 View, 🖨 Print, 🚪 Check In, ✅ Manual Checkout, ⋮ More) */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', position: 'relative' }}>
                          
                          {/* 👁 View Gate Pass */}
                          <button
                            title="View Gate Pass"
                            onClick={() => setTimelineVisitorId(v.id)}
                            style={{
                              width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E2E8F0',
                              backgroundColor: '#FFFFFF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* 🖨 Print Gate Pass */}
                          <button
                            title="Print Gate Pass"
                            onClick={() => handlePrintVisitor(v)}
                            style={{
                              width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E2E8F0',
                              backgroundColor: '#FFFFFF', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ECFDF5'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                          >
                            <Printer size={15} />
                          </button>

                          {/* 🚪 Check In (Visible ONLY when status = APPROVED) */}
                          {v.status === 'APPROVED' && (
                            <button
                              title="Check In Visitor"
                              onClick={() => handleCheckIn(v)}
                              style={{
                                width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #BFDBFE',
                                backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DBEAFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                            >
                              <DoorOpen size={15} />
                            </button>
                          )}

                          {/* ✅ Manual Checkout (Visible ONLY when status = READY_FOR_EXIT or meeting completed) */}
                          {isReadyForExit && (
                            <button
                              title="Manual Checkout"
                              onClick={() => setCheckoutModalVisitor(v)}
                              style={{
                                width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #BBF7D0',
                                backgroundColor: '#ECFDF5', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DCFCE7'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ECFDF5'; }}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {/* ⋮ More Options */}
                          <button
                            title="More Options"
                            onClick={() => setActiveMenuId(activeMenuId === v.id ? null : v.id)}
                            style={{
                              width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E2E8F0',
                              backgroundColor: '#FFFFFF', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                          >
                            <MoreVertical size={15} />
                          </button>

                          {/* 3-Dot Action Menu Popover */}
                          {activeMenuId === v.id && (
                            <div style={{
                              position: 'absolute', right: 0, top: '38px', zIndex: 100,
                              backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '4px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)', border: '1px solid #E2E8F0',
                              width: '160px', display: 'flex', flexDirection: 'column', gap: '2px'
                            }}>
                              <button
                                onClick={() => { setTimelineVisitorId(v.id); setActiveMenuId(null); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                  padding: '7px 10px', border: 'none', borderRadius: '6px',
                                  backgroundColor: 'transparent', color: '#0F172A', fontSize: '12px', fontWeight: 600,
                                  cursor: 'pointer', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Eye size={14} color="#2563EB" /> View Gate Pass
                              </button>

                              <button
                                onClick={() => { setTimelineVisitorId(v.id); setActiveMenuId(null); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                  padding: '7px 10px', border: 'none', borderRadius: '6px',
                                  backgroundColor: 'transparent', color: '#0F172A', fontSize: '12px', fontWeight: 600,
                                  cursor: 'pointer', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Clock size={14} color="#D97706" /> Audit Timeline
                              </button>

                              <button
                                onClick={() => { handlePrintVisitor(v); setActiveMenuId(null); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                  padding: '7px 10px', border: 'none', borderRadius: '6px',
                                  backgroundColor: 'transparent', color: '#0F172A', fontSize: '12px', fontWeight: 600,
                                  cursor: 'pointer', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Printer size={14} color="#059669" /> Print Pass
                              </button>
                            </div>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Footer */}
        <div style={{
          padding: '10px 16px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            Showing {totalRecords > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalRecords)} of <strong>{totalRecords}</strong> entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: '1px solid #CBD5E1',
                backgroundColor: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                color: currentPage === 1 ? '#94A3B8' : '#0F172A',
                fontSize: '12px', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>

            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', padding: '0 4px' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: '1px solid #CBD5E1',
                backgroundColor: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                color: currentPage === totalPages ? '#94A3B8' : '#0F172A',
                fontSize: '12px', fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Manual Checkout Confirmation Modal */}
      {checkoutModalVisitor && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '420px', backgroundColor: '#FFFFFF',
            borderRadius: '14px', border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Confirm Visitor Exit?
              </h3>
              <button onClick={() => setCheckoutModalVisitor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '12px 16px',
              border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Visitor Name:</span>
                <strong style={{ color: '#0F172A' }}>{checkoutModalVisitor.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Mobile Number:</span>
                <span style={{ color: '#0F172A', fontFamily: 'monospace' }}>{checkoutModalVisitor.mobile}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Host Employee:</span>
                <strong style={{ color: '#0F172A' }}>{checkoutModalVisitor.employeeToMeet}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Entry Time:</span>
                <span style={{ color: '#0F172A' }}>{formatSingleTime(checkoutModalVisitor.entryTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Meeting Completed:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>Yes</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setCheckoutModalVisitor(null)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  const officer = localStorage.getItem('securityOfficerName') || 'Main Gate Security';
                  await updateStatus(checkoutModalVisitor.id, 'COMPLETED', officer, {
                    exitTime: new Date().toISOString(),
                    checkedOutBy: officer
                  });
                  setCheckoutModalVisitor(null);
                }}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#059669', color: '#FFFFFF', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)'
                }}
              >
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Printable A5 Visitor Gate Pass Portal Container */}
      {printVisitor && createPortal(
        <div className="printable-a5-pass-root" style={{ display: 'none' }}>
          <div style={{
            width: '148mm', minHeight: '210mm', margin: '0 auto', padding: '16px',
            backgroundColor: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '8px',
            fontFamily: 'Inter, system-ui, sans-serif', color: '#0F172A', boxSizing: 'border-box'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '10px', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                VISITOR GATE PASS
              </h2>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                ENTERPRISE GATE ACCESS AUTHORIZATION TICKET
              </div>
            </div>

            {/* Pass Metadata */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 10px', backgroundColor: '#F1F5F9', borderRadius: '4px', marginBottom: '12px' }}>
              <div>Pass ID: <strong>{printVisitor.id}</strong></div>
              <div>Status: <strong>{printVisitor.status.replace('_', ' ')}</strong></div>
              <div>Gate: <strong>{printVisitor.gateId || 'Main Gate 01'}</strong></div>
            </div>

            {/* Main Info Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Visitor Name:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{printVisitor.name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Mobile Number:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontFamily: 'monospace' }}>{printVisitor.mobile}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Company:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{printVisitor.company || 'Personal Visit'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Host Employee:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{printVisitor.employeeToMeet}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Department:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{printVisitor.department || 'General'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Purpose of Visit:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{printVisitor.purpose || 'General Visit'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Check In Time:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{formatSingleLineDT(printVisitor.entryTime || printVisitor.registrationTime)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Check Out Time:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{printVisitor.exitTime ? formatSingleLineDT(printVisitor.exitTime) : 'Inside Premises'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Total Duration:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{calculateDuration(printVisitor)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>Security Officer:</td>
                  <td style={{ padding: '6px', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>{printVisitor.checkedInBy || 'Main Gate Security'}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer Authorization Signatures */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingTop: '16px', borderTop: '1px dashed #0F172A' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '30px' }} />
                <div>______________________</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>Visitor Signature</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '30px' }} />
                <div>______________________</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>Security Stamp & Sign</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Audit & Gate Pass Modal */}
      <AuditTimelineModal
        isOpen={!!timelineVisitorId}
        onClose={() => setTimelineVisitorId(null)}
        visitorId={timelineVisitorId}
      />

    </div>
  );
};
