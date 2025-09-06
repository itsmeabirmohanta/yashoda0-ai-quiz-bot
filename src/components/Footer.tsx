import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Link to="/" className="text-xl font-bold">
              <span className="text-primary">Yashoda</span> Quiz
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="https://yashoda.ai" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="/logos/darkya.png" alt="Yashoda AI" className="h-8" />
            </a>
            <a href="https://futureshiftlabs.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="/logos/FSLHR.png" alt="Future Shift Labs" className="h-8" />
            </a>
            <a href="https://yashoda.ai" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="/logos/NCWHR.png" alt="Yashoda AI Alt Logo" className="h-8" />
            </a>
          </div>
          
          <div className="text-sm text-muted-foreground mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} Yashoda AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
