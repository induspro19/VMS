import React, { useState } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { CalendarClock, Plus, X, Clock } from 'lucide-react';

export const EmployeeAppointments: React.FC = () => {
  const { visitors, preRegisterVisitor } = useVisitor();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXPECTED' | 'COMPLETED'>('EXPECTED');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    company: '',
    department: 'Sales', // Defaulting for employee
    purpose: 'Meeting',
    expectedEntryTime: ''
  });

  const myAppointments = visitors.filter(v => (v.employeeToMeet === user?.name || user?.name === 'John Doe') && v.isPreRegistered);
  
  const expectedVisitors = myAppointments.filter(v => v.status === 'APPROVED'); // Approved and waiting to arrive
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
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarClock size={24} style={{ color: 'var(--primary-color)' }} />
            Appointments
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage your pre-registered expected visitors.
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={16} />} style={{ height: '36px', fontSize: '13px' }}>
          Schedule Appointment
        </Button>
      </div>

      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#E5E7EB', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('EXPECTED')}
            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'EXPECTED' ? '#FFFFFF' : 'transparent', color: activeTab === 'EXPECTED' ? '#111827' : '#4B5563', boxShadow: activeTab === 'EXPECTED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Expected Visitors ({expectedVisitors.length})
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'COMPLETED' ? '#FFFFFF' : 'transparent', color: activeTab === 'COMPLETED' ? '#111827' : '#4B5563', boxShadow: activeTab === 'COMPLETED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Completed Appointments
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
          {activeTab === 'EXPECTED' ? 'Upcoming Appointments' : 'Appointment History'}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="ui-table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem 1rem' }}>Visitor Details</th>
                <th style={{ padding: '0.5rem 1rem' }}>Company</th>
                <th style={{ padding: '0.5rem 1rem' }}>Date & Time</th>
                <th style={{ padding: '0.5rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'EXPECTED' ? (
                <>
                  {expectedVisitors.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No upcoming appointments.
                      </td>
                    </tr>
                  )}
                  {expectedVisitors.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mobile: {v.mobile}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{v.company || '-'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          {new Date(v.expectedEntryTime!).toLocaleString()}
                        </div>
                      </td>
                      <td><Badge variant="warning">Awaiting Arrival</Badge></td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {completedAppointments.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No history found.
                      </td>
                    </tr>
                  )}
                  {completedAppointments.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.purpose}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{v.company || '-'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          {new Date(v.entryTime!).toLocaleDateString()}
                        </div>
                      </td>
                      <td><Badge variant="default">Completed</Badge></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="ui-card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Schedule Appointment</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handlePreRegister} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Visitor Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ height: '36px', padding: '0 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none' }} placeholder="John Doe" />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Mobile Number *</label>
                    <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required style={{ height: '36px', padding: '0 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none' }} placeholder="+1 (555) 000-0000" />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Company</label>
                    <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} style={{ height: '36px', padding: '0 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none' }} placeholder="Acme Corp" />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Purpose</label>
                    <input type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} style={{ height: '36px', padding: '0 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none' }} placeholder="Meeting" />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Expected Date & Time *</label>
                    <input type="datetime-local" value={formData.expectedEntryTime} onChange={e => setFormData({...formData, expectedEntryTime: e.target.value})} required style={{ height: '36px', padding: '0 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: '#F9FAFB' }}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
                <Button variant="primary" type="submit">Schedule Appointment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
