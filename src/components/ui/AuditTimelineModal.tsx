import React from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { Button } from './Button';
import { CheckCircle, XCircle, LogIn, LogOut, FileText, UserPlus, ShieldAlert, Clock } from 'lucide-react';


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

  // Get all logs for this visitor and sort chronologically
  const visitorLogs = auditLogs
    .filter(log => log.visitorId === visitorId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getLogIcon = (action: string) => {
    if (action.includes('Registered')) return <UserPlus size={16} />;
    if (action.includes('APPROVED')) return <CheckCircle size={16} />;
    if (action.includes('REJECTED')) return <XCircle size={16} />;
    if (action.includes('INSIDE')) return <LogIn size={16} />;
    if (action.includes('READY_FOR_EXIT')) return <CheckCircle size={16} />;
    if (action.includes('FORCE EXIT') || action.includes('Reason')) return <ShieldAlert size={16} />;
    if (action.includes('COMPLETED')) return <LogOut size={16} />;
    return <FileText size={16} />;
  };

  const getLogColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('INSIDE') || action.includes('READY_FOR_EXIT')) return '#10B981'; // Emerald 500
    if (action.includes('REJECTED') || action.includes('FORCE EXIT') || action.includes('Reason')) return '#EF4444'; // Red 500
    if (action.includes('COMPLETED')) return '#3B82F6'; // Blue 500
    return '#475569'; // Slate 600 (Registered, default)
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '540px', padding: 0, overflow: 'hidden', backgroundColor: '#F9FAFB', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Visitor Audit Timeline</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
             ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          
          {/* Visitor Info Card */}
          <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 600, color: '#1E293B' }}>{visitor.name}</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{visitor.company} • Host: {visitor.employeeToMeet}</p>
          </div>
          
          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '8px' }}>
            {/* Vertical Line */}
            <div style={{ position: 'absolute', left: '23px', top: '32px', bottom: '0', width: '2px', backgroundColor: '#E2E8F0', zIndex: 0 }}></div>
            
            {visitorLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '20px', zIndex: 1, position: 'relative' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: '#FFFFFF',
                  border: `2px solid ${getLogColor(log.action)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: getLogColor(log.action),
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {getLogIcon(log.action)}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#1E293B', marginBottom: '4px' }}>{log.action}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(log.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>By: {log.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ padding: '16px 24px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} style={{ borderRadius: '8px', fontWeight: 500 }}>Close</Button>
        </div>
      </div>
    </div>
  );
};
