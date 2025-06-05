import { Mail, Sparkles } from 'lucide-react';
import type React from 'react';

const AppLogo: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Mail size={size} className="text-primary" />
      <Sparkles size={size * 0.75} className="text-accent ml-0.5" />
    </div>
  );
};

export default AppLogo;
