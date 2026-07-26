import React, { useState } from 'react';
import { useVisitor } from '../../context/VisitorContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
// Removed unused input import
import { FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export const ReportsPage: React.FC = () => {
  const { visitors } = useVisitor();
  
  const [filters, setFilters] = useState({
    date: '',
    department: '',
    status: '',
    search: ''
  });

  const filteredVisitors = visitors.filter(v => {
    if (filters.date && !v.registrationTime.startsWith(filters.date)) return false;
    if (filters.department && v.department !== filters.department) return false;
    if (filters.status && v.status !== filters.status) return false;
    if (filters.search && !v.name.toLowerCase().includes(filters.search.toLowerCase()) && !v.company.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredVisitors.map(v => ({
      ID: v.id,
      Name: v.name,
      Company: v.company,
      Department: v.department,
      Mobile: v.mobile,
      Host: v.employeeToMeet,
      Status: v.status,
      Registration: new Date(v.registrationTime).toLocaleString(),
      Entry: v.entryTime ? new Date(v.entryTime).toLocaleString() : 'N/A',
      Exit: v.exitTime ? new Date(v.exitTime).toLocaleString() : 'N/A',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visitors');
    XLSX.writeFile(wb, 'Visitor_Report.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Enterprise VMS - Visitor Report', 14, 15);
    
    // Very basic PDF layout since jspdf-autotable isn't installed
    let y = 30;
    filteredVisitors.slice(0, 20).forEach((v, index) => {
      doc.text(`${index + 1}. ${v.name} (${v.company}) - ${v.status} - Host: ${v.employeeToMeet}`, 14, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    
    if (filteredVisitors.length > 20) {
       doc.text(`... and ${filteredVisitors.length - 20} more records. Export Excel for full data.`, 14, y);
    }
    
    doc.save('Visitor_Report.pdf');
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: '#6B7280' }} />
            Reports & Analytics
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={exportPDF} style={{ height: '36px', padding: '0 16px', fontSize: '14px', gap: '6px', display: 'flex', alignItems: 'center' }}>
            <FileText size={16} /> Export PDF
          </Button>
          <Button variant="primary" onClick={exportExcel} style={{ height: '36px', padding: '0 16px', fontSize: '14px', gap: '6px', display: 'flex', alignItems: 'center' }}>
            <Download size={16} /> Export Excel
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563' }}>Date</label>
          <input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563' }}>Department</label>
          <input type="text" placeholder="e.g. IT, HR" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563' }}>Status</label>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ height: '36px', padding: '0 32px 0 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px', backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer', width: '100%' }}>
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="INSIDE">Inside</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563' }}>Search</label>
          <input type="text" placeholder="Name or Company" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', width: '100%' }} />
        </div>
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Host & Dept</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No records found</TableCell>
                </TableRow>
              )}
              {filteredVisitors.map(v => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-sm text-muted">{v.company}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{v.employeeToMeet}</div>
                    <div className="text-sm text-muted">{v.department || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(v.registrationTime).toLocaleDateString()}</div>
                    <div className="text-sm text-muted">{new Date(v.registrationTime).toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.status === 'COMPLETED' ? 'default' : v.status === 'INSIDE' ? 'success' : v.status === 'REJECTED' ? 'danger' : 'warning'}>
                      {v.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
