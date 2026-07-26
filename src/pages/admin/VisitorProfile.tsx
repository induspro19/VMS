import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVisitor } from '../../context/VisitorContext';
import { useCommunication } from '../../context/CommunicationContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, User, Phone, Building, Briefcase, Clock, Activity, MessageSquare } from 'lucide-react';

export const VisitorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { visitors, auditLogs } = useVisitor();
  const { logs: commsLogs } = useCommunication();

  const visitor = useMemo(() => visitors.find(v => v.id === id), [visitors, id]);
  
  const visitorHistory = useMemo(() => {
    if (!visitor) return [];
    return visitors.filter(v => v.mobile === visitor.mobile).sort((a, b) => new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime());
  }, [visitors, visitor]);

  const specificAuditLogs = useMemo(() => {
    if (!visitor) return [];
    return auditLogs.filter(log => log.visitorId === visitor.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, visitor]);

  const specificComms = useMemo(() => {
    if (!visitor) return [];
    return commsLogs.filter(log => log.visitorName === visitor.name).sort((a, b) => {
      const timeA = new Date(`${a.date} ${a.time}`).getTime();
      const timeB = new Date(`${b.date} ${b.time}`).getTime();
      return timeB - timeA;
    });
  }, [commsLogs, visitor]);

  if (!visitor) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Visitor not found.</p>
        <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>Go Back</Button>
      </div>
    );
  }

  // Calculate stats
  const totalVisits = visitorHistory.length;
  const forceExits = visitorHistory.filter(v => v.isOverride).length;
  const completedVisits = visitorHistory.filter(v => v.status === 'COMPLETED');
  
  let totalDurationMs = 0;
  completedVisits.forEach(v => {
    if (v.entryTime && v.exitTime) {
      totalDurationMs += new Date(v.exitTime).getTime() - new Date(v.entryTime).getTime();
    }
  });
  const avgDurationHours = completedVisits.length > 0 ? (totalDurationMs / completedVisits.length) / (1000 * 60 * 60) : 0;

  return (
    <div className="dashboard-layout animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div className="dashboard-header mb-4">
        <div>
          <h1 className="flex items-center gap-3 m-0 text-2xl">
            <Button variant="ghost" onClick={() => navigate(-1)} className="p-2"><ArrowLeft size={20}/></Button>
            Visitor Profile
          </h1>
        </div>
        <Badge variant={visitor.status === 'COMPLETED' ? 'default' : visitor.status === 'INSIDE' ? 'success' : visitor.status === 'REJECTED' ? 'danger' : 'warning'} className="text-base px-4 py-2">
          {visitor.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="dashboard-charts-grid" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Visit Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#111827' }}>
                  <User size={18} style={{ color: '#6B7280', flexShrink: 0 }} /> <strong>{visitor.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#374151' }}>
                  <Phone size={18} style={{ color: '#6B7280', flexShrink: 0 }} /> {visitor.mobile}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#374151' }}>
                  <Building size={18} style={{ color: '#6B7280', flexShrink: 0 }} /> {visitor.company}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#374151' }}>
                  <Briefcase size={18} style={{ color: '#6B7280', flexShrink: 0 }} /> <span>Host: <strong>{visitor.employeeToMeet}</strong> <span style={{color: '#6B7280'}}>({visitor.department})</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#374151' }}>
                  <Clock size={18} style={{ color: '#6B7280', flexShrink: 0 }} /> Reg: {new Date(visitor.registrationTime).toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#374151' }}>
                  <Activity size={18} style={{ color: '#6B7280', flexShrink: 0 }} /> Purpose: {visitor.purpose}
                </div>
                
                {visitor.entryTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#059669', fontWeight: 500 }}>
                    <Clock size={18} style={{ flexShrink: 0 }} /> In: {new Date(visitor.entryTime).toLocaleString()}
                  </div>
                )}
                {visitor.exitTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#374151' }}>
                    <Clock size={18} style={{ color: '#6B7280', flexShrink: 0 }} /> Out: {new Date(visitor.exitTime).toLocaleString()}
                  </div>
                )}
              </div>
              {visitor.isOverride && (
                <div className="mt-4 p-3 bg-danger-light text-danger rounded-md">
                  <strong>Force Exit Triggered:</strong> {visitor.overrideReason}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit & Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              <div className="flex flex-col gap-4 relative pl-6 border-l-2 border-color">
                {specificAuditLogs.map(log => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                    <div className="text-sm text-secondary">{new Date(log.timestamp).toLocaleString()} • {log.actor} ({log.role})</div>
                    <div className="font-medium">{log.action}</div>
                    {log.oldValue && log.newValue && (
                      <div className="text-xs text-muted mt-1">
                        <span className="line-through">{log.oldValue}</span> → {log.newValue}
                      </div>
                    )}
                    {log.reason && (
                      <div className="text-xs text-danger mt-1">Reason: {log.reason}</div>
                    )}
                    <div className="text-[11px] text-muted mt-1">IP: {log.ipPlaceholder} • Device: {log.devicePlaceholder}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              {specificComms.length === 0 && <p className="text-muted">No communication logs found.</p>}
              <div className="flex flex-col gap-3">
                {specificComms.map(log => (
                  <div key={log.id} className="flex gap-4 p-3 bg-input rounded-md">
                    <MessageSquare size={20} className={String(log.type).toUpperCase() === 'WHATSAPP' ? 'text-success' : 'text-info'} />
                    <div>
                      <div className="text-sm font-medium">{log.template}</div>
                      <div className="text-xs text-secondary">{log.date} {log.time} • To: {log.recipient}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Statistics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between">
                <span className="text-secondary">Total Visits</span>
                <strong>{totalVisits}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Force Exits</span>
                <strong className={forceExits > 0 ? 'text-danger' : ''}>{forceExits}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Avg Duration</span>
                <strong>{avgDurationHours.toFixed(1)}h</strong>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {visitorHistory.filter(v => v.id !== visitor.id).map(v => (
                  <div key={v.id} className="ui-card p-3 cursor-pointer hover:bg-card-hover" onClick={() => navigate(`/visitor/${v.id}`)}>
                    <div className="text-sm font-medium">{new Date(v.registrationTime).toLocaleDateString()}</div>
                    <div className="text-xs text-secondary mt-1">Host: {v.employeeToMeet}</div>
                    <Badge variant={v.status === 'COMPLETED' ? 'default' : 'warning'} className="mt-2 text-[10px]">{v.status}</Badge>
                  </div>
                ))}
                {visitorHistory.length <= 1 && <p className="text-muted text-sm">No previous visits.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
