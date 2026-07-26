import React, { useState, useEffect, useMemo } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Clock as ClockIcon, BarChart3, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AuditTimelineModal } from '../../components/ui/AuditTimelineModal';

export const AdminDashboard: React.FC = () => {
  const { visitors } = useVisitor();
  const [time, setTime] = useState(new Date());
  const [timelineVisitorId, setTimelineVisitorId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { todaysVisitors, currentlyInside, completedVisits, advancedStats } = useMemo(() => {
    const today = new Date().toDateString();
    const todayVisits = visitors.filter(v => new Date(v.registrationTime).toDateString() === today);
    const inside = todayVisits.filter(v => v.status === 'INSIDE' || v.status === 'READY_FOR_EXIT');
    const completed = todayVisits.filter(v => v.status === 'COMPLETED');
    
    // Advanced Analytics
    let totalMeetingMs = 0, meetingCount = 0;
    let totalStayMs = 0, stayCount = 0;
    let repeatCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;
    const hourMap: Record<number, number> = {};

    todayVisits.forEach(v => {
      // Peak hour
      const h = new Date(v.registrationTime).getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
      
      // Statuses
      if (v.status === 'REJECTED') rejectedCount++;
      if (v.status === 'PENDING_APPROVAL') pendingCount++;
      
      // Durations
      if (v.entryTime && v.meetingCompletedTime) {
        totalMeetingMs += new Date(v.meetingCompletedTime).getTime() - new Date(v.entryTime).getTime();
        meetingCount++;
      }
      if (v.entryTime && v.exitTime) {
        totalStayMs += new Date(v.exitTime).getTime() - new Date(v.entryTime).getTime();
        stayCount++;
      }
      
      // Repeat? (check if they have previous visits before today)
      const pastVisits = visitors.filter(pv => pv.mobile === v.mobile && new Date(pv.registrationTime).toDateString() !== today);
      if (pastVisits.length > 0) repeatCount++;
    });

    let peakHourStr = 'N/A';
    if (Object.keys(hourMap).length > 0) {
      const peakHour = parseInt(Object.keys(hourMap).reduce((a, b) => hourMap[parseInt(a)] > hourMap[parseInt(b)] ? a : b));
      peakHourStr = `${peakHour}:00 - ${peakHour + 1}:00`;
    }

    const avgMeetingStr = meetingCount > 0 ? `${Math.round(totalMeetingMs / meetingCount / 60000)} mins` : 'N/A';
    const avgStayStr = stayCount > 0 ? `${Math.round(totalStayMs / stayCount / 60000)} mins` : 'N/A';
    const repeatPct = todayVisits.length > 0 ? Math.round((repeatCount / todayVisits.length) * 100) + '%' : '0%';
    const rejectPct = todayVisits.length > 0 ? Math.round((rejectedCount / todayVisits.length) * 100) + '%' : '0%';

    return { 
      todaysVisitors: todayVisits, 
      currentlyInside: inside, 
      completedVisits: completed,
      advancedStats: {
        avgMeeting: avgMeetingStr,
        avgStay: avgStayStr,
        peakHour: peakHourStr,
        repeatPct,
        rejectPct,
        pendingCount
      }
    };
  }, [visitors]);

  // Chart Data: Department Wise
  const deptData = useMemo(() => {
    const deptMap = todaysVisitors.reduce((acc, v) => {
      acc[v.department] = (acc[v.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(deptMap).map(k => ({ name: k || 'Other', value: deptMap[k] }));
  }, [todaysVisitors]);

  // Chart Data: Employee Analytics
  const empData = useMemo(() => {
    const empMap = todaysVisitors.reduce((acc, v) => {
      acc[v.employeeToMeet] = (acc[v.employeeToMeet] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(empMap).map(k => ({ name: k, value: empMap[k] })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [todaysVisitors]);

  const COLORS = ['var(--success-color)', 'var(--info-color)', 'var(--warning-color)', 'var(--primary-color)', 'var(--danger-color)'];

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={24} style={{ color: 'var(--primary-color)' }} />
            Admin Overview Command Center
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            Enterprise Visitor Management Analytics
          </div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClockIcon size={14} /> {time.toLocaleTimeString()} • {time.toLocaleDateString()}
        </div>
      </div>

      {/* KPI Cards Row (4 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem', flexShrink: 0 }}>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', textAlign: 'center' }}>Today's Visitors</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '0.25rem' }}>{todaysVisitors.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', textAlign: 'center' }}>Currently Inside</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '0.25rem' }}>{currentlyInside.length}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', textAlign: 'center' }}>Completed Visits</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginTop: '0.25rem' }}>{completedVisits.length}</div>
        </div>
        <div className={`ui-card ${currentlyInside.length > 0 ? 'border-danger-color bg-danger-light' : ''}`} style={{ padding: '0.75rem', height: '84px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: currentlyInside.length > 0 ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', textAlign: 'center' }}>Emergency Evac</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: currentlyInside.length > 0 ? 'var(--danger-color)' : 'var(--text-primary)', lineHeight: 1, marginTop: '0.25rem' }}>{currentlyInside.length}</div>
        </div>
      </div>


      {/* Advanced KPIs Row (6 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1rem', flexShrink: 0 }}>
        <div className="ui-card" style={{ padding: '0.75rem', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Avg Meeting Time</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)' }}>{advancedStats.avgMeeting}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Avg Visitor Stay</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--info-color)' }}>{advancedStats.avgStay}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Peak Hour</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{advancedStats.peakHour}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Repeat Visitors</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success-color)' }}>{advancedStats.repeatPct}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Rejected %</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger-color)' }}>{advancedStats.rejectPct}</div>
        </div>
        <div className="ui-card" style={{ padding: '0.75rem', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Pending Approval</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--warning-color)' }}>{advancedStats.pendingCount}</div>
        </div>
      </div>

      {/* Main Content Area: Charts & Table splitting vertical space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* Charts Row: Takes roughly 40% of the remaining height */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexShrink: 0, height: '280px' }}>
          
          <Card style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <CardHeader style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <CardTitle className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                <BarChart3 size={16} /> Department Distribution
              </CardTitle>
            </CardHeader>
            <CardContent style={{ flex: 1, padding: '0.5rem', minHeight: 0 }}>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'var(--bg-card-hover)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="var(--primary-color)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted text-sm">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <CardHeader style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <CardTitle className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                <Activity size={16} /> Top Hosts Today
              </CardTitle>
            </CardHeader>
            <CardContent style={{ flex: 1, padding: '0.5rem', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {empData.length > 0 ? (
                <>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={empData} innerRadius="60%" outerRadius="90%" paddingAngle={5} dataKey="value" stroke="none">
                          {empData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '12px' }} itemStyle={{ color: 'var(--text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-3 mt-2 flex-wrap flex-shrink-0" style={{ paddingBottom: '0.5rem' }}>
                    {empData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1 text-xs text-secondary font-medium">
                        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS[index % COLORS.length] }}></div>
                        {entry.name}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted text-sm">No data available</div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Table Row: Takes the rest of the height, fully scrollable internally */}
        <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
            Latest Visitors (Today)
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="ui-table" style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 1rem' }}>Visitor</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Mobile</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Host</th>
                  <th style={{ padding: '0.5rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todaysVisitors.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No visitors today
                    </td>
                  </tr>
                )}
                {todaysVisitors.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.company}</div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{v.mobile}</td>
                    <td style={{ fontSize: '13px' }}>{v.employeeToMeet}</td>
                    <td>
                      <Badge variant={v.status === 'COMPLETED' ? 'default' : v.status === 'INSIDE' ? 'success' : v.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {v.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" onClick={() => setTimelineVisitorId(v.id)} style={{ fontSize: '12px', height: '28px', padding: '0 0.5rem' }}>
                        Timeline
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <AuditTimelineModal 
        isOpen={!!timelineVisitorId} 
        onClose={() => setTimelineVisitorId(null)} 
        visitorId={timelineVisitorId} 
      />
    </div>
  );
};
