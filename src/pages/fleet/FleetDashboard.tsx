import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { Badge } from '../../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const FleetDashboard: React.FC = () => {
  const { vehicles, bookings } = useFleet();

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const bookedVehicles = vehicles.filter(v => v.status === 'BOOKED' || v.status === 'IN_TRANSIT').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE' || v.status === 'BREAKDOWN').length;

  const todayStr = new Date().toISOString().split('T')[0];

  const todaysTrips = bookings.filter(b => b.fromDate === todayStr || b.toDate === todayStr);
  const upcomingBookings = bookings.filter(b => b.fromDate > todayStr && b.status === 'APPROVED');
  const returningToday = bookings.filter(b => b.toDate === todayStr && b.status === 'DISPATCHED');
  const overdueReturns = bookings.filter(b => b.toDate < todayStr && b.status === 'DISPATCHED');

  // Chart data
  const data = [
    { name: 'Mon', usage: 12 },
    { name: 'Tue', usage: 19 },
    { name: 'Wed', usage: 15 },
    { name: 'Thu', usage: 22 },
    { name: 'Fri', usage: 28 },
    { name: 'Sat', usage: 10 },
    { name: 'Sun', usage: 5 },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header & Alerts */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Fleet Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {maintenanceVehicles > 0 && <AlertBanner variant="danger">{maintenanceVehicles} vehicles in maintenance</AlertBanner>}
          {overdueReturns.length > 0 && <AlertBanner variant="warning">{overdueReturns.length} returns overdue</AlertBanner>}
          {todaysTrips.length > 0 && <AlertBanner variant="info">{todaysTrips.length} active trips today</AlertBanner>}
          <AlertBanner variant="success">All tracking systems operational</AlertBanner>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <Card variant="success">
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Available Fleet</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{availableVehicles}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>out of {totalVehicles} total vehicles</div>
          </CardContent>
        </Card>
        
        <Card variant="info">
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Trips</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{bookedVehicles}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>currently on the road</div>
          </CardContent>
        </Card>

        <Card variant="warning">
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Upcoming Dispatch</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{upcomingBookings.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>scheduled for future</div>
          </CardContent>
        </Card>

        <Card variant="danger">
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action Required</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: overdueReturns.length > 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>{overdueReturns.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>delayed returns</div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Middle Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        
        {/* Vehicles Status List */}
        <Card variant="primary">
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Fleet Status</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {vehicles.slice(0, 5).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Badge minimal variant={v.status === 'AVAILABLE' ? 'success' : v.status === 'MAINTENANCE' ? 'danger' : 'info'}>
                      {v.status}
                    </Badge>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v.registrationNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.vehicleName}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.fuelType}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dispatch List */}
        <Card variant="info">
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Today's Dispatch</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todaysTrips.slice(0, 5).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Badge minimal variant="warning">TODAY</Badge>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{b.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.visitLocation}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.fromTime}</div>
                </div>
              ))}
              {todaysTrips.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No trips scheduled today</div>}
            </div>
          </CardContent>
        </Card>

        {/* Returns List */}
        <Card variant="warning">
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardTitle>Expected Returns</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...overdueReturns, ...returningToday].slice(0, 5).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Badge minimal variant={b.toDate < todayStr ? 'danger' : 'info'}>
                      {b.toDate < todayStr ? 'LATE' : 'TODAY'}
                    </Badge>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{b.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.department}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(b.toDate).toLocaleDateString()}</div>
                </div>
              ))}
              {returningToday.length === 0 && overdueReturns.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No vehicles returning today</div>}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 4. Bottom Chart Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <CardTitle>Fleet Utilization Trend</CardTitle>
          </CardHeader>
          <CardContent style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="usage" stroke="var(--success-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Health</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem' }}>Good Condition</div>
              <div style={{ fontWeight: 600 }}>{vehicles.filter(v => v.serviceDueKm > 1000).length}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem' }}>Service Due Soon</div>
              <div style={{ fontWeight: 600, color: 'var(--warning-color)' }}>{vehicles.filter(v => v.serviceDueKm <= 1000 && v.serviceDueKm > 0).length}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.875rem' }}>Currently Grounded</div>
              <div style={{ fontWeight: 600, color: 'var(--danger-color)' }}>{maintenanceVehicles}</div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};
