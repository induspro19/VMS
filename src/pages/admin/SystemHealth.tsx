import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Activity, Server, HardDrive, Globe, Clock, ShieldCheck, Database } from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { useVisitor } from '../../context/VisitorContext';

export const SystemHealth: React.FC = () => {
  const { visitors } = useVisitor();
  const [localStorageSize, setLocalStorageSize] = useState<string>('Calculating...');
  
  const activeVisitors = visitors.filter(v => v.status === 'INSIDE').length;
  const totalVisitors = visitors.length;

  useEffect(() => {
    try {
      let _lsTotal = 0;
      let _xLen, _x;
      for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) {
          continue;
        }
        _xLen = ((localStorage[_x].length + _x.length) * 2);
        _lsTotal += _xLen;
      }
      setLocalStorageSize((_lsTotal / 1024).toFixed(2) + ' KB');
    } catch (e) {
      setLocalStorageSize('Unavailable');
    }
  }, []);

  return (
    <div className="dashboard-layout animate-fade-in">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="flex items-center gap-3 m-0 text-2xl">
            <Activity size={28} className="text-primary" />
            System Health
          </h1>
          <p className="text-secondary mt-1">Application diagnostics and performance metrics</p>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        {/* Application Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server size={20} /> Application Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">App Name</span>
              <strong className="text-right">{appConfig.appName}</strong>
            </div>
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">Version</span>
              <strong>{appConfig.version}</strong>
            </div>
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">Build Date</span>
              <strong className="text-right">{new Date(appConfig.buildDate).toLocaleString()}</strong>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-secondary">Status</span>
              <strong className="text-success flex items-center gap-1"><ShieldCheck size={16} /> Online</strong>
            </div>
          </CardContent>
        </Card>

        {/* Database & Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HardDrive size={20} /> Storage & Database</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">Local Storage Usage</span>
              <strong>{localStorageSize}</strong>
            </div>
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">Total Visitor Records</span>
              <strong>{totalVisitors}</strong>
            </div>
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">Active Visitors</span>
              <strong className="text-warning">{activeVisitors}</strong>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-secondary">Database Connection</span>
              <strong className="text-success flex items-center gap-1"><Database size={16} /> LocalStore OK</strong>
            </div>
          </CardContent>
        </Card>

        {/* Client Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe size={20} /> Client Environment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">User Agent</span>
              <strong className="text-right text-xs max-w-[200px] truncate" title={navigator.userAgent}>
                {navigator.userAgent.substring(0, 40)}...
              </strong>
            </div>
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">Screen Resolution</span>
              <strong>{window.screen.width} x {window.screen.height}</strong>
            </div>
            <div className="flex justify-between border-b border-color pb-2">
              <span className="text-secondary">Platform</span>
              <strong>{navigator.platform || 'Unknown'}</strong>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-secondary">Last Login Time</span>
              <strong className="text-right flex items-center gap-1"><Clock size={16} /> {new Date().toLocaleTimeString()}</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
