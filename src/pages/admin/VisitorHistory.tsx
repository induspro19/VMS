import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisitor } from '../../context/VisitorContext';
import { useCommunication } from '../../context/CommunicationContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
// Removed unused import
import { Search, Download, Clock } from 'lucide-react';
import { AuditTimelineModal } from '../../components/ui/AuditTimelineModal';
import { utils, writeFile } from 'xlsx';

export const VisitorHistory: React.FC = () => {
  const { visitors } = useVisitor();
  const { logs } = useCommunication();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timelineVisitorId, setTimelineVisitorId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                            v.mobile.includes(search) || 
                            v.company.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime());
  }, [visitors, search, statusFilter]);

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  
  const paginatedVisitors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVisitors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVisitors, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleExport = () => {
    const exportData = filteredVisitors.map(v => ({
      ID: v.id,
      Name: v.name,
      Mobile: v.mobile,
      Company: v.company,
      Department: v.department,
      Host: v.employeeToMeet,
      Status: v.status,
      Registration_Time: new Date(v.registrationTime).toLocaleString(),
      Entry_Time: v.entryTime ? new Date(v.entryTime).toLocaleString() : '',
      Exit_Time: v.exitTime ? new Date(v.exitTime).toLocaleString() : '',
      Pre_Registered: v.isPreRegistered ? 'Yes' : 'No',
      Force_Exit: v.isOverride ? 'Yes' : 'No',
      Override_Reason: v.overrideReason || '',
    }));
    
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Visitor History");
    writeFile(wb, "Visitor_History_Export.xlsx");
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} style={{ color: '#6B7280' }} />
            Visitor History & Audit
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input 
              type="text"
              placeholder="Search visitors..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0 12px 0 36px', height: '36px', fontSize: '14px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none' }}
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ height: '36px', padding: '0 32px 0 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '14px', backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="INSIDE">Inside</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          
          <Button variant="primary" onClick={handleExport} style={{ height: '36px', padding: '0 16px', fontSize: '14px', gap: '6px', display: 'flex', alignItems: 'center' }}>
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Visitor Details</TableHead>
                  <TableHead>Host & Dept</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No matching records found.</TableCell>
                  </TableRow>
                )}
                {paginatedVisitors.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="font-medium">{new Date(v.registrationTime).toLocaleDateString()}</div>
                      <div className="text-sm text-secondary">{new Date(v.registrationTime).toLocaleTimeString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{v.name}</div>
                      <div className="text-sm text-secondary">{v.company} • {v.mobile}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{v.employeeToMeet}</div>
                      <div className="text-sm text-secondary">{v.department}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.status === 'COMPLETED' ? 'default' : v.status === 'INSIDE' ? 'success' : v.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {v.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {v.isPreRegistered && <Badge variant="info">Pre-Reg</Badge>}
                        {v.isOverride && <Badge variant="danger">Force Exit</Badge>}
                        {logs.some(l => l.visitorName === v.name) && <Badge variant="warning">Comms Logged</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="ghost" size="sm" onClick={() => setTimelineVisitorId(v.id)}>Audit</Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/visitor/${v.id}`)}>Profile</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
          <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
          <Button variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}

      <AuditTimelineModal 
        isOpen={!!timelineVisitorId} 
        onClose={() => setTimelineVisitorId(null)} 
        visitorId={timelineVisitorId} 
      />
    </div>
  );
};
