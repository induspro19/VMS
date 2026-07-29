import React, { useEffect, useState } from 'react';

import { useVisitor, getVisitorSession, clearVisitorSession } from '../../context/VisitorContext';
import { SelfRegistrationPortal } from './SelfRegistrationPortal';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const GatePortal: React.FC = () => {
  const { visitors, updateStatus } = useVisitor();
  const [sessionState, setSessionState] = useState<{
    isChecked: boolean;
    hasSession: boolean;
    visitor: any;
    checkoutComplete: boolean;
    duration: string;
  }>({
    isChecked: false,
    hasSession: false,
    visitor: null,
    checkoutComplete: false,
    duration: ''
  });

  useEffect(() => {
    const session = getVisitorSession();
    if (!session) {
      setSessionState(s => ({ ...s, isChecked: true, hasSession: false }));
      return;
    }

    const activeVisitor = visitors.find(v => v.id === session.visitorId && v.sessionId === session.sessionId);
    
    if (!activeVisitor) {
      // Session invalid or visitor purged
      clearVisitorSession();
      setSessionState(s => ({ ...s, isChecked: true, hasSession: false }));
      return;
    }

    // Auto-checkout logic if ready
    if (activeVisitor.status === 'READY_FOR_EXIT' || activeVisitor.meetingCompleted) {
      handleCheckout(activeVisitor);
      return;
    }

    setSessionState({
      isChecked: true,
      hasSession: true,
      visitor: activeVisitor,
      checkoutComplete: false,
      duration: ''
    });

  }, [visitors]);

  const handleCheckout = async (visitor: any) => {
    const exitTime = new Date();
    const entryTime = new Date(visitor.entryTime || visitor.registrationTime);
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${hours}h ${minutes}m`;

    await updateStatus(visitor.id, 'COMPLETED', 'System', {
      exitTime: exitTime.toISOString()
    });

    setSessionState({
      isChecked: true,
      hasSession: true,
      visitor,
      checkoutComplete: true,
      duration
    });
  };

  const finishCheckout = () => {
    clearVisitorSession();
    window.location.reload();
  };

  if (!sessionState.isChecked) return null;

  if (!sessionState.hasSession) {
    return <SelfRegistrationPortal />;
  }

  const { visitor, checkoutComplete, duration } = sessionState;

  if (checkoutComplete) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', textAlign: 'center', maxWidth: '400px', width: '100%', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <CheckCircle size={64} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '24px', color: '#111827', marginBottom: '1.5rem', fontWeight: 700 }}>THANK YOU</h1>
          <p style={{ color: '#4B5563', fontSize: '15px', marginBottom: '1.5rem' }}>Thank you for visiting our company.</p>
          
          <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', textAlign: 'left', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Name</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{visitor.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Company</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{visitor.company}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Host</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{visitor.employeeToMeet}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Entry Time</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{new Date(visitor.entryTime || visitor.registrationTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Exit Time</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Visit Duration</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{duration}</span>
            </div>
          </div>
          
          <p style={{ color: '#4B5563', fontSize: '14px', fontStyle: 'italic', marginBottom: '1.5rem' }}>
            We look forward to seeing you again.
          </p>

          <Button variant="primary" style={{ width: '100%', height: '48px', fontSize: '16px' }} onClick={finishCheckout}>
            Finish
          </Button>
        </div>
      </div>
    );
  }

  // Active Session, not yet checked out
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', textAlign: 'center', maxWidth: '400px', width: '100%', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        
        {visitor.status === 'PENDING_APPROVAL' && (
          <>
            <Clock size={64} style={{ color: '#F59E0B', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '20px', color: '#111827', marginBottom: '0.5rem', fontWeight: 600 }}>Pending Approval</h2>
            <p style={{ color: '#6B7280', fontSize: '15px' }}>Your registration is awaiting host approval.</p>
          </>
        )}

        {visitor.status === 'APPROVED' && (
          <>
            <CheckCircle size={64} style={{ color: '#3B82F6', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '20px', color: '#111827', marginBottom: '0.5rem', fontWeight: 600 }}>Approved</h2>
            <p style={{ color: '#6B7280', fontSize: '15px' }}>Please proceed to the security desk for entry.</p>
          </>
        )}

        {visitor.status === 'INSIDE' && !visitor.meetingCompleted && (
          <>
            <AlertTriangle size={64} style={{ color: '#EF4444', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '20px', color: '#111827', marginBottom: '0.5rem', fontWeight: 600 }}>Checkout Not Allowed</h2>
            <p style={{ color: '#6B7280', fontSize: '15px' }}>Your meeting is still in progress.</p>
            <p style={{ color: '#6B7280', fontSize: '15px', marginTop: '1rem', fontWeight: 600 }}>Please contact your host.</p>
          </>
        )}

        {visitor.status === 'COMPLETED' && (
           <>
           <CheckCircle size={64} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
           <h2 style={{ fontSize: '20px', color: '#111827', marginBottom: '0.5rem', fontWeight: 600 }}>Already Checked Out</h2>
           <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '1rem' }}>Thank you for visiting.</p>
           <Button variant="outline" onClick={finishCheckout}>Start New Registration</Button>
         </>
        )}

      </div>
    </div>
  );
};
