import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Download, Search } from 'lucide-react';
import { Input } from '../../components/ui/Input';

export const FleetReports: React.FC = () => {
  const { bookings, vehicles, drivers } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBookings = bookings.filter(b => 
    b.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.visitLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // In a real app, this would use XLSX to generate an Excel file
    alert('Exporting to Excel... (Placeholder)');
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Fleet Reports</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Comprehensive log of all vehicle trips and bookings</p>
        </div>
        <Button variant="outline" onClick={handleExport} leftIcon={<Download size={18} />}>
          Export Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <Input 
              placeholder="Search by Employee, Dept, Location..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Range</TableHead>
                <TableHead>Employee & Dept</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Vehicle & Driver</TableHead>
                <TableHead>Distance (Km)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No bookings found matching search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.sort((a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()).map(booking => {
                  const vehicle = vehicles.find(v => v.id === booking.vehicleId);
                  const driver = drivers.find(d => d.id === booking.driverId);
                  
                  const kmDriven = (booking.endKm && booking.startKm) ? (booking.endKm - booking.startKm) : '-';

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div style={{ fontWeight: 500 }}>{booking.fromDate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>to {booking.toDate}</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 500 }}>{booking.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{booking.department}</div>
                      </TableCell>
                      <TableCell>{booking.visitLocation}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 500 }}>{vehicle?.vehicleName} ({vehicle?.registrationNumber})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{driver ? driver.name : (booking.needDriver ? 'Pending Assignment' : 'Self Drive')}</div>
                      </TableCell>
                      <TableCell>{kmDriven} km</TableCell>
                      <TableCell>
                        <Badge variant={
                          booking.status === 'COMPLETED' ? 'success' :
                          booking.status === 'APPROVED' ? 'success' :
                          booking.status === 'DISPATCHED' ? 'info' :
                          booking.status === 'PENDING' ? 'warning' : 'danger'
                        }>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
