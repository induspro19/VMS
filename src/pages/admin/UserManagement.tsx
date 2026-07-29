import React, { useState } from 'react';
import { useAppUsers, decodePassword, encodePassword } from '../../context/UserContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import type { AppUser, UserRole } from '../../context/UserContext';
import { Search, Plus, ShieldCheck, Lock, Unlock, Key, Trash2, Shield, Edit2, Eye, EyeOff } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// ─── Change Password Modal ───────────────────────────────────────────────────
const ChangePasswordModal: React.FC<{
  user: AppUser;
  onClose: () => void;
  onSave: (id: string, newHash: string) => void;
}> = ({ user, onClose, onSave }) => {
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw.trim()) { setError('Password cannot be empty.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    onSave(user.id, encodePassword(newPw.trim()));
    onClose();
  };

  return (
    <div className="ui-modal-overlay">
      <div className="ui-modal" style={{ width: '400px' }}>
        <div className="ui-modal-header">
          <h2 style={{ fontSize: '16px' }}>Change Password — {user.username}</h2>
          <button className="ui-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="ui-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem', borderRadius: '6px', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>New Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                required
                className="ui-input"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setError(''); }}
                placeholder="Enter new password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Confirm Password *</label>
            <input
              type="password"
              required
              className="ui-input"
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setError(''); }}
              placeholder="Repeat new password"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit">Save Password</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Edit User Modal ─────────────────────────────────────────────────────────
