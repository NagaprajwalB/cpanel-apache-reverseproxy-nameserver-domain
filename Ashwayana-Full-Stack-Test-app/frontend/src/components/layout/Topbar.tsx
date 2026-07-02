'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Bell, User, LogOut, Globe, Building2, Menu, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className="
      h-20
      border-b
      border-slate-200
      dark:border-white/10
      bg-white/90
      dark:bg-[#050816]/90
      backdrop-blur-xl
      px-4
      sm:px-8
      flex
      items-center
      justify-between
      transition-colors
      duration-300
      z-20
      "
    >
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Menu Button on Mobile */}
        <button
          onClick={onToggleSidebar}
          className="
          md:hidden
          p-2
          rounded-xl
          bg-slate-50
          dark:bg-slate-900
          hover:bg-slate-100
          dark:hover:bg-slate-800
          text-slate-600
          dark:text-slate-350
          border
          border-slate-150
          dark:border-slate-850
          transition-colors
          cursor-pointer
          "
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Ashvayana Console
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold hidden xs:block">
            Premium Real Estate CRM
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Add Property */}
        <Button
          className="
          bg-amber-500
          text-black
          hover:bg-amber-400
          transition-all
          font-bold
          text-xs
          h-9
          px-3
          sm:h-10
          sm:px-4
          rounded-xl
          cursor-pointer
          "
          onClick={() => router.push('/dashboard/properties/new')}
        >
          <Building2 className="sm:mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Add Property</span>
        </Button>

        {/* Live Website */}
        <Button
          variant="outline"
          className="
          border-slate-200
          dark:border-amber-500/20
          text-slate-700
          dark:text-amber-400
          hover:bg-slate-100
          dark:hover:bg-amber-500/10
          font-semibold
          text-xs
          h-9
          w-9
          p-0
          sm:w-auto
          sm:h-10
          sm:px-4
          rounded-xl
          cursor-pointer
          "
          onClick={() =>
            window.open(
              'https://ashvayanadevelopers.com',
              '_blank'
            )
          }
          title="Go to Live Site"
        >
          <Globe className="sm:mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Live Site</span>
        </Button>

        {/* Public Properties */}
        <Button
          variant="outline"
          className="
          border-slate-200
          dark:border-amber-500/20
          text-slate-705
          dark:text-amber-400
          hover:bg-slate-100
          dark:hover:bg-amber-500/10
          font-semibold
          text-xs
          h-9
          w-9
          p-0
          sm:w-auto
          sm:h-10
          sm:px-4
          rounded-xl
          cursor-pointer
          hidden xs:flex
          "
          onClick={() =>
            window.open(
              'https://ashvayanadevelopers.com/properties',
              '_blank'
            )
          }
          title="Public Properties View"
        >
          <Eye className="sm:mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Properties</span>
        </Button>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-0.5 sm:mx-1" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
          h-9
          w-9
          rounded-xl
          bg-slate-50
          dark:bg-slate-900/50
          border
          border-slate-150
          dark:border-slate-850
          flex
          items-center
          justify-center
          hover:bg-slate-100
          dark:hover:bg-slate-850
          transition-colors
          cursor-pointer
          "
          title="Toggle Theme"
        >
          {!mounted ? (
            <div className="h-4 w-4" />
          ) : theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="
          h-9
          w-9
          rounded-xl
          bg-slate-50
          dark:bg-slate-900/50
          border
          border-slate-150
          dark:border-slate-850
          flex
          items-center
          justify-center
          hover:bg-slate-100
          dark:hover:bg-slate-850
          transition-colors
          cursor-pointer
          "
          title="Notifications"
        >
          <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

        {/* User Info */}
        <div className="text-right hidden md:block">
          <p className="font-bold text-slate-800 dark:text-white text-xs">
            {user?.name || 'Super Admin'}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            {user?.role || 'ADMIN'}
          </p>
        </div>

        {/* Avatar */}
        <div
          className="
          h-9
          w-9
          rounded-xl
          bg-amber-500/10
          dark:bg-amber-500/20
          flex
          items-center
          justify-center
          border
          border-amber-500/20
          "
        >
          <User className="h-4.5 w-4.5 text-amber-600 dark:text-amber-450" />
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="hover:scale-105 transition cursor-pointer p-1 rounded-lg hover:bg-rose-500/10"
          title="Logout"
        >
          <LogOut className="h-4.5 w-4.5 text-rose-500" />
        </button>
      </div>
    </header>
  );
}