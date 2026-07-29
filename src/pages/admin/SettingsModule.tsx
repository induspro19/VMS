import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Save, Plus, Trash2, Building, ShieldCheck, Tag, Shield, User, Power } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAppUsers } from '../../context/UserContext';
import { useVisitor } from '../../context/VisitorContext';
import { useSecurityShift } from '../../context/SecurityShiftContext';

export const SettingsModule: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { users } = useAppUsers();
  const { visitors } = useVisitor();
  const { toast } = useToast();

  const [newDept, setNewDept] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [maxHours, setMaxHours] = useState(settings.meetingDurationMaxHours);

  const { officers, addOfficer, deleteOfficer, toggleOfficerActive } = useSecurityShift();
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerBadge, setNewOfficerBadge] = useState('');

  const handleAddOfficer = () => {
    const trimmed = newOfficerName.trim();
    if (!trimmed) {
      toast('Officer Name is required.', 'error');
      return;
    }
    addOfficer(trimmed, newOfficerBadge.trim());
    setNewOfficerName('');
    setNewOfficerBadge('');
    toast(`Security Officer "${trimmed}" added to master list.`, 'success');
  };

  const handleSaveProfile = () => {
    updateSettings({ companyName, meetingDurationMaxHours: maxHours });
    toast('Company profile saved successfully.', 'success');
  };

  const addDepartment = () => {
    const trimmed = newDept.trim();
    if (!trimmed) return;
    if (settings.departments.map(d => d.toLowerCase()).includes(trimmed.toLowerCase())) {
      toast('Department already exists.', 'error');
      return;
    }
    updateSettings({ departments: [...settings.departments, trimmed] });
    setNewDept('');
    toast(`Department "${trimmed}" added.`, 'success');
  };

  const removeDepartment = (dept: string) => {
    // Delete Protection: check assigned users
    const usersInDept = users.filter(u => u.department === dept);
    if (usersInDept.length > 0) {
      toast(`Cannot delete "${dept}" — ${usersInDept.length} user(s) are assigned to it. Please reassign them first.`, 'error');
      return;
    }
    // Delete Protection: check active checked-in visitors
    const visitorsInDept = visitors.filter(v => v.department === dept && v.status === 'INSIDE');
    if (visitorsInDept.length > 0) {
      toast(`Cannot delete "${dept}" — ${visitorsInDept.length} visitor(s) currently checked in. Please wait for them to check out.`, 'error');
      return;
    }
    updateSettings({ departments: settings.departments.filter(d => d !== dept) });
    toast(`Department "${dept}" deleted.`, 'success');
  };

  const addPurpose = () => {
    const trimmed = newPurpose.trim();
    if (!trimmed) return;
    if (settings.visitorPurposes.map(p => p.toLowerCase()).includes(trimmed.toLowerCase())) {
      toast('Visitor purpose already exists.', 'error');
      return;
    }
    updateSettings({ visitorPurposes: [...settings.visitorPurposes, trimmed] });
    setNewPurpose('');
    toast(`Purpose "${trimmed}" added.`, 'success');
  };

  const removePurpose = (idx: number) => {
    const target = settings.visitorPurposes[idx];
    updateSettings({ visitorPurposes: settings.visitorPurposes.filter((_, i) => i !== idx) });
    toast(`Purpose "${target}" removed.`, 'success');
  };

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>System Settings</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Manage company configuration, departments, and visitor permissions</p>
        </div>
        <button className="ui-button ui-button-primary" onClick={handleSaveProfile} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={16} /> Save Profile
        </button>
      </div>

      {/* 2-Column Responsive Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left Column: Company Profile & Visitor Purposes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Company Profile Card */}
          <div className="ui-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={20} color="var(--primary-color)" /> Company Profile
            </div>
            <div className="ui-form-group" style={{ marginBottom: '14px' }}>
              <label className="ui-form-label">Company Name</label>
              <input
                className="ui-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name..."
              />
            </div>
            <div className="ui-form-group" style={{ margin: 0 }}>
              <label className="ui-form-label">Max Visit Duration (Hours)</label>
              <input
                type="number"
                min="1"
                max="24"
                className="ui-input"
                value={maxHours}
                onChange={(e) => setMaxHours(parseInt(e.target.value) || 4)}
              />
            </div>
          </div>

          {/* Visitor Purposes Card */}
          <div className="ui-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="var(--primary-color)" /> Visitor Purposes
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Selectable visit reasons available on the registration portal.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                className="ui-input"
                value={newPurpose}
                onChange={e => setNewPurpose(e.target.value)}
                placeholder="Add visitor purpose..."
                onKeyDown={e => e.key === 'Enter' && addPurpose()}
                style={{ flex: 1 }}
              />
              <button className="ui-button ui-button-primary" onClick={addPurpose} style={{ padding: '0 14px' }}>
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
              {settings.visitorPurposes.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '1.5rem 0' }}>
                  No visitor purposes defined yet. Add one above.
                </div>
              )}
              {settings.visitorPurposes.map((purpose, idx) => (
                <div key={idx} style={{ minHeight: '48px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tag size={14} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{purpose}</span>
                  </div>
                  <button className="ui-button ui-button-danger ui-button-sm" onClick={() => removePurpose(idx)} style={{ padding: '4px 8px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Department Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="ui-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={20} color="var(--primary-color)" /> Department Management
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Single master list used across Registration, User Management, and all system modules.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                className="ui-input"
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                placeholder="Add department name..."
                onKeyDown={e => e.key === 'Enter' && addDepartment()}
                style={{ flex: 1 }}
              />
              <button className="ui-button ui-button-primary" onClick={addDepartment} style={{ padding: '0 14px' }}>
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '580px', overflowY: 'auto', paddingRight: '2px' }}>
              {settings.departments.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '2rem 0' }}>
                  No departments found. Add your first department above.
                </div>
              )}
              {settings.departments.map((dept, idx) => {
                const userCount = users.filter(u => u.department === dept).length;
                return (
                  <div key={idx} style={{ minHeight: '52px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building size={15} />
                      </div>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{dept}</span>
                        {userCount > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', backgroundColor: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            {userCount} user{userCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="ui-button ui-button-danger ui-button-sm"
                      onClick={() => removeDepartment(dept)}
                      style={{ padding: '4px 8px' }}
                      title={userCount > 0 ? `${userCount} user(s) assigned — delete protected` : 'Delete department'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Officers Master Card */}
          <div className="ui-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="var(--primary-color)" /> Security Officers Master
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Authorized Security Officers list for On-Duty shift login and visitor audit tracking.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '14px' }}>
              <input
                className="ui-input"
                value={newOfficerName}
                onChange={e => setNewOfficerName(e.target.value)}
                placeholder="Officer Name (e.g. Amit Singh)..."
              />
              <input
                className="ui-input"
                value={newOfficerBadge}
                onChange={e => setNewOfficerBadge(e.target.value)}
                placeholder="Badge No. (Optional)..."
              />
              <button className="ui-button ui-button-primary" onClick={handleAddOfficer} style={{ padding: '0 14px' }}>
                <Plus size={16} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '2px' }}>
              {officers.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '1.5rem 0' }}>
                  No security officers defined. Add your first officer above.
                </div>
              )}
              {officers.map(officer => (
                <div key={officer.id} style={{ minHeight: '52px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between', flexShrink: 0, opacity: officer.isActive ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: officer.isActive ? '#DBEAFE' : '#F1F5F9', color: officer.isActive ? '#1D4ED8' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {officer.name}
                        {officer.badgeNumber && <span style={{ fontSize: '11px', backgroundColor: 'var(--bg-card)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{officer.badgeNumber}</span>}
                      </div>
                      <span style={{ fontSize: '11px', color: officer.isActive ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {officer.isActive ? '● Active' : '○ Disabled'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="ui-button ui-button-secondary ui-button-sm"
                      onClick={() => toggleOfficerActive(officer.id)}
                      title={officer.isActive ? 'Disable Officer' : 'Enable Officer'}
                      style={{ padding: '4px 8px' }}
                    >
                      <Power size={14} color={officer.isActive ? '#10B981' : '#94A3B8'} />
                    </button>
                    <button
                      className="ui-button ui-button-danger ui-button-sm"
                      onClick={() => {
                        if (window.confirm(`Delete officer "${officer.name}"?`)) {
                          deleteOfficer(officer.id);
                          toast(`Officer "${officer.name}" deleted.`, 'success');
                        }
                      }}
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
