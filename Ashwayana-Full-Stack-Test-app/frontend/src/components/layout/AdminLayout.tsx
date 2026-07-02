'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AlertTriangle, WifiOff } from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const handleStatusChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ online: boolean }>;
      if (customEvent.detail) {
        setIsBackendOnline(customEvent.detail.online);
      }
    };

    window.addEventListener('backend-status-change', handleStatusChange);
    return () => {
      window.removeEventListener('backend-status-change', handleStatusChange);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#050816] text-slate-900 dark:text-white transition-colors duration-305">
      {/* MOBILE DRAWER OVERLAY BACKDROP */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300" 
        />
      )}

      {/* SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOPBAR */}
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {/* Offline / Mock Warning Banner */}
        {!isBackendOnline && (
          <div className={`px-6 py-2.5 flex items-center justify-between border-b text-xs font-bold transition-all duration-300 ${
            isDev 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {isDev ? (
                <>
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                  <span>
                    <strong>Developer Mode:</strong> Mock fallback active. The backend server at <code className="bg-amber-500/5 px-1.5 py-0.5 rounded font-mono border border-amber-500/10">192.168.68.116:8081/api</code> is unreachable. Mock changes are saved in-memory and local storage.
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                  <span>
                    <strong>Connection Error:</strong> The backend API server is offline or unreachable. Real-time updates and portfolio data retrieval are currently disabled.
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* MAIN DISPLAY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#050816] transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
