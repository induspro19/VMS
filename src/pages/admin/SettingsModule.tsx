import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Settings as SettingsIcon, Save, Plus, Trash2, Building, Users, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SettingsModule: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [newDept, setNewDept] = useState('');
  const [newEmployee, setNewEmployee] = useState('');
  const [newPurpose, setNewPurpose] = useState('');

  const handleSave = () => {
    updateSettings(localSettings);
    toast('Settings saved successfully.', 'success');
  };

  const addItem = (field: 'departments' | 'employees' | 'visitorPurposes', value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (!value.trim()) return;
    setLocalSettings(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
    setter('');
  };

  const removeItem = (field: 'departments' | 'employees' | 'visitorPurposes', index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,.05)',
    border: '1px solid #E5E7EB',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '100%',
    overflow: 'hidden'
  };

  const inputStyle = {
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
    backgroundColor: '#FFFFFF',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  const addBtnStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: '#2563EB',
    border: 'none',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  };

  const listContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    flex: 1,
    overflowY: 'auto' as const,
    paddingRight: '4px'
  };

  const listItemStyle = {
    height: '48px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '12px',
    flexShrink: 0,
    transition: 'background-color 0.2s'
  };

  const listIconStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const listTitleStyle = {
    fontSize: '15px',
    fontWeight: 500,
    color: '#111827',
    lineHeight: '1.2'
  };

  const listSubtitleStyle = {
    fontSize: '11px',
    color: '#6B7280'
  };

  const delBtnStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s'
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#F7F9FC', overflow: 'hidden', fontFamily: '"Inter", sans-serif' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ height: '60px', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #E5E7EB', backgroundColor: '#F7F9FC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SettingsIcon size={24} color="#2563EB" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 600, color: '#111827', lineHeight: 1 }}>System Settings</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Configure Enterprise VMS parameters</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          style={{ height: '40px', width: '140px', borderRadius: '10px', background: '#2563EB', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.2)' }}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      {/* Main Content Grid */}
      <div style={{ flex: 1, padding: '16px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', overflow: 'hidden' }}>
        
        {/* Company Profile */}
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} color="#2563EB" /> Company Profile
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>Company Name</label>
              <input 
                style={inputStyle}
                value={localSettings.companyName} 
                onChange={(e) => setLocalSettings(prev => ({...prev, companyName: e.target.value}))} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>Max Meeting Duration (Hours)</label>
              <input 
                type="number"
                style={inputStyle}
                value={localSettings.meetingDurationMaxHours} 
                onChange={(e) => setLocalSettings(prev => ({...prev, meetingDurationMaxHours: parseInt(e.target.value) || 4}))} 
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>Visitors inside longer than this will be marked as overdue.</p>
            </div>
          </div>
        </div>

        {/* Department Management */}
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} color="#2563EB" /> Department Management
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={inputStyle} value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="New department..." onKeyDown={e => e.key === 'Enter' && addItem('departments', newDept, setNewDept)} />
            <button style={addBtnStyle} onClick={() => addItem('departments', newDept, setNewDept)}><Plus size={18} /></button>
          </div>
          <div style={listContainerStyle}>
            {localSettings.departments.map((dept, idx) => (
              <div key={idx} style={listItemStyle}>
                <div style={listIconStyle}><Building size={16} color="#FFFFFF" /></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={listTitleStyle}>{dept}</div>
                  <div style={listSubtitleStyle}>Standard Department</div>
                </div>
                <button style={delBtnStyle} onClick={() => removeItem('departments', idx)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Employees */}
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#2563EB" /> Employees Directory
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={inputStyle} value={newEmployee} onChange={e => setNewEmployee(e.target.value)} placeholder="New employee..." onKeyDown={e => e.key === 'Enter' && addItem('employees', newEmployee, setNewEmployee)} />
            <button style={addBtnStyle} onClick={() => addItem('employees', newEmployee, setNewEmployee)}><Plus size={18} /></button>
          </div>
          <div style={listContainerStyle}>
            {localSettings.employees.map((emp, idx) => (
              <div key={idx} style={listItemStyle}>
                <div style={listIconStyle}><Users size={16} color="#FFFFFF" /></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={listTitleStyle}>{emp}</div>
                  <div style={listSubtitleStyle}>Active Employee</div>
                </div>
                <button style={delBtnStyle} onClick={() => removeItem('employees', idx)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Visitor Purposes */}
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#2563EB" /> Visitor Purposes
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={inputStyle} value={newPurpose} onChange={e => setNewPurpose(e.target.value)} placeholder="New purpose..." onKeyDown={e => e.key === 'Enter' && addItem('visitorPurposes', newPurpose, setNewPurpose)} />
            <button style={addBtnStyle} onClick={() => addItem('visitorPurposes', newPurpose, setNewPurpose)}><Plus size={18} /></button>
          </div>
          <div style={listContainerStyle}>
            {localSettings.visitorPurposes.map((purpose, idx) => (
              <div key={idx} style={listItemStyle}>
                <div style={listIconStyle}><ShieldCheck size={16} color="#FFFFFF" /></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={listTitleStyle}>{purpose}</div>
                  <div style={listSubtitleStyle}>Registered Purpose</div>
                </div>
                <button style={delBtnStyle} onClick={() => removeItem('visitorPurposes', idx)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
