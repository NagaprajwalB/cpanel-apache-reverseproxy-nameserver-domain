'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Hammer,
  Users,
  Sparkles,
  MessageSquare,
  PhoneCall,
  Settings,
  UserCircle,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const sections = [
  {
    title: 'OVERVIEW',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'PROPERTY MANAGEMENT',
    items: [
      {
        name: 'Properties',
        href: '/dashboard/properties',
        icon: Building2,
      },
      {
        name: 'Projects',
        href: '/dashboard/projects',
        icon: Briefcase,
      },
      {
        name: 'Materials',
        href: '/dashboard/materials',
        icon: Hammer,
      },
      {
        name: 'Amenities',
        href: '/dashboard/amenities',
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      {
        name: 'Team',
        href: '/dashboard/team',
        icon: Users,
      },
      {
        name: 'Testimonials',
        href: '/dashboard/testimonials',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'CUSTOMERS',
    items: [
      {
        name: 'Enquiries',
        href: '/dashboard/enquiries',
        icon: PhoneCall,
      },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      {
        name: 'Users',
        href: '/dashboard/users',
        icon: UserCircle,
      },
      {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#050816] border-r border-slate-200 dark:border-amber-500/10 flex flex-col transition-all duration-300 md:translate-x-0 md:relative md:flex",
      isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
    )}>
      {/* MOBILE CLOSE BUTTON */}
      <button 
        onClick={onClose} 
        className="md:hidden absolute top-4 right-4 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 border border-slate-150 dark:border-slate-850"
      >
        <X className="h-4.5 w-4.5" />
      </button>

      {/* LOGO AREA */}
      <div className="px-6 py-8 border-b border-slate-200 dark:border-amber-500/10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ashvayana
          </h1>
          <p className="text-xs tracking-[3px] uppercase text-amber-600 dark:text-amber-400 mt-1 font-bold">
            Admin Console
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-bold tracking-[2px] text-slate-400 dark:text-slate-500 uppercase">
              {section.title}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-305 text-sm font-semibold',
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-450 text-slate-950 shadow shadow-amber-550/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4.5 w-4.5 transition-colors',
                        isActive
                          ? 'text-slate-950 font-bold'
                          : 'text-slate-400 dark:text-slate-550 group-hover:text-amber-500'
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-200 dark:border-amber-500/10 p-5">
        <div className="rounded-2xl bg-slate-50 dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-yellow-500/10 border border-slate-150 dark:border-amber-500/15 p-4">
          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
            Logged in as
          </p>
          <p className="font-extrabold text-slate-800 dark:text-white mt-0.5 text-sm">
            Super Admin
          </p>
        </div>
      </div>
    </aside>
  );
}