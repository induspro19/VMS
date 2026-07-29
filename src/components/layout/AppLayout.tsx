import React from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, Shield, LogOut, FileText, Search, UserCircle, Sun, Moon, Monitor, Menu, Settings, ArrowLeft, HelpCircle, AlertTriangle } from 'lucide-react';
import { useVisitor } from '../../context/VisitorContext';
export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { visitors } = useVisitor();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Auto collapse sidebar on Visitor History page load for max data grid width
  React.useEffect(() => {
    if (location.pathname === '/admin/history') {
      setIsSidebarCollapsed(true);
    }
  }, [location.pathname]);

  const searchResults = React.useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return visitors.filter(v => 
      v.name.toLowerCase().includes(q) || 
      v.mobile.includes(q) || 
      v.company.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q)
    ).slice(0, 5); // top 5 results
  }, [searchQuery, visitors]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderNavLinks = () => {
    if (user.role === 'ADMIN') {
      return (
        <>
          <NavLink to="/admin" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} strokeWidth={1.5} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/security" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Shield size={20} />
            <span>Gate Control Panel</span>
          </NavLink>
          <NavLink to="/admin/history" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Visitor History</span>
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Reports</span>
          </NavLink>
          <div className="ui-layout-nav-group">SYSTEM & USERS</div>
          <NavLink to="/admin/users" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <UserCircle size={20} />
            <span>Employee Accounts</span>
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
          <NavLink to="/admin/health" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Monitor size={20} />
            <span>System Health</span>
          </NavLink>
        </>
      );
    }
    if (user.role === 'SECURITY') {
      return (
        <>
          <NavLink to="/security" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`} end>
            <Shield size={20} />
            <span>Gate Operations</span>
          </NavLink>
          <NavLink to="/admin/history" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Visitor Logs & History</span>
          </NavLink>
          <NavLink to="/security/emergency" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={20} />
            <span>Emergency Evac</span>
          </NavLink>
        </>
      );
    }
    if (user.role === 'EMPLOYEE') {
      return (
        <>
          <NavLink to="/employee" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`} end>
            <Users size={20} />
            <span>My Visitors</span>
          </NavLink>
          <NavLink to="/employee/appointments" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Appointments</span>
          </NavLink>
        </>
      );
    }
    if (user.role === 'RECEPTION') {
      return (
        <>
          <NavLink to="/reception" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`} end>
            <UserCircle size={20} />
            <span>Front Desk</span>
          </NavLink>
          <NavLink to="/reception/reports" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Reports</span>
          </NavLink>
        </>
      );
    }
    return null;
  };

  return (
    <div className={`ui-layout role-${user.role.toLowerCase()}`}>
      <aside className={`ui-layout-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="ui-layout-sidebar-header">
          <div className="makoro-logo-group">
            <div className="makoro-logo-icon">E</div>
            <h2>ENTERPRISE</h2>
          </div>
          <button className="makoro-collapse-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <ArrowLeft size={16} />
          </button>
        </div>
        
        <nav className="ui-layout-nav">
          {renderNavLinks()}
        </nav>

        <div className="makoro-bottom-links">
          <NavLink to="/help" className="ui-layout-nav-link">
            <HelpCircle size={20} strokeWidth={1.5} />
            <span>Help & FAQ</span>
          </NavLink>
          <NavLink to="/admin/settings" className="ui-layout-nav-link">
            <Settings size={20} strokeWidth={1.5} />
            <span>Settings</span>
          </NavLink>
        </div>

        <div className="ui-layout-sidebar-footer">
          <div className="ui-layout-user">
            <div className="ui-layout-user-name">{user.name}</div>
            <div className="ui-layout-user-email">{(user as any).email || 'admin@enterprise.com'}</div>
          </div>
          <button className="ui-layout-logout" onClick={logout} title="Logout">
            <LogOut size={20} strokeWidth={1.5} />
          </button>
        </div>
      </aside>

      <main className="ui-layout-main">
        <header className="ui-layout-header">
          <div className="ui-header-left">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={18} />
            </button>
            <div className="ui-header-breadcrumb">
              <span>Enterprise VMS</span>
              <span>/</span>
              <span className="active">{user.role} Portal</span>
            </div>
          </div>
          
          <div className="ui-header-right">
            <div className="ui-search-box">
              <input 
                type="text" 
                placeholder="Global Search..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              />
              <Search size={16} className="ui-search-icon" />
              
              {isSearchOpen && searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
                  {searchResults.map(v => (
                    <div 
                      key={v.id} 
                      style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                        if (user.role === 'ADMIN') navigate(`/admin/visitor/${v.id}`);
                        else if (user.role === 'SECURITY') navigate(`/security/visitor/${v.id}`);
                        else navigate(`/employee/visitor/${v.id}`);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-input)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{v.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v.company} • {v.mobile}</div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)' }}>{v.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ui-theme-toggle">
              <button onClick={() => setTheme('light')} className={theme === 'light' ? 'active' : ''} title="Light Mode">
                <Sun size={15} />
              </button>
              <button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'active' : ''} title="Dark Mode">
                <Moon size={15} />
              </button>
              <button onClick={() => setTheme('system')} className={theme === 'system' ? 'active' : ''} title="System Default">
                <Monitor size={15} />
              </button>
            </div>
          </div>
        </header>
        <div className="ui-layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
