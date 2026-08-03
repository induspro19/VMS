import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { SecurityShiftProvider } from './context/SecurityShiftContext';
import { VisitorProvider } from './context/VisitorContext';
import { FleetProvider } from './context/FleetContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { CommunicationProvider } from './context/CommunicationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { SmartAlertsEngine } from './components/logic/SmartAlertsEngine';
import { GlobalErrorBoundary } from './components/layout/GlobalErrorBoundary';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { NotFoundPage } from './pages/error/NotFoundPage';
import { ForbiddenPage } from './pages/error/ForbiddenPage';
import './index.css';

// Lazy Load Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsModule = lazy(() => import('./pages/admin/SettingsModule').then(m => ({ default: m.SettingsModule })));
const VisitorHistory = lazy(() => import('./pages/admin/VisitorHistory').then(m => ({ default: m.VisitorHistory })));
const SystemHealth = lazy(() => import('./pages/admin/SystemHealth').then(m => ({ default: m.SystemHealth })));
const SecurityDashboard = lazy(() => import('./pages/security/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })));
const EmergencyDashboard = lazy(() => import('./pages/security/EmergencyDashboard').then(m => ({ default: m.EmergencyDashboard })));
const ReceptionDashboard = lazy(() => import('./pages/reception/ReceptionDashboard').then(m => ({ default: m.ReceptionDashboard })));
const ReceptionReports = lazy(() => import('./pages/reception/ReceptionReports').then(m => ({ default: m.ReceptionReports })));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const EmployeeAppointments = lazy(() => import('./pages/employee/EmployeeAppointments').then(m => ({ default: m.EmployeeAppointments })));
const RegisterPortal = lazy(() => import('./pages/visitor/RegisterPortal').then(m => ({ default: m.RegisterPortal })));
const CheckoutPortal = lazy(() => import('./pages/visitor/CheckoutPortal').then(m => ({ default: m.CheckoutPortal })));
const VisitorProfile = lazy(() => import('./pages/admin/VisitorProfile').then(m => ({ default: m.VisitorProfile })));
const SelfRegistrationPortal = lazy(() => import('./pages/visitor/SelfRegistrationPortal').then(m => ({ default: m.SelfRegistrationPortal })));
const GatePortal = lazy(() => import('./pages/visitor/GatePortal').then(m => ({ default: m.GatePortal })));

// Fleet Management Pages
const FleetDashboard = lazy(() => import('./pages/fleet/FleetDashboard').then(m => ({ default: m.FleetDashboard })));
const VehicleMaster = lazy(() => import('./pages/fleet/VehicleMaster').then(m => ({ default: m.VehicleMaster })));
const DriverMaster = lazy(() => import('./pages/fleet/DriverMaster').then(m => ({ default: m.DriverMaster })));
const VehicleExplorer = lazy(() => import('./pages/fleet/VehicleExplorer').then(m => ({ default: m.VehicleExplorer })));
const ApprovalQueue = lazy(() => import('./pages/fleet/ApprovalQueue').then(m => ({ default: m.ApprovalQueue })));
const TripDispatch = lazy(() => import('./pages/fleet/TripDispatch').then(m => ({ default: m.TripDispatch })));
const TripMonitoring = lazy(() => import('./pages/fleet/TripMonitoring').then(m => ({ default: m.TripMonitoring })));
const VehicleReturn = lazy(() => import('./pages/fleet/VehicleReturn').then(m => ({ default: m.VehicleReturn })));
const Maintenance = lazy(() => import('./pages/fleet/Maintenance').then(m => ({ default: m.Maintenance })));
const FleetReports = lazy(() => import('./pages/fleet/FleetReports').then(m => ({ default: m.FleetReports })));
const FleetAnalytics = lazy(() => import('./pages/fleet/Analytics').then(m => ({ default: m.FleetAnalytics })));

// ─── AppSyncManager ──────────────────────────────────────────────────────────
// Zero-render component that wires the three refresh trigger sources:
//  1. Service Worker postMessage (notification tap on an already-open PWA)
//  2. document visibilitychange (app foregrounded after being backgrounded)
//  3. BroadcastChannel messages from other tabs (forwarded from VisitorContext)
// All three fire the `vms:refresh` custom window event consumed by
// VisitorContext and EmployeeDashboard independently.
const THROTTLE_MS = 30_000; // minimum gap between visibility-triggered refreshes

function AppSyncManager() {
  const lastRefreshRef = useRef<number>(0);

  const fireRefresh = (detail: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.debug('[AppSyncManager] Dispatching vms:refresh', detail);
    }
    window.dispatchEvent(new CustomEvent('vms:refresh', { detail }));
  };

  useEffect(() => {
    // 1. Service Worker → App messages (notification tap)
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REFRESH_APP_DATA') {
        if (import.meta.env.DEV) {
          console.debug('[AppSyncManager] SW message received', event.data);
        }
        fireRefresh({ source: event.data.source, visitorId: event.data.visitorId, scope: 'employee' });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // 2. Tab visibility change (throttled)
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRefreshRef.current < THROTTLE_MS) return;
      lastRefreshRef.current = now;
      if (import.meta.env.DEV) {
        console.debug('[AppSyncManager] visibilitychange — refreshing');
      }
      fireRefresh({ source: 'visibilitychange', scope: 'full' });
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return null;
}

// ─── Route Guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string | string[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  if (!allowed.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'SECURITY') return <Navigate to="/security" replace />;
    if (user.role === 'EMPLOYEE') return <Navigate to="/employee" replace />;
    if (user.role === 'HR') return <Navigate to="/employee" replace />;
    if (user.role === 'RECEPTION') return <Navigate to="/reception" replace />;
    if (user.role === 'FLEET_MANAGER') return <Navigate to="/fleet" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const IndexRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin" replace />;
    case 'SECURITY': return <Navigate to="/security" replace />;
    case 'EMPLOYEE':
    case 'HR': return <Navigate to="/employee" replace />;
    case 'RECEPTION': return <Navigate to="/reception" replace />;
    case 'FLEET_MANAGER': return <Navigate to="/fleet" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ThemeProvider>
          <SettingsProvider>
          <CommunicationProvider>
            <NotificationProvider>
              <VisitorProvider>
                <FleetProvider>
                  <UserProvider>
                    <SecurityShiftProvider>
                      <AuthProvider>
                      <GlobalErrorBoundary>
                    <Suspense fallback={<LoadingScreen />}>
                      <AppSyncManager />
                      <SmartAlertsEngine />
                      <Routes>
                        {/* Public Routes for Visitors */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPortal />} />
                        <Route path="/self-registration" element={<SelfRegistrationPortal />} />
                        <Route path="/checkout" element={<CheckoutPortal />} />
                        <Route path="/checkout/:visitorId" element={<CheckoutPortal />} />
                        <Route path="/gate" element={<GatePortal />} />
                        <Route path="/403" element={<ForbiddenPage />} />
                    
                    {/* Dashboard Layout (Requires Auth/Role) */}
                    <Route path="/" element={<AppLayout />}>
                      <Route index element={<IndexRedirect />} />
                      <Route path="admin" element={
                        <ProtectedRoute allowedRole="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/reports" element={
                    <ProtectedRoute allowedRole="ADMIN">
                      <ReportsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/history" element={
                    <ProtectedRoute allowedRole={['ADMIN', 'SECURITY']}>
                      <VisitorHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/users" element={
                    <ProtectedRoute allowedRole="ADMIN">
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/settings" element={
                    <ProtectedRoute allowedRole="ADMIN">
                      <SettingsModule />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/health" element={
                    <ProtectedRoute allowedRole="ADMIN">
                      <SystemHealth />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/visitor/:id" element={
                    <ProtectedRoute allowedRole="ADMIN">
                      <VisitorProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="security" element={
                    <ProtectedRoute allowedRole="SECURITY">
                      <SecurityDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="security/visitor/:id" element={
                    <ProtectedRoute allowedRole="SECURITY">
                      <VisitorProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="security/emergency" element={
                    <ProtectedRoute allowedRole="SECURITY">
                      <EmergencyDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="employee" element={
                    <ProtectedRoute allowedRole={['EMPLOYEE', 'HR']}>
                      <EmployeeDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="employee/appointments" element={
                    <ProtectedRoute allowedRole={['EMPLOYEE', 'HR']}>
                      <EmployeeAppointments />
                    </ProtectedRoute>
                  } />
                  <Route path="employee/visitor/:id" element={
                    <ProtectedRoute allowedRole={['EMPLOYEE', 'HR']}>
                      <VisitorProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="reception" element={
                    <ProtectedRoute allowedRole="RECEPTION">
                      <ReceptionDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="reception/reports" element={
                    <ProtectedRoute allowedRole="RECEPTION">
                      <ReceptionReports />
                    </ProtectedRoute>
                  } />
                  <Route path="reception/visitor/:id" element={
                    <ProtectedRoute allowedRole="RECEPTION">
                      <VisitorProfile />
                    </ProtectedRoute>
                  } />

                  {/* Fleet Management Routes */}
                  <Route path="fleet" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><FleetDashboard /></ProtectedRoute>} />
                  <Route path="fleet/vehicles" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><VehicleMaster /></ProtectedRoute>} />
                  <Route path="fleet/drivers" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><DriverMaster /></ProtectedRoute>} />
                  <Route path="fleet/explorer" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><VehicleExplorer /></ProtectedRoute>} />
                  <Route path="fleet/approvals" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><ApprovalQueue /></ProtectedRoute>} />
                  <Route path="fleet/dispatch" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><TripDispatch /></ProtectedRoute>} />
                  <Route path="fleet/monitoring" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><TripMonitoring /></ProtectedRoute>} />
                  <Route path="fleet/return" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><VehicleReturn /></ProtectedRoute>} />
                  <Route path="fleet/maintenance" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><Maintenance /></ProtectedRoute>} />
                  <Route path="fleet/reports" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><FleetReports /></ProtectedRoute>} />
                  <Route path="fleet/analytics" element={<ProtectedRoute allowedRole="FLEET_MANAGER"><FleetAnalytics /></ProtectedRoute>} />

                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
                      </GlobalErrorBoundary>
                      </AuthProvider>
                    </SecurityShiftProvider>
                  </UserProvider>
                </FleetProvider>
              </VisitorProvider>
    </NotificationProvider>
  </CommunicationProvider>
          </SettingsProvider>
        </ThemeProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
