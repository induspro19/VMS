import React, { Suspense, lazy } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VisitorProvider } from './context/VisitorContext';
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
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
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

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (user.role !== allowedRole) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'SECURITY') return <Navigate to="/security" replace />;
    if (user.role === 'EMPLOYEE') return <Navigate to="/employee" replace />;
    if (user.role === 'RECEPTION') return <Navigate to="/reception" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
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
                <AuthProvider>
                  <GlobalErrorBoundary>
                    <Suspense fallback={<LoadingScreen />}>
                      <SmartAlertsEngine />
                      <Routes>
                        {/* Public Routes for Visitors */}
                        <Route path="/register" element={<RegisterPortal />} />
                        <Route path="/self-registration" element={<SelfRegistrationPortal />} />
                        <Route path="/checkout" element={<CheckoutPortal />} />
                        <Route path="/403" element={<ForbiddenPage />} />
                    
                    {/* Dashboard Layout (Requires Auth/Role) */}
                    <Route path="/" element={<AppLayout />}>
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
                    <ProtectedRoute allowedRole="ADMIN">
                      <VisitorHistory />
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
                    <ProtectedRoute allowedRole="EMPLOYEE">
                      <EmployeeDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="employee/appointments" element={
                    <ProtectedRoute allowedRole="EMPLOYEE">
                      <EmployeeAppointments />
                    </ProtectedRoute>
                  } />
                  <Route path="employee/visitor/:id" element={
                    <ProtectedRoute allowedRole="EMPLOYEE">
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
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </GlobalErrorBoundary>
        </AuthProvider>
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
