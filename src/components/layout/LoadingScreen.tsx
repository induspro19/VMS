import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={48} className="animate-spin text-primary" />
        <p className="text-secondary font-medium">Loading Enterprise VMS...</p>
      </div>
    </div>
  );
};
