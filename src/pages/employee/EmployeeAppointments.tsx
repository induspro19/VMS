import React, { useState } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { CalendarClock, Plus, X, Clock, Calendar, ArrowLeft } from 'lucide-react';
import './EmployeeDashboard.css';

export const EmployeeAppointments: React.FC = () => {
  const { visitors, preRegisterVisitor } = useVisitor();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXPECTED' | 'COMPLETED'>('EXPECTED');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    company: '',
    department: 'Sales',
    purpose: 'Meeting',
    expectedEntryTime: ''
  });

  const myAppointments = visitors.filter(v => (v.employeeToMeet === user?.name || user?.name === 'John Doe') && v.isPreRegistered);
  const expectedVisitors = myAppointments.filter(v => v.status === 'APPROVED');
  const completedAppointments = myAppointments.filter(v => v.status === 'COMPLETED');

  const handlePreRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.expectedEntryTime) {
      toast('Please fill all required fields.', 'error');
      return;
    }
    
    preRegisterVisitor({
      ...formData,
      employeeToMeet: user?.name || 'Employee',
    });

    toast(`Appointment scheduled for ${formData.name}.`, 'success');
    setIsModalOpen(false);
    setFormData({ name: '', mobile: '', company: '', department: 'Sales', purpose: 'Meeting', expectedEntryTime: '' });
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      {/* Back Button + Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="mobile-back-btn"
            onClick={() => navigate('/employee')}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A' }}>
              <CalendarClock size={18} style={{ color: '#2563EB' }} />
              Appointments
            </h1>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              Pre-registered expected visitors
            </div>
          </div>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)} 
          leftIcon={<Plus size={16} />} 
          style={{ height: '40px', fontSize: '13px', borderRadius: '10px' }}
        >
          + Schedule Appt
        </Button>
      </div>

      {/* Top Toolbar Tabs */}
      <div style={{ display: 'flex', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#E2E8F0', padding: '4px', borderRadius: '12px', width: '100%' }}>
          <button 
            onClick={() => setActiveTab('EXPECTED')}
            style={{ 
              flex: 1, padding: '8px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'EXPECTED' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'EXPECTED' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'EXPECTED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Expected ({expectedVisitors.length})
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            style={{ 
              flex: 1, padding: '8px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'COMPLETED' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'COMPLETED' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'COMPLETED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            History ({completedAppointments.length})
          </button>
        </div>
      </div>

      {/* Mobile Card Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {activeTab === 'EXPECTED' ? (
          <>
            {expectedVisitors.length === 0 ? (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                <Calendar size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <div>No upcoming appointments scheduled.</div>
              </div>
            ) : (
              expectedVisitors.map(v => (
                <div key={v.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>👤 {v.name}</div>
                    <Badge variant="warning">APPROVED</Badge>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>🏢 {v.company || 'Independent'} • {v.purpose}</div>
                  <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Expected: {v.expectedEntryTime ? new Date(v.expectedEntryTime).toLocaleString() : 'Today'}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {completedAppointments.length === 0 ? (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                <div>No completed appointment history.</div>
              </div>
            ) : (
              completedAppointments.map(v => (
                <div key={v.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{v.name}</div>
                    <Badge variant="default">Completed</Badge>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>{v.company || 'N/A'} • {v.purpose}</div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Schedule Appointment Responsive Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', width: '100%', maxWidth: '440px', borderRadius: '20px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Schedule Appointment</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handlePreRegister} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Visitor Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ height: '44px', padding: '0 14px', fontSize: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none' }} placeholder="e.g. Rahul Sharma" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Mobile Number *</label>
                  <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required style={{ height: '44px', padding: '0 14px', fontSize: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none' }} placeholder="9876543210" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Company Name</label>
                  <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} style={{ height: '44px', padding: '0 14px', fontSize: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none' }} placeholder="Acme Corp" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Purpose</label>
                  <input type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} style={{ height: '44px', padding: '0 14px', fontSize: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none' }} placeholder="Business Meeting" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Expected Date & Time *</label>
                  <input type="datetime-local" value={formData.expectedEntryTime} onChange={e => setFormData({...formData, expectedEntryTime: e.target.value})} required style={{ height: '44px', padding: '0 14px', fontSize: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#F8FAFC' }}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button" style={{ height: '40px', borderRadius: '10px' }}>Cancel</Button>
                <Button variant="primary" type="submit" style={{ height: '40px', borderRadius: '10px' }}>Schedule Appointment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
