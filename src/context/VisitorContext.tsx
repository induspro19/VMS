import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type VisitorStatus = 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'INSIDE' 
  | 'READY_FOR_EXIT' 
  | 'COMPLETED';

export interface AuditLog {
  id: string;
  visitorId: string;
  action: string;
  timestamp: string;
  actor: string;
  role: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  ipPlaceholder?: string;
  devicePlaceholder?: string;
}

export interface Visitor {
  id: string;
  name: string;
  mobile: string;
  company: string;
  department: string;
  employeeToMeet: string;
  hostEmployeeId?: string;
  purpose: string;
  vehicleNumber?: string;
  status: VisitorStatus;
  registrationTime: string;
  entryTime?: string;
  exitTime?: string;
  checkoutToken?: string;
  qrToken?: string;
  isOverride?: boolean;
  overrideReason?: string;
  overrideTime?: string;
  overrideBy?: string;
  isPreRegistered?: boolean;
  expectedEntryTime?: string;
  deviceId?: string;
  ipAddress?: string;
  visitorType?: string;
  meetingCompleted?: boolean;
  readyForExit?: boolean;
  meetingCompletedTime?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
  totalVisitDuration?: string;
  whatsappSent?: boolean;
  whatsappSentTime?: string;
  gateId?: string;
  sessionId?: string;
  registrationMetadata?: {
    ip: string;
    browser: string;
    os: string;
    device: string;
    timezone: string;
    language: string;
    screenResolution: string;
  };
  checkoutMetadata?: {
    ip: string;
    browser: string;
    os: string;
    device: string;
  };
  auditTimeline?: Array<{
    time: string;
    action: string;
    user: string;
  }>;
}

interface VisitorContextType {
  visitors: Visitor[];
  auditLogs: AuditLog[];
  registerVisitor: (data: Omit<Visitor, 'id' | 'status' | 'registrationTime'>) => Promise<string> | string;
  preRegisterVisitor: (data: Omit<Visitor, 'id' | 'status' | 'registrationTime' | 'isPreRegistered'>) => Promise<string> | string;
  updateStatus: (id: string, status: VisitorStatus, actor: string, extra?: Partial<Visitor>, isForceExit?: boolean) => void;
  getVisitorById: (id: string) => Visitor | undefined;
  getVisitorHistory: (mobile: string) => Visitor[];
}

export const setVisitorSession = (visitorId: string, sessionId: string) => {
  localStorage.setItem('activeVisitorId', visitorId);
  localStorage.setItem('activeSessionId', sessionId);
};

export const getVisitorSession = () => {
  const visitorId = localStorage.getItem('activeVisitorId');
  const sessionId = localStorage.getItem('activeSessionId');
  return visitorId && sessionId ? { visitorId, sessionId } : null;
};

export const clearVisitorSession = () => {
  localStorage.removeItem('activeVisitorId');
  localStorage.removeItem('activeSessionId');
};

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

