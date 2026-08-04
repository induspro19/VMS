import React, { useMemo } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { useSettings } from '../../context/SettingsContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AlertTriangle, Download, ArrowLeft, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';

export const EmergencyDashboard: React.FC = () => {
  const { visitors } = useVisitor();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const insideVisitors = useMemo(() => visitors.filter(v => v.status === 'INSIDE' || v.status === 'READY_FOR_EXIT'), [visitors]);
  
  const expectedVisitors = useMemo(() => visitors.filter(v => v.status === 'APPROVED' && v.isPreRegistered), [visitors]);
  
  const missingCheckout = useMemo(() => insideVisitors.filter(v => v.status === 'READY_FOR_EXIT'), [insideVisitors]);

  const vendors = useMemo(() => insideVisitors.filter(v => v.purpose.toLowerCase().includes('vendor')), [insideVisitors]);
  const contractors = useMemo(() => insideVisitors.filter(v => v.purpose.toLowerCase().includes('contractor')), [insideVisitors]);
  const vips = useMemo(() => insideVisitors.filter(v => v.purpose.toLowerCase().includes('vip')), [insideVisitors]);

  const deptCounts = useMemo(() => {
    return insideVisitors.reduce((acc, v) => {
      acc[v.department] = (acc[v.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [insideVisitors]);

  const handleExport = () => {
    const exportData = insideVisitors.map(v => ({
      Name: v.name,
      Company: v.company,
      Mobile: v.mobile,
      Host: v.employeeToMeet,
      Department: v.department,
      Status: v.status,
      Entry_Time: v.entryTime ? new Date(v.entryTime).toLocaleString() : '',
    }));
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Emergency_Roster");
    writeFile(wb, `Emergency_Roster_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="admin-dashboard animate-fade-in" style={{ backgroundColor: 'var(--bg-danger-light)', minHeight: 'calc(100vh - 4rem)', padding: '2rem' }}>
      <div className="admin-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger-color)' }}>
            <Button variant="ghost" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}><ArrowLeft size={20}/></Button>
            <AlertTriangle size={32} />
            Emergency Evacuation Mode
          </h1>
          <p className="text-secondary">Real-time occupancy and evacuation roster</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="danger" onClick={handleExport} leftIcon={<Download size={18} />}>
            Export Roster
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card style={{ backgroundColor: 'var(--bg-danger-light)', border: '1px solid var(--danger-color)' }}>
          <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--danger-color)', lineHeight: 1 }}>{insideVisitors.length}</div>
            <div style={{ fontSize: '1rem', color: 'var(--danger-color)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.5rem' }}>Total Inside</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{missingCheckout.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Missing Checkout</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{contractors.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Contractors</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{vendors.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Vendors</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{vips.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>VIP Visitors</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--info-color)' }}>{expectedVisitors.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Expected</div>
          </CardContent>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
        <Card style={{ border: '2px solid var(--danger-color)' }}>
          <CardHeader style={{ backgroundColor: 'var(--danger-color)', color: '#ffffff' }}>
            <CardTitle>Evacuation Roster (Inside)</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Host & Dept</TableHead>
                    <TableHead>Location/Status</TableHead>
                    <TableHead>Time Inside</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insideVisitors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No visitors currently inside.</TableCell>
                    </TableRow>
                  )}
                  {insideVisitors.map(v => {
                    const hoursInside = v.entryTime ? ((new Date().getTime() - new Date(v.entryTime).getTime()) / (1000 * 60 * 60)).toFixed(1) : '?';
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-medium">{v.name}</div>
                          <div className="text-sm text-secondary">{v.company}</div>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} className="text-secondary" /> {v.mobile}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{v.employeeToMeet}</div>
                          <div className="text-sm text-secondary">{v.department}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={v.status === 'READY_FOR_EXIT' ? 'warning' : 'danger'}>
                            {v.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hoursInside} hrs
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle>Department Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(deptCounts).length === 0 && <p className="text-muted text-sm">No occupancy data.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(deptCounts).map(([dept, count]) => (
                  <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{dept}</span>
                    <Badge variant="default">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'var(--bg-input)' }}>
            <CardHeader>
              <CardTitle style={{ fontSize: '1rem' }}>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {settings.emergencyContacts.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No contacts configured.</p>
                )}
                {settings.emergencyContacts.map(contact => (
                  <div key={contact.id}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{contact.role}</div>
                    <div style={{
                      fontWeight: 500,
                      ...(contact.isEmergency ? { color: 'var(--danger-color)', fontSize: '1.25rem' } : {})
                    }}>{contact.phone}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
