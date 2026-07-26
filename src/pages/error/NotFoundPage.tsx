import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-background p-6">
      <div className="ui-card flex flex-col items-center text-center p-8 max-w-md">
        <FileQuestion size={64} className="text-secondary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-secondary mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    </div>
  );
};