const getBrowserMetadata = () => {
  return {
    ip: 'UNKNOWN',
    browser: navigator.userAgent,
    os: navigator.platform,
    device: /Mobile|Android|iP(ad|hone)/.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`
  };
};

const mapDbToVisitor = (db: any): Visitor => {
  const status = db.status as VisitorStatus;
  console.log('Loaded status from Supabase:', db.id, db.status, 'ready_for_exit:', db.ready_for_exit);
  const isCompleted = status === 'COMPLETED';
  return {
    id: db.id,
    name: db.name || '',
    mobile: db.mobile || '',
    company: db.company || '',
    department: db.department || '',
    employeeToMeet: db.employee_to_meet || db.employeeToMeet || '',
    hostEmployeeId: db.host_employee_id || db.hostEmployeeId,
    purpose: db.purpose || '',
    vehicleNumber: db.vehicle_number || db.vehicleNumber,
    status: status,
    registrationTime: db.registration_time || db.registrationTime || new Date().toISOString(),
    entryTime: db.entry_time || db.entryTime,
    exitTime: db.exit_time || db.exitTime,
    checkoutToken: db.checkout_token || db.checkoutToken,
    isOverride: db.is_override ?? db.isOverride,
    overrideReason: db.override_reason || db.overrideReason,
    overrideTime: db.override_time || db.overrideTime,
    overrideBy: db.override_by || db.overrideBy,
    isPreRegistered: db.is_pre_registered ?? db.isPreRegistered,
    expectedEntryTime: db.expected_entry_time || db.expectedEntryTime,
    deviceId: db.device_id || db.deviceId,
    ipAddress: db.ip_address || db.ipAddress,
    qrToken: db.qr_token || db.qrToken,
    visitorType: db.visitor_type || db.visitorType,
    meetingCompleted: isCompleted ? true : (db.meeting_completed ?? db.meetingCompleted),
    readyForExit: isCompleted ? false : (db.ready_for_exit ?? db.readyForExit),
    meetingCompletedTime: db.meeting_completed_time || db.meetingCompletedTime,
    checkedInBy: db.checked_in_by || db.checkedInBy,
    checkedOutBy: db.checked_out_by || db.checkedOutBy,
    totalVisitDuration: db.total_visit_duration || db.totalVisitDuration,
    whatsappSent: db.whatsapp_sent ?? db.whatsappSent,
    whatsappSentTime: db.whatsapp_sent_time || db.whatsappSentTime,
    gateId: db.gate_id || db.gateId,
    sessionId: db.session_id || db.sessionId,
    registrationMetadata: db.registration_metadata || db.registrationMetadata,
    checkoutMetadata: db.checkout_metadata || db.checkoutMetadata,
    auditTimeline: db.audit_timeline || db.auditTimeline || [],
  };
};

const mapVisitorToDb = (v: Partial<Visitor>) => {
  const db: any = {};
  if (v.id !== undefined) db.id = v.id;
  if (v.name !== undefined) db.name = v.name;
  if (v.mobile !== undefined) db.mobile = v.mobile;
  if (v.company !== undefined) db.company = v.company;
  if (v.department !== undefined) db.department = v.department;
  if (v.employeeToMeet !== undefined) db.employee_to_meet = v.employeeToMeet;
  if (v.hostEmployeeId !== undefined) db.host_employee_id = v.hostEmployeeId;
  if (v.purpose !== undefined) db.purpose = v.purpose;
  if (v.vehicleNumber !== undefined) db.vehicle_number = v.vehicleNumber;
  if (v.status !== undefined) db.status = v.status;
  if (v.registrationTime !== undefined) db.registration_time = v.registrationTime;
  if (v.entryTime !== undefined) db.entry_time = v.entryTime;
  if (v.exitTime !== undefined) db.exit_time = v.exitTime;
  if (v.checkoutToken !== undefined) db.checkout_token = v.checkoutToken;
  if (v.isOverride !== undefined) db.is_override = v.isOverride;
  if (v.overrideReason !== undefined) db.override_reason = v.overrideReason;
  if (v.overrideTime !== undefined) db.override_time = v.overrideTime;
  if (v.overrideBy !== undefined) db.override_by = v.overrideBy;
  if (v.isPreRegistered !== undefined) db.is_pre_registered = v.isPreRegistered;
  if (v.expectedEntryTime !== undefined) db.expected_entry_time = v.expectedEntryTime;
  if (v.deviceId !== undefined) db.device_id = v.deviceId;
  if (v.ipAddress !== undefined) db.ip_address = v.ipAddress;
  if (v.qrToken !== undefined) db.qr_token = v.qrToken;
  if (v.visitorType !== undefined) db.visitor_type = v.visitorType;
  if (v.meetingCompleted !== undefined) db.meeting_completed = v.meetingCompleted;
  if (v.readyForExit !== undefined) db.ready_for_exit = v.readyForExit;
  if (v.meetingCompletedTime !== undefined) db.meeting_completed_time = v.meetingCompletedTime;
  if (v.checkedInBy !== undefined) db.checked_in_by = v.checkedInBy;
  if (v.checkedOutBy !== undefined) db.checked_out_by = v.checkedOutBy;
  if (v.totalVisitDuration !== undefined) db.total_visit_duration = v.totalVisitDuration;
  if (v.whatsappSent !== undefined) db.whatsapp_sent = v.whatsappSent;
  if (v.whatsappSentTime !== undefined) db.whatsapp_sent_time = v.whatsappSentTime;
  if (v.gateId !== undefined) db.gate_id = v.gateId;
  if (v.sessionId !== undefined) db.session_id = v.sessionId;
  if (v.registrationMetadata !== undefined) db.registration_metadata = v.registrationMetadata;
  if (v.checkoutMetadata !== undefined) db.checkout_metadata = v.checkoutMetadata;
  if (v.auditTimeline !== undefined) db.audit_timeline = v.auditTimeline;
  return db;
};

const mapDbToAuditLog = (db: any): AuditLog => ({
  id: db.id,
  visitorId: db.visitor_id || db.visitorId || '',
  action: db.action || '',
  timestamp: db.timestamp || new Date().toISOString(),
  actor: db.actor || '',
  role: db.role || '',
  oldValue: db.old_value || db.oldValue,
  newValue: db.new_value || db.newValue,
  reason: db.reason,
  ipPlaceholder: db.ip_placeholder || db.ipPlaceholder,
  devicePlaceholder: db.device_placeholder || db.devicePlaceholder,
});

const mapAuditLogToDb = (log: AuditLog) => ({
  id: log.id,
  visitor_id: log.visitorId,
  action: log.action,
  timestamp: log.timestamp,
  actor: log.actor,
  role: log.role,
  old_value: log.oldValue || null,
  new_value: log.newValue || null,
  reason: log.reason || null,
  ip_placeholder: log.ipPlaceholder || null,
  device_placeholder: log.devicePlaceholder || null,
});

export const VisitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visitors, setVisitors] = useState<Visitor[]>(() => {
    const saved = localStorage.getItem('vms_visitors');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('vms_audit');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to local storage for instant offline / cache fallback
  useEffect(() => {
    localStorage.setItem('vms_visitors', JSON.stringify(visitors));
  }, [visitors]);

  useEffect(() => {
    localStorage.setItem('vms_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Initial Fetch & Realtime Listeners with Supabase
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const { data: visitorData, error: visitorError } = await supabase
          .from('visitors')
          .select('*')
          .order('registration_time', { ascending: false });

        if (!visitorError && visitorData && isMounted) {
          setVisitors(visitorData.map(mapDbToVisitor));
        }

        const { data: auditData, error: auditError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!auditError && auditData && isMounted) {
          setAuditLogs(auditData.map(mapDbToAuditLog));
        }
      } catch (err) {
        console.warn('Supabase fetch notice (local fallback active):', err);
      }
    };

    fetchInitialData();

    // Subscribe to realtime visitor updates
    const visitorChannel = supabase
      .channel('public:visitors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newV = mapDbToVisitor(payload.new);
            setVisitors(prev => {
              const existing = prev.find(v => v.id === newV.id);
              const preserved = existing ? { ...newV, sessionId: newV.sessionId || existing.sessionId, qrToken: newV.qrToken || existing.qrToken } : newV;
              return [preserved, ...prev.filter(v => v.id !== newV.id)];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedV = mapDbToVisitor(payload.new);
            setVisitors(prev => prev.map(v => v.id === updatedV.id ? { ...updatedV, sessionId: updatedV.sessionId || v.sessionId, qrToken: updatedV.qrToken || v.qrToken } : v));
          } else if (payload.eventType === 'DELETE') {
            setVisitors(prev => prev.filter(v => v.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to realtime audit_logs updates
    const auditChannel = supabase
      .channel('public:audit_logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLog = mapDbToAuditLog(payload.new);
            setAuditLogs(prev => [newLog, ...prev.filter(l => l.id !== newLog.id)]);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(visitorChannel);
      supabase.removeChannel(auditChannel);
    };
  }, []);

  const addAuditLog = async (
    visitorId: string, 
    action: string, 
    actor: string, 
    role: string = 'System',
    oldValue?: string,
    newValue?: string,
    reason?: string
  ) => {
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      visitorId,
      action,
      timestamp: new Date().toISOString(),
      actor,
      role,
      oldValue,
      newValue,
      reason,
      ipPlaceholder: '192.168.1.100',
      devicePlaceholder: 'Chrome / Windows',
    };
    
    setAuditLogs(prev => [log, ...prev]);

    try {
      await supabase.from('audit_logs').insert([mapAuditLogToDb(log)]);
    } catch (err) {
      console.warn('Supabase audit log insert notice:', err);
    }
  };

  const registerVisitor = async (data: Omit<Visitor, 'id' | 'status' | 'registrationTime'>) => {
    const activeVisit = visitors.find(v => 
      v.mobile === data.mobile && 
      ['PENDING_APPROVAL', 'APPROVED', 'INSIDE', 'READY_FOR_EXIT'].includes(v.status)
    );
    if (activeVisit) {
      throw new Error(`Visitor with mobile ${data.mobile} already has an active visit.`);
    }

    let ip = 'UNKNOWN';
    if (navigator.onLine) {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
          const json = await res.json();
          ip = json.ip;
        }
      } catch (e) {
        // fail gracefully
      }
    }

    const metadata = getBrowserMetadata();
    metadata.ip = ip;

    const sessionId = crypto.randomUUID();

    const newVisitor: Visitor = {
      ...data,
      id: crypto.randomUUID(),
      sessionId,
      status: 'PENDING_APPROVAL',
      registrationTime: new Date().toISOString(),
      registrationMetadata: metadata,
      auditTimeline: [{
        time: new Date().toISOString(),
        action: 'REGISTERED',
        user: data.name || 'Visitor'
      }]
    };

    setVisitorSession(newVisitor.id, sessionId);
    setVisitors(prev => [newVisitor, ...prev]);
    addAuditLog(newVisitor.id, 'Registered', data.name, 'Visitor', '', 'PENDING_APPROVAL');

    try {
      await supabase.from('visitors').insert([mapVisitorToDb(newVisitor)]);

      if (newVisitor.hostEmployeeId) {
        supabase.functions.invoke('send-host-push', {
          body: {
            hostEmployeeId: newVisitor.hostEmployeeId,
            visitorName: newVisitor.name,
            visitorId: newVisitor.id,
            company: newVisitor.company
          }
        }).catch(err => console.warn('Push function failed:', err));
      }
    } catch (err) {
      console.warn('Supabase visitor insert notice:', err);
    }

    return newVisitor.id;
  };

  const updateStatus = async (id: string, newStatus: VisitorStatus, actor: string, extra?: Partial<Visitor>, isForceExit?: boolean) => {
    const target = visitors.find(v => v.id === id);
    if (!target) {
      console.warn(`[updateStatus] Visitor not found for ID: ${id}`);
      return;
    }

    console.log('Status before update:', target.status);

    let validTransitions: Record<VisitorStatus, VisitorStatus[]> = {
      'PENDING_APPROVAL': ['APPROVED', 'REJECTED'],
      'APPROVED': ['INSIDE', 'REJECTED'],
      'INSIDE': ['READY_FOR_EXIT', 'COMPLETED', 'INSIDE'],
      'READY_FOR_EXIT': ['COMPLETED', 'INSIDE'],
      'COMPLETED': [],
      'REJECTED': []
    };
    
    if (isForceExit && target.status === 'INSIDE') {
      validTransitions['INSIDE'].push('COMPLETED');
    }
    
    if (!validTransitions[target.status].includes(newStatus)) {
      console.warn(`Invalid workflow transition from ${target.status} to ${newStatus}`);
      return;
    }

    let additionalData = { ...extra };
    if (newStatus === 'INSIDE') {
      if (!additionalData.entryTime) additionalData.entryTime = new Date().toISOString();
      if (!additionalData.checkedInBy) additionalData.checkedInBy = actor;
    }
    if (newStatus === 'READY_FOR_EXIT') {
      additionalData.readyForExit = true;
      additionalData.meetingCompleted = true;
    }
    if (newStatus === 'COMPLETED') {
      if (!additionalData.exitTime) additionalData.exitTime = new Date().toISOString();
      additionalData.readyForExit = false;
      additionalData.meetingCompleted = true;
      if (!additionalData.checkedOutBy) additionalData.checkedOutBy = actor;
    }

    const updatedVisitor: Visitor = {
      ...target,
      status: newStatus,
      ...additionalData,
      auditTimeline: [
        ...(target.auditTimeline || []),
        {
          time: new Date().toISOString(),
          action: newStatus,
          user: actor || 'System'
        }
      ]
    };

    // 1. AWAIT Supabase update query FIRST before changing UI state
    const dbPayload = mapVisitorToDb(updatedVisitor);
    try {
      let { data, error } = await supabase
        .from('visitors')
        .update(dbPayload)
        .eq('id', id)
        .select();

      // If a newly added column is missing from Supabase schema, retry with core columns fallback
      if (error && (error.message?.includes('schema cache') || error.code === 'PGRST204')) {
        console.warn('Supabase schema missing column notice, retrying with core payload:', error.message);
        const corePayload: any = {
          status: updatedVisitor.status
        };
        if (updatedVisitor.exitTime) corePayload.exit_time = updatedVisitor.exitTime;
        if (updatedVisitor.entryTime) corePayload.entry_time = updatedVisitor.entryTime;
        if (updatedVisitor.readyForExit !== undefined) corePayload.ready_for_exit = updatedVisitor.readyForExit;
        if (updatedVisitor.meetingCompleted !== undefined) corePayload.meeting_completed = updatedVisitor.meetingCompleted;

        const retryRes = await supabase
          .from('visitors')
          .update(corePayload)
          .eq('id', id)
          .select();

        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.error('Supabase update error:', error);
        alert(`Supabase Checkout Update Failed: ${error.message || JSON.stringify(error)}`);
      } else {
        console.log('Supabase response:', data);
      }
    } catch (err) {
      console.error('Supabase update status exception:', err);
    }

    console.log('Status after update:', newStatus);

    // 2. Synchronously update local state and LocalStorage
    setVisitors(prev => {
      const next = prev.map(v => v.id === id ? updatedVisitor : v);
      try {
        localStorage.setItem('vms_visitors', JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return next;
    });

    if (isForceExit && additionalData.overrideReason) {
      addAuditLog(id, `Status Override: ${newStatus.replace('_', ' ')}`, actor, 'Security', target.status, newStatus, additionalData.overrideReason);
    } else {
      addAuditLog(id, `Status Updated: ${newStatus.replace('_', ' ')}`, actor, actor === 'System' ? 'System' : 'Employee/Security', target.status, newStatus);
    }
  };

  const getVisitorById = (id: string) => {
    return visitors.find(v => v.id === id);
  };

  const getVisitorHistory = (mobile: string) => {
    return visitors.filter(v => v.mobile === mobile).sort((a, b) => new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime());
  };

  const preRegisterVisitor = async (data: Omit<Visitor, 'id' | 'status' | 'registrationTime' | 'isPreRegistered'>) => {
    let ip = 'UNKNOWN';
    if (navigator.onLine) {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
          const json = await res.json();
          ip = json.ip;
        }
      } catch (e) {
        // fail gracefully
      }
    }

    const metadata = getBrowserMetadata();
    metadata.ip = ip;

    const newVisitor: Visitor = {
      ...data,
      id: crypto.randomUUID(),
      status: 'APPROVED',
      registrationTime: new Date().toISOString(),
      isPreRegistered: true,
      registrationMetadata: metadata,
      auditTimeline: [{
        time: new Date().toISOString(),
        action: 'PRE-REGISTERED',
        user: data.employeeToMeet || 'Employee'
      }]
    };

    setVisitors(prev => [newVisitor, ...prev]);
    addAuditLog(newVisitor.id, 'Pre-Registered', data.employeeToMeet, 'Employee', '', 'APPROVED');

    try {
      await supabase.from('visitors').insert([mapVisitorToDb(newVisitor)]);
    } catch (err) {
      console.warn('Supabase pre-register notice:', err);
    }

    return newVisitor.id;
  };

  return (
    <VisitorContext.Provider value={{ visitors, auditLogs, registerVisitor, preRegisterVisitor, updateStatus, getVisitorById, getVisitorHistory }}>
      {children}
    </VisitorContext.Provider>
  );
};

export const useVisitor = () => {
  const context = useContext(VisitorContext);
  if (context === undefined) {
    throw new Error('useVisitor must be used within a VisitorProvider');
  }
  return context;
};
