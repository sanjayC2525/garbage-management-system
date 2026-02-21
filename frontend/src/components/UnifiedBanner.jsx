import { useLocation } from 'react-router-dom';
import Header from './Header';

const UnifiedBanner = ({ children }) => {
  const location = useLocation();
  
  // Determine page title based on current route
  const getPageTitle = () => {
    if (location.pathname.includes('/admin')) return 'Admin Dashboard';
    if (location.pathname.includes('/worker')) return 'Worker Dashboard';
    if (location.pathname.includes('/citizen')) return 'Citizen Portal';
    return 'Garbage Management System';
  };

  const pageTitle = getPageTitle();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Global Header */}
      <Header />

      {/* Premium Banner */}
      <div className="relative w-full h-48 md:h-56 bg-gradient-to-br from-primary via-accent to-primary/80 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-2xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-text-inverse mb-2 tracking-tight animate-fade-in">
              {pageTitle}
            </h1>
            <p className="text-lg md:text-xl text-text-inverse/80 font-light animate-slide-up" style={{animationDelay: '0.2s'}}>
              Efficient waste management for cleaner communities
            </p>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="bg-surface border-t border py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-text-secondary text-sm">
              &copy; 2026 Garbage Management System. Built with precision and care.
            </div>
            <div className="flex items-center space-x-6 text-text-muted text-xs">
              <span>Status</span>
              <span className="w-2 h-2 bg-status-success rounded-full animate-pulse-slow"></span>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnifiedBanner;
