import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, Shield, LogOut, FileText, Search, UserCircle, Sun, Moon, Monitor, Menu } from 'lucide-react';
import { useVisitor } from '../../context/VisitorContext';
export const AppLayout: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { visitors } = useVisitor();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

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
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', position: 'relative', overflow: 'hidden' }}>
        {/* Full screen static landscape background */}
        <div style={{
          position: 'absolute',
          inset: 0, // Fits exactly to screen
          backgroundImage: 'url("./bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4) saturate(1.2)', // Adjusted filter to better show the fire scene
          zIndex: 0
        }} />
        
        {/* Animated gradients over the image for minor animation */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 30%, rgba(59,130,246,0.15) 0%, transparent 60%)', zIndex: 0, animation: 'pulseBg 8s infinite alternate' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 80%, rgba(220,38,38,0.15) 0%, transparent 60%)', zIndex: 0, animation: 'pulseBg 10s infinite alternate-reverse' }} />

        <div className="animate-fade-in" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          
          {/* Animated Logo & Title Area - Locked to Top */}
          <div style={{ 
            position: 'absolute',
            top: '3rem',
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: '1.5rem',
            padding: '1.5rem 2.5rem',
            borderRadius: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            animation: 'headerPulse 3s infinite',
            backdropFilter: 'blur(10px)',
            width: '90%',
            maxWidth: '1000px'
          }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
              <img 
                src="./logo.png" 
                alt="Indus Fire Safety" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block'; 
                }} 
              />
              <Shield size={48} color="#3B82F6" style={{ display: 'none' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontFamily: '"Tektur", "Anton", Impact, sans-serif', fontSize: '36px', fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>INDUS FIRE SAFETY PVT LTD</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#94A3B8', margin: '4px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Visitor Management System</p>
            </div>
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%', maxWidth: '1000px' }}>
            <button 
              onClick={() => login('ADMIN')} 
              style={{ width: '100%', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#FFFFFF', fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }} 
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.5)' }} 
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <LayoutDashboard size={28} style={{ color: '#60A5FA' }} /> 
              <span>Admin Portal</span>
            </button>
            <button 
              onClick={() => login('SECURITY')} 
              style={{ width: '100%', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#FFFFFF', fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }} 
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.5)' }} 
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <Shield size={28} style={{ color: '#34D399' }} /> 
              <span>Security Gate</span>
            </button>
            <button 
              onClick={() => login('EMPLOYEE')} 
              style={{ width: '100%', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#FFFFFF', fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }} 
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.5)' }} 
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <Users size={28} style={{ color: '#F87171' }} /> 
              <span>Employee Dashboard</span>
            </button>
            <button 
              onClick={() => login('RECEPTION')} 
              style={{ width: '100%', padding: '20px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#FFFFFF', fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }} 
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.5)' }} 
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <UserCircle size={28} style={{ color: '#FBBF24' }} /> 
              <span>Front Desk</span>
            </button>
          </div>
          
          {/* Removed return to website button */}
        </div>
      
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tektur:wght@400;600;700;900&display=swap');
          @keyframes headerPulse {
            0% { border: 2px solid rgba(59, 130, 246, 0.2); box-shadow: 0 0 15px rgba(59, 130, 246, 0.1); }
            50% { border: 2px solid rgba(59, 130, 246, 0.8); box-shadow: 0 0 30px rgba(59, 130, 246, 0.4); }
            100% { border: 2px solid rgba(59, 130, 246, 0.2); box-shadow: 0 0 15px rgba(59, 130, 246, 0.1); }
          }
          @keyframes pulseBg {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.1); opacity: 0.8; }
          }
          @keyframes panBg {
            0% { transform: translate(0, 0) scale(1.05); }
            100% { transform: translate(-2%, -2%) scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  const renderNavLinks = () => {
    if (user.role === 'ADMIN') {
      return (
        <>
          <NavLink to="/admin" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            Reports
          </NavLink>
          <NavLink to="/admin/history" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            Visitor History
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Shield size={20} />
            Settings
          </NavLink>
          <NavLink to="/admin/health" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <Monitor size={20} />
            System Health
          </NavLink>
        </>
      );
    }
    if (user.role === 'SECURITY') {
      return (
        <NavLink to="/security" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
          <Shield size={20} />
          Gate Operations
        </NavLink>
      );
    }
    if (user.role === 'EMPLOYEE') {
      return (
        <>
          <NavLink to="/employee" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`} end>
            <Users size={20} />
            My Visitors
          </NavLink>
          <NavLink to="/employee/appointments" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            Appointments
          </NavLink>
        </>
      );
    }
    if (user.role === 'RECEPTION') {
      return (
        <>
          <NavLink to="/reception" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`} end>
            <UserCircle size={20} />
            Front Desk
          </NavLink>
          <NavLink to="/reception/reports" className={({ isActive }) => `ui-layout-nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            Reports
          </NavLink>
        </>
      );
    }
    return null;
  };

  return (
    <div className="ui-layout">
      <aside className={`ui-layout-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="ui-layout-sidebar-header">
          <Shield size={28} style={{ color: 'var(--primary-color)' }} />
          <h2>Enterprise VMS</h2>
        </div>
        
        <nav className="ui-layout-nav">
          {renderNavLinks()}
        </nav>

        <div className="ui-layout-sidebar-footer">
          <div className="ui-layout-user" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="ui-layout-user-avatar">
              {user.name.charAt(0)}
            </div>
            <div className="ui-layout-user-info">
              <div className="ui-layout-user-name">{user.name}</div>
              <div className="ui-layout-user-role">{user.role}</div>
            </div>
          </div>
          <button className="ui-layout-logout" onClick={logout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <main className="ui-layout-main">
        <header className="ui-layout-header">
          <div style={{ flex: 1 }}>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="ui-theme-toggle">
            <button onClick={() => setTheme('light')} className={theme === 'light' ? 'active' : ''} title="Light Mode">
              <Sun size={16} />
            </button>
            <button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'active' : ''} title="Dark Mode">
              <Moon size={16} />
            </button>
            <button onClick={() => setTheme('system')} className={theme === 'system' ? 'active' : ''} title="System Default">
              <Monitor size={16} />
            </button>
          </div>

          <div className="ui-search-box">
            <input 
              type="text" 
              placeholder="Global Search..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            />
            <Search size={18} className="ui-search-icon" />
            
            {isSearchOpen && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
                {searchResults.map(v => (
                  <div 
                    key={v.id} 
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.company} • {v.mobile}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)' }}>{v.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }} className="ui-layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
