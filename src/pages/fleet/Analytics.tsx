import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { BarChart2, TrendingUp, DollarSign, Activity } from 'lucide-react';

export const FleetAnalytics: React.FC = () => {
  const { vehicles, bookings, maintenanceRecords } = useFleet();

  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
  
  const completedTrips = bookings.filter(b => b.status === 'COMPLETED');
  const totalKmDriven = completedTrips.reduce((sum, b) => sum + ((b.endKm && b.startKm) ? (b.endKm - b.startKm) : 0), 0);
  
  // Calculate utilization (simplistic: % of vehicles currently booked/dispatched/reserved out of available)
  const unavailableCount = vehicles.filter(v => v.status === 'BOOKED' || v.status === 'RESERVED').length;
  const utilizationPercent = vehicles.length > 0 ? Math.round((unavailableCount / vehicles.length) * 100) : 0;

  const statCards = [
    { title: 'Fleet Utilization', value: `${utilizationPercent}%`, icon: <Activity size={24} style={{ color: 'var(--primary-color)' }} /> },
    { title: 'Total Trips (YTD)', value: completedTrips.length, icon: <TrendingUp size={24} style={{ color: 'var(--success-color)' }} /> },
    { title: 'Total Distance', value: `${totalKmDriven.toLocaleString()} km`, icon: <BarChart2 size={24} style={{ color: 'var(--info-color)' }} /> },
    { title: 'Maintenance Cost', value: `₹${totalMaintenanceCost.toLocaleString()}`, icon: <DollarSign size={24} style={{ color: 'var(--warning-color)' }} /> },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Analytics & Insights</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Performance metrics and cost analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((stat, idx) => (
          <Card key={idx}>
            <CardContent style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{stat.title}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stat.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <CardTitle>Department Usage (Trips)</CardTitle>
          </CardHeader>
          <CardContent style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            [ Chart Area - Department Breakdown ]
            {/* In a real app, integrate Recharts or Chart.js here */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Costs by Vehicle Type</CardTitle>
          </CardHeader>
          <CardContent style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            [ Chart Area - Maintenance Breakdown ]
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
