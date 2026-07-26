import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-background p-6">
      <div className="ui-card flex flex-col items-center text-center p-8 max-w-md border-danger">
        <ShieldAlert size={64} className="text-danger mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-secondary mb-6">
          You do not have permission to view this page. Please contact your system administrator if you believe this is an error.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>Return to Safe Area</Button>
      </div>
    </div>
  );
};
