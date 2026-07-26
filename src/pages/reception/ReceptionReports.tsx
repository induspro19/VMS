import React, { useState, useMemo } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { FileText, Download, BarChart2 } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

export const ReceptionReports: React.FC = () => {
  const { visitors } = useVisitor();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => new Date(v.registrationTime).toISOString().split('T')[0] === dateFilter);
  }, [visitors, dateFilter]);

  const stats = useMemo(() => {
    const total = filteredVisitors.length;
    const walkIns = filteredVisitors.filter(v => !v.isPreRegistered).length;
    const preReg = filteredVisitors.filter(v => v.isPreRegistered).length;
    const completed = filteredVisitors.filter(v => v.status === 'COMPLETED').length;
    const rejected = filteredVisitors.filter(v => v.status === 'REJECTED').length;
    return { total, walkIns, preReg, completed, rejected };
  }, [filteredVisitors]);

  const deptStats = useMemo(() => {
    return filteredVisitors.reduce((acc, v) => {
      acc[v.department] = (acc[v.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredVisitors]);

  const handleExportExcel = () => {
    const exportData = filteredVisitors.map(v => ({
      Visitor_Name: v.name,
      Mobile: v.mobile,
      Company: v.company,
      Purpose: v.purpose,
      Host: v.employeeToMeet,
      Department: v.department,
      Status: v.status,
      Type: v.isPreRegistered ? 'Pre-Registered' : 'Walk-in',
      Registration_Time: new Date(v.registrationTime).toLocaleString(),
    }));
    
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Reception_Report");
    writeFile(wb, `Reception_Report_${dateFilter}.xlsx`);
  };

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="admin-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={28} style={{ color: 'var(--primary-color)' }} />
            Reception Reports
          </h1>
          <p className="text-secondary">Daily metrics, walk-in summaries, and department insights.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
          <Button variant="primary" onClick={handleExportExcel} leftIcon={<Download size={18} />}>
            Export Excel
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-info-light)', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <BarChart2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Visitors</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-danger-light)', borderRadius: '50%', color: 'var(--danger-color)' }}>
              <BarChart2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Walk-ins</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.walkIns}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-success-light)', borderRadius: '50%', color: 'var(--success-color)' }}>
              <BarChart2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pre-Registered</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.preReg}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary-light)', borderRadius: '50%', color: 'var(--info-color)' }}>
              <BarChart2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Completed Visits</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.completed}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <CardTitle>Daily Visitor Log</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.length === 0 && (
                    <TableRow><TableCell colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No visitors found for this date.</TableCell></TableRow>
                  )}
                  {filteredVisitors.map(v => (
                    <TableRow key={v.id}>
                      <TableCell>{new Date(v.registrationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell>
                        <div className="font-medium">{v.name}</div>
                        <div className="text-sm text-secondary">{v.company}</div>
                      </TableCell>
                      <TableCell>{v.employeeToMeet}</TableCell>
                      <TableCell>
                        <Badge variant={v.status === 'COMPLETED' ? 'default' : v.status === 'INSIDE' ? 'success' : v.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {v.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {v.isPreRegistered ? <Badge variant="info">Pre-Reg</Badge> : <Badge variant="default">Walk-in</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(deptStats).length === 0 && <div className="text-muted text-sm text-center">No data.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(deptStats).map(([dept, count]) => (
                <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 500 }}>{dept}</span>
                  <Badge variant="default">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};
