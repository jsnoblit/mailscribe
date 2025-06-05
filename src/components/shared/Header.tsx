import type React from 'react';
import AppLogo from './AppLogo';

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 md:px-8 border-b">
      <div className="container mx-auto flex items-center">
        <AppLogo size={32} />
        <h1 className="ml-3 text-3xl font-headline font-semibold text-foreground">
          MailScribe
        </h1>
      </div>
    </header>
  );
};

export default Header;