const EditUserModal: React.FC<{
  user: AppUser;
  departments: string[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<AppUser>) => void;
}> = ({ user, departments, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    password: decodePassword(user.passwordHash),
    department: user.department || '',
    designation: user.designation || '',
    mobile: user.mobile || '',
    email: user.email || '',
    role: user.role,
    employeeId: user.employeeId || '',
    isActive: user.isActive,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Full Name is required.'); return; }
    if (!form.username.trim()) { setError('Username is required.'); return; }
    if (!form.password.trim()) { setError('Password cannot be empty.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    onSave(user.id, {
      name: form.name.trim(),
      username: form.username.trim(),
      passwordHash: encodePassword(form.password.trim()),
      department: form.department,
      designation: form.designation,
      mobile: form.mobile,
      email: form.email,
      role: form.role as UserRole,
      employeeId: form.employeeId,
      isActive: form.isActive,
    });
    onClose();
  };

  return (
    <div className="ui-modal-overlay">
      <div className="ui-modal" style={{ width: '520px' }}>
        <div className="ui-modal-header">
          <h2>Edit User — {user.username}</h2>
          <button className="ui-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="ui-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem', borderRadius: '6px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input className="ui-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Username *</label>
              <input className="ui-input" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="ui-input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Employee ID</label>
              <input className="ui-input" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Role *</label>
              <select className="ui-select" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
                <option value="EMPLOYEE">Employee</option>
                <option value="SECURITY">Security</option>
                <option value="RECEPTION">Reception</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="ui-select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Designation</label>
              <input className="ui-input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input type="tel" className="ui-input" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Email</label>
            <input type="email" className="ui-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="editActiveUser"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="editActiveUser" style={{ fontSize: '14px', fontWeight: 500 }}>Account is Active</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main User Management ────────────────────────────────────────────────────
export const UserManagement: React.FC = () => {
  const { users, createUser, updateUser, deleteUser, lockUser, resetPassword } = useAppUsers();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [changePwUser, setChangePwUser] = useState<AppUser | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [createError, setCreateError] = useState('');

  const [newUser, setNewUser] = useState<Partial<AppUser>>({
    name: '', username: '', role: 'EMPLOYEE',
    employeeId: '', department: '', designation: '',
    mobile: '', email: '', isActive: true, isLocked: false, passwordHash: ''
  });

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase())) ||
    (u.employeeId && u.employeeId.toLowerCase().includes(search.toLowerCase()))
  );

  const resetCreateForm = () => {
    setNewUser({ name: '', username: '', role: 'EMPLOYEE', employeeId: '', department: '', designation: '', mobile: '', email: '', isActive: true, isLocked: false, passwordHash: '' });
    setConfirmPassword('');
    setCreateError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newUser.name?.trim()) { setCreateError('Full name is required.'); return; }
    if (!newUser.username?.trim()) { setCreateError('Username is required.'); return; }
    if (!newUser.passwordHash?.trim()) { setCreateError('Password is required.'); return; }
    if (newUser.passwordHash.length < 6) { setCreateError('Password must be at least 6 characters.'); return; }
    if (newUser.passwordHash !== confirmPassword) { setCreateError('Passwords do not match.'); return; }
    if (users.some(u => u.username.toLowerCase() === newUser.username?.toLowerCase())) {
      setCreateError('Username already exists.'); return;
    }
    if (newUser.employeeId && users.some(u => u.employeeId === newUser.employeeId)) {
      setCreateError('Employee ID already exists.'); return;
    }
    if (newUser.mobile && users.some(u => u.mobile === newUser.mobile)) {
      setCreateError('Mobile number already in use.'); return;
    }
    if (newUser.email && users.some(u => u.email === newUser.email)) {
      setCreateError('Email already in use.'); return;
    }

    createUser({
      ...newUser,
      username: newUser.username!.trim(),
      passwordHash: encodePassword(newUser.passwordHash!.trim()),
    } as Omit<AppUser, 'id' | 'createdAt' | 'lastLogin'>);

    toast(`User "${newUser.username}" created successfully.`, 'success');
    setShowCreate(false);
    resetCreateForm();
  };

  const handleChangePassword = (id: string, newHash: string) => {
    resetPassword(id, newHash);
    toast('Password changed successfully.', 'success');
  };

  const handleLockToggle = (user: AppUser) => {
    lockUser(user.id, !user.isLocked);
    toast(`Account ${!user.isLocked ? 'locked' : 'unlocked'} for ${user.username}.`, !user.isLocked ? 'error' : 'success');
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={24} color="var(--primary-color)" /> Employee Access Control
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage employee accounts, roles, and security access</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="makoro-search-input">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search user, role, dept..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => { resetCreateForm(); setShowCreate(true); }} className="ui-button-primary">
            <Plus size={16} /> New User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="ui-table-container standalone" style={{ flex: 1 }}>
        <table className="ui-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>USERNAME</th>
              <th>PASSWORD</th>
              <th>ROLE / DEPT</th>
              <th>STATUS</th>
              <th>LAST LOGIN</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const plainPw = decodePassword(user.passwordHash);
              const isPwVisible = !!visiblePasswords[user.id];

              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {user.name}
                      {user.employeeId && <span style={{ fontSize: '11px', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#4B5563' }}>{user.employeeId}</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.designation ? `${user.designation} • ` : ''}{user.email || user.mobile}</div>
                  </td>
                  <td>
                    <span className="ui-table-code">{user.username}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="ui-table-code" style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: isPwVisible ? 'normal' : '2px' }}>
                        {isPwVisible ? plainPw : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(user.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title={isPwVisible ? 'Hide Password' : 'Show Password'}
                      >
                        {isPwVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                      <Shield size={14} color={user.role === 'ADMIN' ? '#DC2626' : 'var(--text-secondary)'} />
                      {user.role}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.department || '-'}</div>
                  </td>
                  <td>
                    <Badge minimal variant={user.isLocked ? 'danger' : user.isActive ? 'success' : 'default'}>
                      {user.isLocked ? 'LOCKED' : user.isActive ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button
                        className="makoro-icon-btn"
                        title="Edit User"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="makoro-icon-btn"
                        title="Change Password"
                        onClick={() => setChangePwUser(user)}
                      >
                        <Key size={14} />
                      </button>
                      <button
                        className="makoro-icon-btn"
                        title={user.isLocked ? 'Unlock Account' : 'Lock Account'}
                        onClick={() => handleLockToggle(user)}
                      >
                        {user.isLocked ? <Unlock size={14} color="#10B981" /> : <Lock size={14} color="#EF4444" />}
                      </button>
                      <button
                        className="makoro-icon-btn"
                        title="Delete User"
                        onClick={() => {
                          if (user.role === 'ADMIN') { toast('Cannot delete an Administrator.', 'error'); return; }
                          if (window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
                            deleteUser(user.id);
                            toast(`User "${user.username}" deleted.`, 'success');
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="ui-modal-overlay">
          <div className="ui-modal" style={{ width: '540px' }}>
            <div className="ui-modal-header">
              <h2>Create New User Account</h2>
              <button className="ui-modal-close" onClick={() => { setShowCreate(false); resetCreateForm(); }}>×</button>
            </div>
            <form onSubmit={handleCreate} className="ui-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {createError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem', borderRadius: '6px', fontSize: '13px' }}>
                  {createError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="ui-input" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input className="ui-input" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="ui-input"
                      value={newUser.passwordHash}
                      onChange={e => setNewUser({ ...newUser, passwordHash: e.target.value })}
                      placeholder="Min 6 characters"
                      style={{ paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="ui-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Role *</label>
                  <select className="ui-select" required value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="SECURITY">Security</option>
                    <option value="RECEPTION">Reception</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select className="ui-select" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })}>
                    <option value="">Select Department</option>
                    {settings.departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input className="ui-input" value={newUser.designation} onChange={e => setNewUser({ ...newUser, designation: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input className="ui-input" value={newUser.employeeId} onChange={e => setNewUser({ ...newUser, employeeId: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="ui-input" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input type="tel" className="ui-input" value={newUser.mobile} onChange={e => setNewUser({ ...newUser, mobile: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="activeUser" checked={newUser.isActive} onChange={e => setNewUser({ ...newUser, isActive: e.target.checked })} />
                <label htmlFor="activeUser" style={{ fontSize: '14px', fontWeight: 500 }}>Account is Active</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); resetCreateForm(); }}>Cancel</Button>
                <Button variant="primary" type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          departments={settings.departments}
          onClose={() => setEditingUser(null)}
          onSave={(id, updates) => {
            updateUser(id, updates);
            toast('User updated successfully.', 'success');
          }}
        />
      )}

      {/* Change Password Modal */}
      {changePwUser && (
        <ChangePasswordModal
          user={changePwUser}
          onClose={() => setChangePwUser(null)}
          onSave={handleChangePassword}
        />
      )}
    </div>
  );
};
