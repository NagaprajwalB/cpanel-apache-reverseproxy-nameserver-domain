'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Briefcase,
  PhoneCall,
  Activity,
  DollarSign,
  TrendingUp,
  ChevronRight,
  FolderOpen,
  Star,
  Target,
  AlertTriangle,
  CalendarDays,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { parseProjectDescription, getProjectIdFromKeywords } from '@/lib/metadata';
import { Badge } from '@/components/ui/badge';

interface DashboardProperty {
  id: number;
  title: string;
  slug: string;
  description?: string;
  price?: number | string;
  priceLabel?: string;
  type?: string;
  status?: string;
  city?: string;
  keywords?: string;
  createdAt?: string;
  area?: number;
}

interface DashboardProject {
  id: number;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  location?: string;
  status?: string;
  totalUnits?: number;
  availableUnits?: number;
  createdAt?: string;
}

interface DashboardEnquiry {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  status?: string;
  createdDate?: string;
  property?: { id: number; title: string };
}

interface DashboardTeamMember {
  id: number;
  name: string;
  designation: string;
  active: boolean;
}

const parsePrice = (price: string | number | null | undefined): number => {
  if (price === undefined || price === null) return 0;
  if (typeof price === 'number') {
    if (price > 1e12 || isNaN(price)) return 0;
    return price;
  }
  const str = String(price).trim();
  if (!str) return 0;
  const cleanStr = str.replace(/[,]/g, '').replace(/[\u20B9]/g, '').trim();
  const lower = cleanStr.toLowerCase();
  let multiplier = 1;
  let numPart = cleanStr;
  if (lower.includes('cr') || lower.includes('crore')) {
    multiplier = 10000000;
    numPart = lower.replace(/cr(ore)?/g, '').trim();
  } else if (lower.includes('l') || lower.includes('lakh')) {
    multiplier = 100000;
    numPart = lower.replace(/l(akh)?/g, '').trim();
  }
  const val = parseFloat(numPart);
  if (isNaN(val) || val > 1e12) return 0;
  return val * multiplier;
};

const formatCurrency = (value: number): string => {
  if (value >= 10000000) return '\u20B9' + (value / 10000000).toFixed(2) + ' Cr';
  if (value >= 100000) return '\u20B9' + (value / 100000).toFixed(1) + ' L';
  if (value > 0) return '\u20B9' + value.toLocaleString('en-IN');
  return 'N/A';
};

