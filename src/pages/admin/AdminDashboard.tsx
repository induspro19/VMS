import React, { useState, useMemo } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AuditTimelineModal } from '../../components/ui/AuditTimelineModal';
import { Users, UserCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ERPKpiCard } from '../../components/ui/ERPKpiCard';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { visitors } = useVisitor();
  const navigate = useNavigate();
  const [timelineVisitorId, setTimelineVisitorId] = useState<string | null>(null);

  const { todaysVisitors, currentlyInside, readyForExit, completedVisits, rejectedVisits, pendingVisits } = useMemo(() => {
    const today = new Date().toDateString();
    const todayVisits = visitors.filter(v => new Date(v.registrationTime).toDateString() === today);
    const inside = todayVisits.filter(v => v.status === 'INSIDE' && !v.meetingCompleted && !v.readyForExit);
    const readyExit = todayVisits.filter(v => v.status === 'READY_FOR_EXIT' || (v.status === 'INSIDE' && (v.meetingCompleted || v.readyForExit)));
    const completed = todayVisits.filter(v => v.status === 'COMPLETED');
    const rejected = todayVisits.filter(v => v.status === 'REJECTED');
    const pending = todayVisits.filter(v => v.status === 'PENDING_APPROVAL');

    return { 
      todaysVisitors: todayVisits, 
      currentlyInside: inside, 
      readyForExit: readyExit,
      completedVisits: completed,
      rejectedVisits: rejected,
      pendingVisits: pending
    };
  }, [visitors]);

  // Chart Data: Department Wise
  const deptData = useMemo(() => {
    const deptMap = todaysVisitors.reduce((acc, v) => {
      acc[v.department] = (acc[v.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(deptMap).map(k => ({ name: k || 'Other', count: deptMap[k] })).sort((a, b) => b.count - a.count);
  }, [todaysVisitors]);

  // Chart Data: Employee Analytics
  const empData = useMemo(() => {
    const empMap = todaysVisitors.reduce((acc, v) => {
      acc[v.employeeToMeet] = (acc[v.employeeToMeet] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(empMap).map(k => ({ name: k, count: empMap[k] })).sort((a,b) => b.count - a.count);
  }, [todaysVisitors]);

  // Chart Data: Trend line
  const trendData = [
    { time: '09:00', visitors: 12 },
    { time: '10:00', visitors: 25 },
    { time: '11:00', visitors: 40 },
    { time: '12:00', visitors: 30 },
    { time: '13:00', visitors: 15 },
    { time: '14:00', visitors: 35 },
    { time: '15:00', visitors: 20 },
  ];

  return (
    <div style={{ padding: '1rem 1.5rem 1.5rem 1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Alerts Row (If Active) */}
      {((currentlyInside.length + readyForExit.length) > 0 || pendingVisits.length > 0 || rejectedVisits.length > 0) && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(currentlyInside.length + readyForExit.length) > 0 && <AlertBanner variant="info">{currentlyInside.length + readyForExit.length} visitors currently inside premises</AlertBanner>}
          {pendingVisits.length > 0 && <AlertBanner variant="warning">{pendingVisits.length} pending approvals</AlertBanner>}
          {rejectedVisits.length > 0 && <AlertBanner variant="danger">{rejectedVisits.length} rejected visits today</AlertBanner>}
        </div>
      )}

      {/* Top Summary KPI Cards (Enterprise ERP Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        
        <ERPKpiCard
          title="Visitors Today"
          value={todaysVisitors.length}
          subtitle="Total registered today"
          footer="Open History →"
          footerStatus="neutral"
          badgeText="TODAY"
          badgeVariant="today"
          icon={<Users size={16} />}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          onClick={() => navigate('/admin/history')}
        />

        <ERPKpiCard
          title="Waiting Approval"
          value={pendingVisits.length}
          subtitle="Pending host response"
          footer="Open Queue →"
          footerStatus="warning"
          badgeText="PENDING"
          badgeVariant="warning"
          icon={<Clock size={16} />}
          iconBg="#FFEDD5"
          iconColor="#EA580C"
          onClick={() => navigate('/admin/history')}
        />

        <ERPKpiCard
          title="Inside Premises"
          value={currentlyInside.length}
          subtitle="Meetings in progress"
          footer="Live Gate Count"
          footerStatus="positive"
          badgeText="INSIDE"
          badgeVariant="active"
          icon={<UserCheck size={16} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
          onClick={() => navigate('/admin/history')}
        />

        <ERPKpiCard
          title="Ready For Exit"
          value={readyForExit.length}
          subtitle="Awaiting gate checkout"
          footer="Open Checkout →"
          footerStatus="warning"
          badgeText="READY"
          badgeVariant="warning"
          icon={<Clock size={16} />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
          onClick={() => navigate('/admin/history')}
        />

        <ERPKpiCard
          title="Completed Today"
          value={completedVisits.length}
          subtitle="Checked out successfully"
          footer="Target Achieved"
          footerStatus="positive"
          badgeText="GOOD"
          badgeVariant="good"
          icon={<CheckCircle2 size={16} />}
          iconBg="#DCFCE7"
          iconColor="#059669"
          onClick={() => navigate('/admin/history')}
        />

        <ERPKpiCard
          title="Rejected"
          value={rejectedVisits.length}
          subtitle="Denied gate access"
          footer={rejectedVisits.length > 0 ? "▼ Security Review" : "All Clear"}
          footerStatus={rejectedVisits.length > 0 ? "negative" : "positive"}
          badgeText="BLOCKED"
          badgeVariant="danger"
          icon={<XCircle size={16} />}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          onClick={() => navigate('/admin/history')}
        />

      </div>

      {/* 3. Middle Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        
        {/* Recent Visitors */}
        <Card variant="info">
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todaysVisitors.slice(0, 5).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.company} &bull; Meeting: {v.employeeToMeet}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Badge variant={v.status === 'COMPLETED' ? 'default' : v.status === 'INSIDE' ? 'success' : 'warning'}>
                      {v.status}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setTimelineVisitorId(v.id)}>Audit</Button>
                  </div>
                </div>
              ))}
              {todaysVisitors.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No activity today</div>}
            </div>
          </CardContent>
        </Card>

        {/* Department Analytics */}
        <Card>
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Visits by Department</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deptData.slice(0, 5).map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '100px', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(d.count / (todaysVisitors.length || 1)) * 100}%`, height: '100%', backgroundColor: 'var(--primary-color)' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, width: '20px', textAlign: 'right' }}>{d.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Hosts Analytics */}
        <Card>
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Top Host Employees</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {empData.slice(0, 5).map(e => (
                <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{e.name}</span>
                  <Badge variant="info">{e.count} visits</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 4. Visitor Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Gate Traffic Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="visitors" stroke="#2563eb" fillOpacity={1} fill="url(#colorVis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <AuditTimelineModal
        isOpen={!!timelineVisitorId}
        onClose={() => setTimelineVisitorId(null)}
        visitorId={timelineVisitorId}
      />

    </div>
  );
};
