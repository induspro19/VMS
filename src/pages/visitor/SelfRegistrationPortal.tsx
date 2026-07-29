import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useVisitor } from '../../context/VisitorContext';
import { useAppUsers } from '../../context/UserContext';
import { useSettings } from '../../context/SettingsContext';

import { Button } from '../../components/ui/Button';

export const SelfRegistrationPortal: React.FC = () => {
  const { registerVisitor, getVisitorHistory } = useVisitor();
  const { users } = useAppUsers();
  const { settings } = useSettings();
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mobile: '',
    department: '',
    employeeToMeet: '',
    hostEmployeeId: '',
    purpose: '',
    otherPurpose: '',
    vehicleNumber: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [welcomeBack, setWelcomeBack] = useState('');
  // Smart Duplicate Detection
  useEffect(() => {
    if (formData.mobile.length >= 10) {
      const history = getVisitorHistory(formData.mobile);
      if (history.length > 0) {
        const lastVisit = history[0];
        setFormData(prev => ({
          ...prev,
          name: prev.name || lastVisit.name,
          company: prev.company || lastVisit.company,
          department: prev.department || lastVisit.department,
          employeeToMeet: prev.employeeToMeet || lastVisit.employeeToMeet,
          vehicleNumber: prev.vehicleNumber || lastVisit.vehicleNumber || ''
        }));
        
        const lastVisitDate = new Date(lastVisit.registrationTime).toLocaleDateString();
        setWelcomeBack(`Welcome back, ${lastVisit.name}! (Last visit: ${lastVisitDate})`);
      } else {
        setWelcomeBack('');
      }
    } else {
      setWelcomeBack('');
    }
  }, [formData.mobile]);

  // All active host users from User Management
  const activeHosts = React.useMemo(() =>
    users.filter(u => u.isActive && (u.role === 'EMPLOYEE' || u.role === 'ADMIN' || u.role === 'HR'))
  , [users]);

  // Departments from master — filtered to only those that have at least one active host
  const departments = settings.departments;

  // Hosts filtered by selected department
  const filteredHosts = React.useMemo(() => {
    if (!formData.department) return activeHosts;
    return activeHosts.filter(u => u.department === formData.department);
  }, [activeHosts, formData.department]);

  // When host is selected → auto-fill department
  const handleHostChange = (hostName: string) => {
    const host = activeHosts.find(u => u.name === hostName);
    setFormData(prev => ({
      ...prev,
      employeeToMeet: hostName,
      hostEmployeeId: host?.id || '',
      // Auto-fill department if host has one and no dept selected yet
      department: host?.department || prev.department,
    }));
  };

  // When department changes → clear host if host doesn't belong to new dept
  const handleDepartmentChange = (dept: string) => {
    const currentHost = activeHosts.find(u => u.name === formData.employeeToMeet);
    const hostStillValid = currentHost && (!currentHost.department || currentHost.department === dept);
    setFormData(prev => ({
      ...prev,
      department: dept,
      employeeToMeet: hostStillValid ? prev.employeeToMeet : '',
      hostEmployeeId: hostStillValid ? prev.hostEmployeeId : '',
    }));
  };

  const purposes = settings.visitorPurposes.length > 0 ? settings.visitorPurposes : ['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Personal', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name || !formData.company || !formData.mobile || !formData.department || !formData.employeeToMeet || !formData.purpose) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.purpose === 'Other' && !formData.otherPurpose) {
      setError('Please specify the purpose of your visit.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Small delay to prevent rapid accidental double taps
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await registerVisitor({
        name: formData.name,
        company: formData.company,
        mobile: formData.mobile,
        department: formData.department,
        employeeToMeet: formData.employeeToMeet,
        hostEmployeeId: formData.hostEmployeeId,
        purpose: formData.purpose === 'Other' ? formData.otherPurpose : formData.purpose,
        vehicleNumber: formData.vehicleNumber
      });

      setIsSuccess(true);
      // Reset form
      setFormData({
        name: '', company: '', mobile: '', department: '', employeeToMeet: '', hostEmployeeId: '', purpose: '', otherPurpose: '', vehicleNumber: ''
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputStyle = { 
    fontSize: '15px', 
    backgroundColor: '#FFFFFF', 
    border: '1px solid #D1D5DB', 
    borderRadius: '8px', 
    margin: 0,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const selectStyle = { ...inputStyle, width: '100%', padding: '0.75rem 1rem', color: '#374151', height: '48px', appearance: 'none' as const, marginBottom: '1.25rem' };
  const nativeInputStyle = { ...inputStyle, width: '100%', padding: '0.75rem 1rem', color: '#111827', height: '48px', boxSizing: 'border-box' as const, marginBottom: '1.25rem' };

  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <CheckCircle size={48} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '0.5rem', fontWeight: 600 }}>Registration Complete</h2>
          <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: '1.5' }}>
            Details Submitted Successfully. Please wait at the gate. You will be notified once your host approves your entry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', padding: '0' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '2rem 1.5rem 1.5rem', backgroundColor: '#FFFFFF', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>Visitor Registration</h1>
          <p style={{ fontSize: '15px', color: '#6B7280', margin: 0 }}>Please fill out your details to enter</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '1rem', borderRadius: '8px', fontSize: '14px', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}
          {welcomeBack && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #6EE7B7', color: '#047857', padding: '1rem', borderRadius: '8px', fontSize: '14px', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
              {welcomeBack}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Full Name *</label>
            <input 
              className="ui-input-focus"
              placeholder="John Doe" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={nativeInputStyle}
              required
            />

            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Company Name *</label>
            <input 
              className="ui-input-focus"
              placeholder="Acme Corp" 
              value={formData.company} 
              onChange={e => setFormData({...formData, company: e.target.value})}
              style={nativeInputStyle}
              required
            />

            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Mobile Number *</label>
            <input 
              className="ui-input-focus"
              type="tel"
              placeholder="+1 234 567 8900" 
              value={formData.mobile} 
              onChange={e => setFormData({...formData, mobile: e.target.value})}
              style={nativeInputStyle}
              required
            />

            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Host / Employee *</label>
            <select
              className="ui-input-focus"
              value={formData.employeeToMeet}
              onChange={e => handleHostChange(e.target.value)}
              style={selectStyle}
              required
            >
              <option value="" disabled>Select Employee</option>
              {filteredHosts.map(u => (
                <option key={u.id} value={u.name}>
                  {u.name}{u.department ? ` — ${u.department}` : ''}
                </option>
              ))}
            </select>

            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Department to Visit *</label>
            <select
              className="ui-input-focus"
              value={formData.department}
              onChange={e => handleDepartmentChange(e.target.value)}
              style={selectStyle}
              required
            >
              <option value="" disabled>Select Department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Purpose of Visit *</label>
            <select 
              className="ui-input-focus"
              value={formData.purpose} 
              onChange={e => setFormData({...formData, purpose: e.target.value})}
              style={selectStyle}
              required
            >
              <option value="" disabled>Select Purpose</option>
              {purposes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {formData.purpose === 'Other' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px', display: 'block' }}>Please specify purpose *</label>
                <input 
                  className="ui-input-focus"
                  placeholder="E.g., Site Inspection" 
                  value={formData.otherPurpose} 
                  onChange={e => setFormData({...formData, otherPurpose: e.target.value})}
                  style={nativeInputStyle}
                  required
                />
              </div>
            )}

            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Vehicle Number (Optional)</label>
            <input 
              className="ui-input-focus"
              placeholder="e.g. MH-12-AB-1234" 
              value={formData.vehicleNumber} 
              onChange={e => setFormData({...formData, vehicleNumber: e.target.value})}
              style={nativeInputStyle}
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            style={{ width: '100%', marginTop: '1rem', height: '48px', fontSize: '16px', borderRadius: '8px', fontWeight: 500 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Details'}
          </Button>

        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ui-input-focus:focus {
          border-color: #000000 !important;
          outline: none;
          box-shadow: 0 0 0 1px #000000;
        }
      `}</style>
    </div>
  );
};