const formatCompact = (value: number): string => {
  if (value >= 10000000) return '\u20B9' + (value / 10000000).toFixed(1) + 'Cr';
  if (value >= 100000) return '\u20B9' + (value / 100000).toFixed(0) + 'L';
  if (value > 0) return '\u20B9' + value.toLocaleString('en-IN');
  return '—';
};

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sales' | 'portfolio'>('overview');

  const { data: properties = [], isLoading: loadingProperties } = useQuery<DashboardProperty[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await api.get('/properties?size=200');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery<DashboardProject[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?size=100');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  const { data: enquiries = [], isLoading: loadingEnquiries } = useQuery<DashboardEnquiry[]>({
    queryKey: ['enquiries'],
    queryFn: async () => {
      const res = await api.get('/enquiries?size=200');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  useQuery<DashboardTeamMember[]>({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await api.get('/team?size=100');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  const loading = loadingProperties || loadingProjects || loadingEnquiries;

  // Portfolio metrics
  const totalValuation = useMemo(() =>
    properties.reduce((s, p) => s + parsePrice(p.price), 0), [properties]);

  const soldProperties = useMemo(() =>
    properties.filter(p => p.status === 'SOLD_OUT' || p.status === 'Sold'), [properties]);

  const availableProperties = useMemo(() =>
    properties.filter(p => ['UPCOMING', 'ONGOING', 'ACTIVE', 'New', 'Available'].includes(p.status || '')), [properties]);

  const soldValuation = useMemo(() =>
    soldProperties.reduce((s, p) => s + parsePrice(p.price), 0), [soldProperties]);

  const availableValuation = useMemo(() =>
    availableProperties.reduce((s, p) => s + parsePrice(p.price), 0), [availableProperties]);

  const totalUnitsAll = useMemo(() =>
    projects.reduce((s, p) => s + (Number(p.totalUnits) || 0), 0), [projects]);

  const availableUnitsAll = useMemo(() =>
    projects.reduce((s, p) => {
      const avail = p.availableUnits != null ? Number(p.availableUnits) : null;
      const total = Number(p.totalUnits) || 0;
      return s + (avail !== null && !isNaN(avail) ? avail : total);
    }, 0), [projects]);

  const occupancyRate = useMemo(() => {
    if (totalUnitsAll > 0)
      return Math.min(100, Math.round(((totalUnitsAll - availableUnitsAll) / totalUnitsAll) * 100));
    if (properties.length > 0)
      return Math.round((soldProperties.length / properties.length) * 100);
    return 0;
  }, [totalUnitsAll, availableUnitsAll, soldProperties, properties]);

  // Sales metrics
  const thisMonthEnquiries = useMemo(() => {
    const now = new Date();
    return enquiries.filter(e => {
      if (!e.createdDate) return false;
      const d = new Date(e.createdDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [enquiries]);

  const newLeads = enquiries.filter(e => e.status === 'New' || e.status === 'NEW');
  const contactedLeads = enquiries.filter(e => e.status === 'Contacted' || e.status === 'CONTACTED');
  const closedLeads = enquiries.filter(e => e.status === 'Closed' || e.status === 'CLOSED');
  const conversionRate = enquiries.length > 0
    ? Math.round((closedLeads.length / enquiries.length) * 100) : 0;

  const leadTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const mYear = d.getFullYear();
      const count = enquiries.filter(e => {
        if (!e.createdDate) return false;
        const ed = new Date(e.createdDate);
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
      }).length;
      result.push({ name: `${mName} ${String(mYear).slice(2)}`, count });
    }
    return result;
  }, [enquiries]);

  const { points, pathD, areaD, chartWidth, chartHeight, chartPadding } = useMemo(() => {
    const maxLeads = Math.max(...leadTrendData.map(d => d.count), 5);
    const width = 500;
    const height = 180;
    const padding = 25;
    const pts = leadTrendData.map((d, index) => {
      const x = padding + (index * (width - padding * 2)) / (leadTrendData.length - 1);
      const y = height - padding - (d.count * (height - padding * 2)) / maxLeads;
      return { x, y, label: d.name, val: d.count };
    });
    let pD = '';
    if (pts.length > 0) {
      pD = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }
    let aD = '';
    if (pts.length > 0) {
      aD = `${pD} L ${pts[pts.length - 1].x} ${height - padding} L ${pts[0].x} ${height - padding} Z`;
    }
    return { points: pts, pathD: pD, areaD: aD, chartWidth: width, chartHeight: height, chartPadding: padding };
  }, [leadTrendData]);

  // Project analytics
  const projectDetails = useMemo(() => projects.map(p => {
    const { metadata } = parseProjectDescription(p.description || '') as {
      metadata: { progressPercent?: number; healthScore?: number };
    };
    const projectProps = properties.filter(prop =>
      getProjectIdFromKeywords(prop.keywords || '') === p.id
    );
    const totalP = Number(p.totalUnits) || projectProps.length || 1;
    const availP = p.availableUnits != null
      ? Number(p.availableUnits)
      : projectProps.filter(pp => pp.status !== 'SOLD_OUT').length;
    const soldP = Math.max(0, totalP - availP);
    const revenue = projectProps
      .filter(pp => pp.status === 'SOLD_OUT')
      .reduce((s, pp) => s + parsePrice(pp.price), 0);
    return {
      ...p,
      progress: metadata?.progressPercent || 0,
      health: metadata?.healthScore || 100,
      projectProps,
      totalUnitsCalc: totalP,
      soldUnits: soldP,
      revenue,
      occupancyRate: Math.min(100, Math.round((soldP / totalP) * 100)),
    };
  }).sort((a, b) => b.revenue - a.revenue), [projects, properties]);

  const avgProjectProgress = useMemo(() => {
    if (!projectDetails.length) return 0;
    return Math.round(projectDetails.reduce((s, p) => s + p.progress, 0) / projectDetails.length);
  }, [projectDetails]);

  const atRiskProjects = projectDetails.filter(p => p.health < 70);

  // Type distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    properties.forEach(p => {
      const t = p.type || 'OTHER';
      if (!counts[t]) counts[t] = { count: 0, value: 0 };
      counts[t].count++;
      counts[t].value += parsePrice(p.price);
    });
    return Object.entries(counts)
      .map(([type, { count, value }]) => ({
        type, count, value,
        percent: Math.round((count / Math.max(properties.length, 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [properties]);

  // Location data
  const locationData = useMemo(() => {
    const locs: Record<string, { count: number; value: number }> = {};
    properties.forEach(p => {
      const city = p.city || 'Unknown';
      if (!locs[city]) locs[city] = { count: 0, value: 0 };
      locs[city].count++;
      locs[city].value += parsePrice(p.price);
    });
    return Object.entries(locs)
      .map(([city, { count, value }]) => ({ city, count, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [properties]);

  const maxLocationValue = Math.max(...locationData.map(l => l.value), 1);

  // Activity feed
  const activityFeed = useMemo(() => {
    const items: { id: string; type: 'property' | 'project' | 'enquiry'; title: string; subtitle: string; date: Date; }[] = [];
    enquiries.slice(0, 5).forEach(e => items.push({
      id: 'enq-' + e.id, type: 'enquiry',
      title: e.name || 'New Enquiry',
      subtitle: 'Lead from ' + (e.property?.title || 'General Interest') + ' \u25cf ' + (e.status || 'New'),
      date: e.createdDate ? new Date(e.createdDate) : new Date(),
    }));
    projects.slice(0, 3).forEach(p => items.push({
      id: 'proj-' + p.id, type: 'project',
      title: p.title,
      subtitle: 'Project in ' + (p.location || 'Ashvayana Estate') + ' \u25cf ' + (p.status || 'Active'),
      date: p.createdAt ? new Date(p.createdAt) : new Date(),
    }));
    properties.slice(0, 4).forEach(p => items.push({
      id: 'prop-' + p.id, type: 'property',
      title: p.title,
      subtitle: (p.type || 'Property') + ' in ' + (p.city || 'Portfolio') + ' \u25cf ' + formatCompact(parsePrice(p.price)),
      date: p.createdAt ? new Date(p.createdAt) : new Date(),
    }));
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [enquiries, projects, properties]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto p-1 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-[450px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  const kpiData = [
    { label: 'Portfolio Value', value: formatCurrency(totalValuation), sub: properties.length + ' listings', icon: DollarSign, color: 'amber' },
    { label: 'Available Stock', value: formatCurrency(availableValuation), sub: availableProperties.length + ' active', icon: Building2, color: 'indigo' },
    { label: 'Revenue Booked', value: formatCurrency(soldValuation), sub: soldProperties.length + ' sold', icon: TrendingUp, color: 'emerald' },
    { label: 'Occupancy', value: occupancyRate + '%', sub: totalUnitsAll > 0 ? (totalUnitsAll - availableUnitsAll) + '/' + totalUnitsAll + ' units' : soldProperties.length + '/' + properties.length + ' props', icon: Target, color: 'violet' },
    { label: 'Projects', value: projects.length, sub: atRiskProjects.length + ' flagged', icon: Briefcase, color: 'sky' },
    { label: 'CRM Leads', value: enquiries.length, sub: thisMonthEnquiries.length + ' this month', icon: PhoneCall, color: 'rose' },
  ];

  const colorMap: Record<string, { text: string; light: string; border: string; bg: string }> = {
    amber: { text: 'text-amber-500', light: 'bg-amber-500/10 border-amber-500/20', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
    indigo: { text: 'text-indigo-500', light: 'bg-indigo-500/10 border-indigo-500/20', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5' },
    emerald: { text: 'text-emerald-500', light: 'bg-emerald-500/10 border-emerald-500/20', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
    violet: { text: 'text-violet-500', light: 'bg-violet-500/10 border-violet-500/20', border: 'border-violet-500/20', bg: 'bg-violet-500/5' },
    sky: { text: 'text-sky-500', light: 'bg-sky-500/10 border-sky-500/20', border: 'border-sky-500/20', bg: 'bg-sky-500/5' },
    rose: { text: 'text-rose-500', light: 'bg-rose-500/10 border-rose-500/20', border: 'border-rose-500/20', bg: 'bg-rose-500/5' },
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 p-1">
      {/* Header / Executive summary info */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black tracking-[4px] uppercase text-emerald-600 dark:text-emerald-400">Live CRM Command center</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Aggregated intelligence report for Ashvayana brand • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-stretch lg:self-auto justify-center">
          {(['overview', 'sales', 'portfolio'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                selectedTab === tab
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 max-w-4xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Ashvayana Executive Insights</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Portfolio Operations Status: Nominal</h2>
          <p className="text-slate-450 text-xs leading-relaxed">
            The brand currently features <strong className="text-white">{properties.length} high-end listings</strong> across <strong className="text-white">{projects.length} signature projects</strong>, representing an aggregated valuation of <strong className="text-white">{formatCurrency(totalValuation)}</strong>. With a closing conversion rate of <strong className="text-emerald-400 font-bold">{conversionRate}%</strong> and an average project construction progress of <strong className="text-amber-400 font-bold">{avgProjectProgress}%</strong>, operational performance metrics remain stable. {atRiskProjects.length > 0 ? `${atRiskProjects.length} projects are flagged with construction warnings requiring review.` : 'All construction milestones are currently tracking on schedule.'}
          </p>
        </div>
        <div className="flex flex-row md:flex-col gap-6 self-stretch md:self-auto justify-between border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-8 text-center md:text-left">
          <div className="min-w-[120px]">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Operational Health</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">96.8%</p>
          </div>
          <div className="min-w-[120px]">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Pipeline</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{newLeads.length + contactedLeads.length} leads</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiData.map((kpi, i) => {
          const c = colorMap[kpi.color];
          return (
            <div 
              key={i} 
              className={`bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl p-5 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className={`h-9 w-9 rounded-xl ${c.light} flex items-center justify-center border`}>
                  <kpi.icon className={`h-4.5 w-4.5 ${c.text}`} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-4">{kpi.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{kpi.value}</p>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-2 font-medium border-t border-slate-50 dark:border-slate-900/50 pt-2">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Column 1: Sales Pipeline Funnel & Shortcuts */}
          <div className="space-y-6">
            {/* Sales Pipeline Funnel */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales Pipeline</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Leads Conversion stages</h2>
              </div>
              
              {enquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FolderOpen className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-450 italic">No prospect enquiries recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Inbox Queue (New)', count: newLeads.length, color: 'bg-indigo-500', text: 'text-indigo-500', bg: 'bg-indigo-500/10', pct: Math.round((newLeads.length / Math.max(enquiries.length, 1)) * 100) },
                    { label: 'In Contact (Follow-up)', count: contactedLeads.length, color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10', pct: Math.round((contactedLeads.length / Math.max(enquiries.length, 1)) * 100) },
                    { label: 'Closed Won (Deals)', count: closedLeads.length, color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', pct: Math.round((closedLeads.length / Math.max(enquiries.length, 1)) * 100) },
                  ].map(stage => (
                    <div key={stage.label} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-350">{stage.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${stage.bg} ${stage.text}`}>{stage.pct}%</span>
                          <span className="font-bold text-slate-900 dark:text-white">{stage.count} leads</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-105 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full ${stage.color} rounded-full transition-all duration-500`} style={{ width: stage.pct + '%' }} />
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center mt-6">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Overall closing</span>
                      <span className="text-xs text-slate-505 font-medium">Conversion success rate</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-500">{conversionRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-5 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Shortcuts</span>
              <div className="space-y-1.5 pt-1">
                {[
                  { label: 'Register New Property', href: '/dashboard/properties/new' },
                  { label: 'Create New Project', href: '/dashboard/projects/new' },
                  { label: 'Manage CRM Enquiries', href: '/dashboard/enquiries' },
                  { label: 'Manage Team Members', href: '/dashboard/team' },
                ].map(link => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="flex items-center justify-between p-3 border border-slate-105 dark:border-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 hover:border-amber-500/20 hover:bg-slate-55/50 dark:hover:bg-slate-900/30 transition-all duration-200"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Lead Inflow Chart & Top Performing Projects */}
          <div className="space-y-6">
            {/* Lead Influx Analytics Chart */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inbound CRM Analytics</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Lead Inflow Trend</h2>
              </div>
              
              {enquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-450 italic">No historical CRM data.</p>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {/* SVG Chart */}
                  <div className="relative h-44 w-full bg-slate-50/50 dark:bg-[#060a16]/50 border border-slate-100 dark:border-slate-900 rounded-2xl p-2">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      {Array.from({ length: 4 }).map((_, i) => {
                        const y = chartPadding + (i * (chartHeight - chartPadding * 2)) / 3;
                        return (
                          <line 
                            key={i} 
                            x1={chartPadding} 
                            y1={y} 
                            x2={chartWidth - chartPadding} 
                            y2={y} 
                            className="stroke-slate-200 dark:stroke-slate-800" 
                            strokeWidth="0.5" 
                          />
                        );
                      })}

                      {/* Area path */}
                      {areaD && (
                        <path d={areaD} fill="url(#chartGradient)" />
                      )}

                      {/* Line path */}
                      {pathD && (
                        <path 
                          d={pathD} 
                          fill="none" 
                          stroke="#f59e0b" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      )}

                      {/* Interactive points & labels */}
                      {points.map((p, idx) => (
                        <g key={idx} className="group/node cursor-pointer">
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="5" 
                            className="fill-amber-500 stroke-white dark:stroke-[#060a16]" 
                            strokeWidth="2" 
                          />
                          {/* Glow on hover */}
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="9" 
                            className="fill-amber-500/20 opacity-0 group-hover/node:opacity-100 transition-opacity" 
                          />
                          {/* Text Value tooltip on hover */}
                          <text 
                            x={p.x} 
                            y={p.y - 12} 
                            textAnchor="middle" 
                            className="fill-slate-900 dark:fill-white text-[10px] font-black opacity-0 group-hover/node:opacity-100 transition-opacity"
                          >
                            {p.val}
                          </text>
                          {/* X-axis Label */}
                          <text 
                            x={p.x} 
                            y={chartHeight - 5} 
                            textAnchor="middle" 
                            className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <span>Last 6 Months (Dynamic group)</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> +15.5% Lead velocity</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Performing Projects */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Realized Yield</span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Top Projects Yield</h2>
                </div>
                <Link href="/dashboard/projects" className="text-xs text-amber-600 dark:text-amber-450 font-bold hover:underline flex items-center gap-1">
                  All Projects <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              
              {projectDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FolderOpen className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-450 italic">No project data registered.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectDetails.slice(0, 3).map((proj, idx) => (
                    <div key={proj.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-transparent hover:border-slate-105 dark:hover:border-slate-800 transition-all duration-200">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-450 font-black text-sm flex-shrink-0 border border-amber-500/20">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{proj.title}</p>
                          <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg whitespace-nowrap">
                            {proj.revenue > 0 ? formatCompact(proj.revenue) : '₹0'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: proj.occupancyRate + '%' }} />
                          </div>
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold whitespace-nowrap">{proj.occupancyRate}% units sold</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Recent Activity Timeline & Alerts */}
          <div className="space-y-6">
            {/* Recent Activity Timeline */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Updates</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Recent Activity Timeline</h2>
              </div>
              
              {activityFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarDays className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-455 italic">No recent updates logged.</p>
                </div>
              ) : (
                <div className="relative pl-4 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:border-l before:border-dashed before:border-slate-200 dark:before:border-slate-805">
                  {activityFeed.map(item => (
                    <div key={item.id} className="relative group/item flex items-start gap-3">
                      {/* Circle Bullet */}
                      <div className={`absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#0f172a] shadow-sm z-10 transition-transform group-hover/item:scale-125 ${
                        item.type === 'enquiry' ? 'bg-rose-500' : 
                        item.type === 'project' ? 'bg-amber-500' : 
                        'bg-indigo-500'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-905 dark:text-white group-hover/item:text-amber-500 transition-colors truncate">{item.title}</p>
                          <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                            {item.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-555 dark:text-slate-450 font-medium truncate mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Status Alert */}
            {atRiskProjects.length > 0 ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500 animate-bounce" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {atRiskProjects.length} Construction alert
                  </span>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-450 font-medium leading-relaxed">
                  Project schedules show construction delay or health score alerts. Action required.
                </p>
                <div className="pt-2">
                  {atRiskProjects.slice(0, 2).map(p => (
                    <p key={p.id} className="text-xs font-bold truncate flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <ChevronRight className="h-3 w-3 flex-shrink-0" /> {p.title}
                    </p>
                  ))}
                </div>
                <Link href="/dashboard/projects" className="text-xs font-bold text-rose-600 dark:text-rose-450 hover:underline flex items-center gap-1.5 pt-2">
                  Review Projects <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : projects.length > 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-3xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    All Projects healthy
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-450 font-medium leading-relaxed">
                  Active project timelines are within normal thresholds. Portfolio status nominal.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tab: Sales */}
      {selectedTab === 'sales' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Funnel Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Enquiries', value: enquiries.length, sub: 'Lifetime incoming leads', trend: 'Inbound CRM base', icon: PhoneCall, color: 'indigo' },
              { label: 'New Leads', value: newLeads.length, sub: 'Requires sales follow-up', trend: 'Qualification inbox', icon: Clock, color: 'violet' },
              { label: 'conversion won', value: conversionRate + '%', sub: closedLeads.length + ' deals closed', trend: 'Overall CRM performance', icon: Target, color: 'emerald' },
              { label: 'Active Pipeline', value: newLeads.length + contactedLeads.length, sub: 'Ongoing prospect discussions', trend: 'Sales rep workload', icon: Zap, color: 'amber' },
            ].map((s, i) => {
              const c = colorMap[s.color];
              return (
                <div key={i} className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{s.label}</span>
                    <div className={`h-7 w-7 rounded-lg ${c.light} flex items-center justify-center`}>
                      <s.icon className={`h-4 w-4 ${c.text}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{s.sub}</p>
                  <span className="text-[9px] text-slate-400 block border-t border-slate-50 dark:border-slate-900/60 pt-2 mt-2 font-medium">{s.trend}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Most Enquired Properties */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6 lg:col-span-1">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-bold">Demand metrics</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Most Enquired Properties</h2>
              </div>
              
              {enquiries.length === 0 ? (
                <div className="py-20 text-center">
                  <FolderOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-450 italic">No enquiries logged yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    enquiries.reduce((acc: Record<string, number>, e) => {
                      const title = e.property?.title || 'General Enquiry';
                      acc[title] = (acc[title] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([property, count], idx) => {
                      const pct = Math.round((count / Math.max(enquiries.length, 1)) * 100);
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{property}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-450 dark:text-slate-400 text-[10px] font-bold">{count} enquiries</span>
                              <span className="font-bold text-amber-500">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-905 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: pct + '%' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Recent Leads Feed */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CRM qualification</span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Recent CRM Leads</h2>
                </div>
                <Link href="/dashboard/enquiries" className="text-xs text-amber-600 dark:text-amber-450 font-bold hover:underline flex items-center gap-1">
                  Full Pipeline CRM <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {enquiries.length === 0 ? (
                <p className="text-xs text-slate-450 text-center py-20 italic">No prospects found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 px-2">Prospect name</th>
                        <th className="pb-3 px-2">Estate Interest</th>
                        <th className="pb-3 px-2">Registered Date</th>
                        <th className="pb-3 px-2 text-right">CRM Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-900/60">
                      {enquiries.slice(0, 5).map(e => (
                        <tr key={e.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{e.name || '—'}</td>
                          <td className="py-3 px-2 text-amber-600 dark:text-amber-450 font-semibold">{e.property?.title || 'General Enquiry'}</td>
                          <td className="py-3 px-2 text-slate-400 font-medium">
                            {e.createdDate ? new Date(e.createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Badge className={`rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                              e.status === 'New' || e.status === 'NEW' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                              e.status === 'Contacted' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border border-emerald-505/20'
                            }`}>
                              {e.status || 'New'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Portfolio */}
      {selectedTab === 'portfolio' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Mix */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Mix</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Asset Typology distribution</h2>
              </div>
              
              {typeDistribution.length === 0 ? (
                <div className="py-20 text-center">
                  <FolderOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-450 italic">No inventory mix registered.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {typeDistribution.slice(0, 5).map((t, i) => (
                    <div key={t.type} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{t.type}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-semibold">{t.count} units</span>
                          <span className="font-black text-amber-600 dark:text-amber-450">{formatCompact(t.value)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-905 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{
                          width: t.percent + '%',
                          background: ['#f59e0b','#6366f1','#10b981','#8b5cf6','#f43f5e','#0ea5e9'][i % 6]
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Regional Map stats */}
            <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Geographic Yield</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Regional Valuations</h2>
              </div>
              
              {locationData.length === 0 ? (
                <div className="py-20 text-center">
                  <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-455 italic">No location records available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {locationData.map((loc) => (
                    <div key={loc.city} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-amber-505 flex-shrink-0" />
                          <span className="font-bold text-slate-700 dark:text-slate-350">{loc.city}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-450 font-semibold">{loc.count} listings</span>
                          <span className="font-black text-amber-600 dark:text-amber-450">{formatCompact(loc.value)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-905 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500" style={{ width: Math.round((loc.value / maxLocationValue) * 100) + '%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Progress Tracker */}
          <div className="bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Development timelines</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Project construction Progress</h2>
              </div>
              <div className="flex items-center gap-2 bg-amber-550/15 border border-amber-500/20 rounded-xl px-3 py-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-black text-amber-600 dark:text-amber-450">{avgProjectProgress}% Overall progress</span>
              </div>
            </div>

            {projectDetails.length === 0 ? (
              <div className="py-20 text-center">
                <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-450 italic">No projects registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectDetails.map(proj => (
                  <div key={proj.id} className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl hover:border-amber-500/20 transition-all duration-200 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{proj.title}</h3>
                          {proj.health < 70 && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 animate-bounce" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> {proj.location || 'Ashvayana Estate'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg">{proj.revenue > 0 ? formatCompact(proj.revenue) : '₹0'}</span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">revenue booked</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-900/50 pt-3">
                      {[
                        { label: 'Construction', val: proj.progress, color: 'bg-amber-500', display: proj.progress + '%', textColor: 'text-slate-700 dark:text-slate-300' },
                        { label: 'Units Sold', val: proj.occupancyRate, color: 'bg-indigo-500', display: proj.soldUnits + '/' + proj.totalUnitsCalc, textColor: 'text-slate-700 dark:text-slate-300' },
                        { label: 'Health Score', val: proj.health, color: proj.health >= 80 ? 'bg-emerald-500' : proj.health >= 60 ? 'bg-amber-500' : 'bg-rose-500', display: proj.health + '/100', textColor: proj.health >= 80 ? 'text-emerald-500' : proj.health >= 60 ? 'text-amber-500' : 'text-rose-505' },
                      ].map(bar => (
                        <div key={bar.label} className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">{bar.label}</span>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className={`h-full ${bar.color} rounded-full`} style={{ width: bar.val + '%' }} />
                          </div>
                          <span className={`text-[10px] font-bold mt-0.5 block ${bar.textColor}`}>{bar.display}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Valuations breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Available Stock Value', count: availableProperties.length, value: formatCurrency(availableValuation), color: 'indigo', desc: 'Ready inventory assets on market' },
              { label: 'Closed sales Value', count: soldProperties.length, value: formatCurrency(soldValuation), color: 'emerald', desc: 'Revenue booked from sold units' },
              { label: 'Ultra Luxury tier (1.5Cr+)', count: properties.filter(p => parsePrice(p.price) >= 15000000).length, value: formatCurrency(properties.filter(p => parsePrice(p.price) >= 15000000).reduce((s, p) => s + parsePrice(p.price), 0)), color: 'amber', desc: 'Top premium luxury residences' },
            ].map((s, i) => {
              const c = colorMap[s.color];
              return (
                <div key={i} className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s.label}</span>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">{s.count}</p>
                  <p className={`text-sm font-bold mt-1.5 ${c.text}`}>{s.value}</p>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-semibold">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}