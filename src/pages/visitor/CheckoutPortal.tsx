import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVisitor } from '../../context/VisitorContext';
import type { Visitor } from '../../context/VisitorContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { LogOut, CheckCircle, AlertTriangle, QrCode, Building, Clock } from 'lucide-react';
import './RegisterPortal.css'; // Reuse container styles
import './CheckoutPortal.css'; // Specific boarding pass styles

export const CheckoutPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { getVisitorByToken, updateStatus } = useVisitor();
  const { toast } = useToast();
  
  // Use a local state for the visitor to persist data after token is stripped
  const [visitor, setVisitor] = useState<Visitor | undefined>(token ? getVisitorByToken(token) : undefined);
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    if (token) {
      const v = getVisitorByToken(token);
      if (v) setVisitor(v);
    }
  }, [token, getVisitorByToken]);

  const handleCheckout = async () => {
    setStatus('SCANNING');
    
    let ip = 'UNKNOWN';
    if (navigator.onLine) {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
          const json = await res.json();
          ip = json.ip;
        }
      } catch (e) {}
    }

    setTimeout(() => {
      if (visitor && visitor.status === 'INSIDE' && visitor.meetingCompleted) {
        
        const regMeta = visitor.registrationMetadata || {} as any;
        const currentBrowser = navigator.userAgent;
        
        if (ip !== 'UNKNOWN' && regMeta.ip && ip !== regMeta.ip) {
            toast('Information: IP Address changed during visit.', 'info');
        }
        
        let warning = '';
        if (regMeta.browser && currentBrowser !== regMeta.browser) {
            warning = 'Browser changed. Visitor appears to be checking out from another device. Continue?';
        }
        
        if (warning) {
            const proceed = window.confirm(warning);
            if (!proceed) {
                setStatus('IDLE');
                return;
            }
        }

        const exitTime = new Date().toISOString();
        updateStatus(visitor.id, 'COMPLETED', 'Security Scanner', { 
          exitTime,
          qrToken: undefined, // Invalidate token
          checkoutMetadata: {
             ip,
             browser: currentBrowser,
             os: navigator.platform,
             device: /Mobile|Android|iP(ad|hone)/.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
          }
        });
        
        setVisitor({ ...visitor, status: 'COMPLETED', exitTime });
        setStatus('SUCCESS');
        toast('Checkout Successful', 'success');
        
        navigate('/checkout', { replace: true });
      } else {
        setStatus('ERROR');
        toast('Checkout failed. Meeting not completed or invalid status.', 'error');
      }
    }, 1500);
  };

  const calculateDuration = (entry?: string, exit?: string) => {
    if (!entry || !exit) return 'N/A';
    const diffMins = Math.round((new Date(exit).getTime() - new Date(entry).getTime()) / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0) return `${hrs} hr ${mins} min`;
    return `${mins} min`;
  };

  if (!token && status !== 'SUCCESS') {
    return (
      <div className="portal-container animate-fade-in">
        <div className="portal-success-card" style={{ borderColor: 'var(--danger-color)' }}>
          <div className="success-icon" style={{ color: '#f87171' }}>
            <AlertTriangle size={48} />
          </div>
          <h2>Invalid or Expired Link</h2>
          <p>This checkout link is missing or no longer valid.</p>
        </div>
      </div>
    );
  }

  if (visitor && (!visitor.meetingCompleted || visitor.status !== 'INSIDE') && status !== 'SUCCESS') {
    return (
       <div className="portal-container animate-fade-in">
        <div className="portal-success-card" style={{ borderColor: 'var(--danger-color)' }}>
          <div className="success-icon" style={{ color: '#f87171' }}>
            <AlertTriangle size={48} />
          </div>
          <h2>Action Required</h2>
          <p>You cannot checkout yet. If you are still inside, please wait for your host to mark the meeting complete.</p>
        </div>
      </div>
    );
  }

  if (status === 'SUCCESS' && visitor) {
    return (
      <div className="portal-container animate-fade-in">
        <div className="boarding-pass-card">
          <div className="boarding-header">
            <Building size={32} />
            <h2>Enterprise VMS</h2>
          </div>
          
          <div className="boarding-success-icon">
            <CheckCircle size={64} />
          </div>
          
          <h1 className="boarding-thankyou">Thank You For Visiting</h1>
          
          <div className="boarding-details">
            <div className="detail-row">
              <span className="label">Visitor Name</span>
              <span className="value">{visitor.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Department</span>
              <span className="value">{visitor.department || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Person Visited</span>
              <span className="value">{visitor.employeeToMeet}</span>
            </div>
            
            <div className="detail-divider"></div>
            
            <div className="detail-grid">
              <div className="detail-col">
                <span className="label">Entry Time</span>
                <span className="value">{new Date(visitor.entryTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="detail-col text-right">
                <span className="label">Exit Time</span>
                <span className="value">{new Date(visitor.exitTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            
            <div className="detail-highlight">
              <Clock size={20} />
              <span>Total Duration: <strong>{calculateDuration(visitor.entryTime, visitor.exitTime)}</strong></span>
            </div>
          </div>
          
          <div className="boarding-footer">
            <p>Have a Safe Journey.</p>
            <Button variant="ghost" size="sm" onClick={() => toast('Feedback recorded. Thank you!', 'success')}>Give Feedback</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="portal-container animate-fade-in">
      <div className="portal-header">
        <LogOut size={32} className="portal-logo" />
        <h1>Visitor Checkout</h1>
        <p>Hi {visitor?.name}, your meeting is complete.</p>
      </div>

      <div className="portal-form" style={{ textAlign: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Please scan the Security Gate QR below to confirm your exit.
        </p>
        
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
          <QrCode size={120} style={{ color: 'var(--text-primary)' }} />
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full" 
          onClick={handleCheckout}
          isLoading={status === 'SCANNING'}
        >
          {status === 'SCANNING' ? 'Scanning QR...' : 'Simulate Scan QR'}
        </Button>
      </div>
    </div>
  );
};
