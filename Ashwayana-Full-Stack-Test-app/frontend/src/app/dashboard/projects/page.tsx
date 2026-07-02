'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Plus,
  Search,
  MapPin,
  Pencil,
  Trash2,
  Building2,
  Loader2,
  TrendingUp,
  Percent,
  Compass,
  DollarSign,
  Briefcase,
  X,
  FileText,
  HeartPulse,
  Download,
  Eye,
  SlidersHorizontal,
  Layers,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { parseProjectDescription } from '@/lib/metadata';

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  location?: string;
  status: string;
  thumbnailUrl?: string;
  completionYear?: string;
  totalUnits?: number;
  featured?: boolean;
}

interface ParsedProject extends Project {
  cleanDescription: string;
  metadata: import('@/lib/metadata').ProjectMetadata;
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [sortBy, setSortBy] = useState('TITLE_ASC');
  
  // Drawer & Insights State
  const [drawerProject, setDrawerProject] = useState<ParsedProject | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch Projects
  const { data: rawProjects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?size=100');
      return (res.data?.data?.content || res.data?.data || []) as Project[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/projects/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (drawerProject?.id === deletedId) setDrawerProject(null);
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (project: Project) => {
      const payload = {
        ...project,
        featured: !project.featured,
      };
      return api.put(`/projects/${project.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Parse Description Metadata for each Project
  const parsedProjects = rawProjects.map((project) => {
    const { description: cleanDesc, metadata } = parseProjectDescription(project.description);
    return {
      ...project,
      cleanDescription: cleanDesc,
      metadata,
    };
  });

  // Unique List of Stages for filters
  const constructionStages = Array.from(
    new Set(parsedProjects.map((p) => p.metadata?.constructionStage).filter(Boolean))
  ) as string[];

  // Filter Logic
  const filteredProjects = parsedProjects.filter((project) => {
    const matchesSearch =
      project.title?.toLowerCase().includes(search.toLowerCase()) ||
      project.location?.toLowerCase().includes(search.toLowerCase()) ||
      project.metadata?.reraNumber?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === 'ALL' || project.status?.toUpperCase() === selectedStatus;

    const matchesStage =
      selectedStage === 'ALL' || project.metadata?.constructionStage === selectedStage;

    return matchesSearch && matchesStatus && matchesStage;
  });

  // Sort Logic
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'TITLE_ASC') return a.title.localeCompare(b.title);
    if (sortBy === 'TITLE_DESC') return b.title.localeCompare(a.title);
    if (sortBy === 'BUDGET_DESC') return (b.metadata?.budget || 0) - (a.metadata?.budget || 0);
    if (sortBy === 'BUDGET_ASC') return (a.metadata?.budget || 0) - (b.metadata?.budget || 0);
    if (sortBy === 'UNITS_DESC') {
      const uA = a.totalUnits || a.metadata?.totalUnits || 0;
      const uB = b.totalUnits || b.metadata?.totalUnits || 0;
      return uB - uA;
    }
    if (sortBy === 'PROGRESS_DESC') return (b.metadata?.progressPercent || 0) - (a.metadata?.progressPercent || 0);
    return 0;
  });

  // Pagination Logic
  const totalItems = sortedProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic Dashboard Statistics
  const totalProjectsCount = parsedProjects.length;
  const ongoingCount = parsedProjects.filter((p) => p.status?.toUpperCase() === 'ONGOING').length;
  const completedCount = parsedProjects.filter((p) => p.status?.toUpperCase() === 'COMPLETED').length;
  const upcomingCount = parsedProjects.filter((p) => p.status?.toUpperCase() === 'UPCOMING').length;

  const totalUnits = parsedProjects.reduce((acc, p) => acc + (p.totalUnits || p.metadata?.totalUnits || 0), 0);
  const soldUnits = parsedProjects.reduce((acc, p) => acc + (p.metadata?.soldUnits || 0), 0);
  const availableUnits = parsedProjects.reduce((acc, p) => acc + (p.metadata?.availableUnits || 0), 0);
  const occupancyRate = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;
  const totalPortfolioValuation = parsedProjects.reduce((acc, p) => acc + (p.metadata?.budget || 0), 0);

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = [
      'Project ID', 'Project Name', 'Status', 'Location', 'Total Units',
      'Sold Units', 'Available Units', 'Progress Percent', 'Construction Stage',
      'Budget (INR)', 'RERA Number', 'Developer'
    ];
    const rows = parsedProjects.map((p) => [
      p.id,
      p.title,
      p.status,
      p.location || 'N/A',
      p.totalUnits || p.metadata?.totalUnits || 0,
      p.metadata?.soldUnits || 0,
      p.metadata?.availableUnits || 0,
      p.metadata?.progressPercent || 0,
      p.metadata?.constructionStage || 'N/A',
      p.metadata?.budget || 0,
      p.metadata?.reraNumber || 'N/A',
      p.metadata?.developerName || 'N/A'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ashvayana_Projects_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-800 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading portfolio metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white p-8 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Projects Portfolio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
            Control center for development milestones, financial budgets, and occupancy tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 h-12 px-4 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Portfolio
          </Button>

          <Link href="/dashboard/projects/new">
            <Button className="bg-amber-500 text-black hover:bg-amber-400 font-semibold rounded-xl px-5 h-12 shadow-lg shadow-amber-500/10 flex items-center gap-2 cursor-pointer">
              <Plus className="h-5 w-5" />
              Add Project
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Total Projects */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Portfolio Projects</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {totalProjectsCount}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <span className="text-blue-500 font-semibold">{upcomingCount} Upcoming</span>
              <span>•</span>
              <span className="text-emerald-500 font-semibold">{ongoingCount} Ongoing</span>
            </div>
          </div>
          <Building2 className="h-10 w-10 text-amber-500 shrink-0" />
        </div>

        {/* Occupancy Rate */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Portfolio Occupancy Rate</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {occupancyRate}%
            </h2>
            <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }} />
            </div>
          </div>
          <Percent className="h-10 w-10 text-amber-500 shrink-0" />
        </div>

        {/* Units Sold vs Available */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total / Sold / Avail Units</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {totalUnits}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <span className="text-amber-500 font-semibold">{soldUnits} Sold</span>
              <span>/</span>
              <span className="text-emerald-500 font-semibold">{availableUnits} Avail</span>
            </div>
          </div>
          <Briefcase className="h-10 w-10 text-amber-500 shrink-0" />
        </div>

        {/* Total Valuation */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Portfolio Budget Valuation</p>
            <h2 className="text-3xl font-extrabold mt-2.5 text-slate-900 dark:text-white">
              ₹{(totalPortfolioValuation / 10000000).toFixed(1)} Cr
            </h2>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Total capitalization threshold
            </p>
          </div>
          <DollarSign className="h-10 w-10 text-amber-500 shrink-0" />
        </div>
      </div>

      {/* INSIGHTS PANEL */}
      {showInsights && (
        <div className="rounded-3xl border border-amber-500/15 bg-amber-500/5 backdrop-blur-md p-6 mb-8 relative animate-fade-in flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <button
            onClick={() => setShowInsights(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Compass className="h-5 w-5" />
              Dynamic Portfolio Insights
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
              Currently, <span className="font-semibold text-amber-500">{ongoingCount} developments</span> are under active construction, reflecting a structural commitment of <span className="font-semibold text-emerald-500">₹{((parsedProjects.filter(p => p.status === 'ONGOING').reduce((acc, p) => acc + (p.metadata?.budget || 0), 0)) / 10000000).toFixed(1)} Cr</span>. Average project health score stands at <span className="font-semibold text-blue-400">{Math.round(parsedProjects.reduce((acc, p) => acc + (p.metadata?.healthScore || 100), 0) / (totalProjectsCount || 1))}%</span>, displaying high structural compliance across developers.
            </p>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="bg-slate-900/10 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Active Stages</span>
              <span className="text-lg font-bold text-amber-500">{constructionStages.length || 0}</span>
            </div>
            <div className="bg-slate-900/10 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Compliance Rating</span>
              <span className="text-lg font-bold text-emerald-500">A+</span>
            </div>
          </div>
        </div>
      )}

      {/* LUXURY METRIC CHARTS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart 1: Units Sold vs Available Bar Chart */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/10 bg-white dark:bg-[#0f172a]/40 p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <h4 className="text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Units Sold vs Available
            </h4>
            <p className="text-xs text-slate-400 mt-1">Inventory distribution breakdown</p>
          </div>
          
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Sold Units ({soldUnits})</span>
              <span className="font-bold text-amber-500">{totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden flex">
              <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-l-full" style={{ width: `${totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0}%` }} />
              <div className="bg-emerald-500 h-full rounded-r-full" style={{ width: `${totalUnits > 0 ? (availableUnits / totalUnits) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                <span>Sold ({soldUnits})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <span>Available ({availableUnits})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Project Status Distribution */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/10 bg-white dark:bg-[#0f172a]/40 p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <h4 className="text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Project Status Distribution
            </h4>
            <p className="text-xs text-slate-400 mt-1">Status breakdown of developments</p>
          </div>
          
          <div className="py-4 space-y-3">
            {/* Ongoing */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-500">ONGOING ({ongoingCount})</span>
                <span className="text-slate-400">{totalProjectsCount > 0 ? Math.round((ongoingCount / totalProjectsCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalProjectsCount > 0 ? (ongoingCount / totalProjectsCount) * 100 : 0}%` }} />
              </div>
            </div>
            {/* Upcoming */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-500">UPCOMING ({upcomingCount})</span>
                <span className="text-slate-400">{totalProjectsCount > 0 ? Math.round((upcomingCount / totalProjectsCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalProjectsCount > 0 ? (upcomingCount / totalProjectsCount) * 100 : 0}%` }} />
              </div>
            </div>
            {/* Completed */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-500">COMPLETED ({completedCount})</span>
                <span className="text-slate-400">{totalProjectsCount > 0 ? Math.round((completedCount / totalProjectsCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalProjectsCount > 0 ? (completedCount / totalProjectsCount) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Construction Progress Meter */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/10 bg-white dark:bg-[#0f172a]/40 p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <h4 className="text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Portfolio Construction stage
            </h4>
            <p className="text-xs text-slate-400 mt-1">Average construction completeness</p>
          </div>
          
          <div className="py-6 flex flex-col items-center justify-center relative">
            {/* Circular Progress Gauge using simple SVG */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-slate-200 dark:stroke-slate-850 fill-transparent"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-amber-500 fill-transparent"
                strokeWidth="8"
                strokeDasharray={251}
                strokeDashoffset={251 - (251 * (parsedProjects.reduce((acc, p) => acc + (p.metadata?.progressPercent || 0), 0) / (totalProjectsCount || 1))) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {Math.round(parsedProjects.reduce((acc, p) => acc + (p.metadata?.progressPercent || 0), 0) / (totalProjectsCount || 1))}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Average</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL PANEL */}
      <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl p-6 mb-8 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-350">
            <SlidersHorizontal className="h-4 w-4 text-amber-500" />
            <span>Search & Filters</span>
          </div>
          <button
            onClick={() => {
              setSearch('');
              setSelectedStatus('ALL');
              setSelectedStage('ALL');
              setSortBy('TITLE_ASC');
              setCurrentPage(1);
            }}
            className="text-xs text-amber-600 dark:text-amber-400 hover:opacity-85 font-medium transition-opacity"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search project title, location, RERA..."
              className="w-full h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 outline-none text-sm text-slate-800 dark:text-white focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 outline-none text-sm text-slate-700 dark:text-white cursor-pointer focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Construction Stage Dropdown */}
          <select
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 outline-none text-sm text-slate-700 dark:text-white cursor-pointer focus:border-amber-500"
          >
            <option value="ALL">All Stages</option>
            {constructionStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 outline-none text-sm text-slate-700 dark:text-white cursor-pointer focus:border-amber-500"
          >
            <option value="TITLE_ASC">Alphabetical (A-Z)</option>
            <option value="TITLE_DESC">Alphabetical (Z-A)</option>
            <option value="BUDGET_DESC">Budget: High to Low</option>
            <option value="BUDGET_ASC">Budget: Low to High</option>
            <option value="UNITS_DESC">Units: High to Low</option>
            <option value="PROGRESS_DESC">Progress: Completeness</option>
          </select>
        </div>
      </div>

      {/* PROJECTS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedProjects.map((project) => {
          const budgetVal = project.metadata?.budget;
          const progressVal = project.metadata?.progressPercent || 0;
          return (
            <div
              key={project.id}
              className="rounded-[32px] overflow-hidden bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 hover:border-amber-500/40 transition-all duration-500 shadow-sm flex flex-col justify-between group"
            >
              <div>
                {/* Visual Image Banner */}
                <div className="h-56 overflow-hidden relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />
                  ) : (
                    <div className="text-slate-400 dark:text-slate-650 flex flex-col items-center gap-2">
                      <Building2 className="h-14 w-14 opacity-30" />
                      <span className="text-[10px] tracking-wider uppercase font-bold opacity-60">Luxury Asset Placeholder</span>
                    </div>
                  )}

                  {/* Status absolute badge */}
                  <span
                    className={`absolute top-4 right-4 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md ${
                      project.status?.toUpperCase() === 'ONGOING'
                        ? 'bg-emerald-500 text-black'
                        : project.status?.toUpperCase() === 'COMPLETED'
                        ? 'bg-amber-500 text-black'
                        : 'bg-blue-500 text-black'
                    }`}
                  >
                    {project.status?.replace('_', ' ')}
                  </span>

                  {/* Progress percent line absolute overlay bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/40">
                    <div className="bg-amber-500 h-full" style={{ width: `${progressVal}%` }} />
                  </div>
                </div>

                {/* Info specifications */}
                <div className="p-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-500" />
                      {project.location || 'Location Not Defined'}
                    </span>
                    {project.metadata?.reraNumber && (
                      <span>RERA: {project.metadata.reraNumber}</span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight group-hover:text-amber-500 transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 min-h-[40px] font-light leading-relaxed">
                    {project.shortDescription || project.cleanDescription || 'No detail portfolio parameters set.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/40 pt-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Total Capital Budget</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {budgetVal ? `₹${(budgetVal / 10000000).toFixed(1)} Cr` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Construction Completeness</span>
                      <span className="font-bold text-amber-500">{progressVal}% Done</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="p-6 pt-2">
                <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                  {/* View Details slide out drawer */}
                  <Button
                    onClick={() => setDrawerProject(project)}
                    variant="outline"
                    className="flex-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Inspect
                  </Button>

                  <Link href={`/dashboard/projects/${project.id}/edit`}>
                    <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-2 h-10 w-10 flex items-center justify-center shrink-0">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>

                  <button
                    onClick={() => toggleFeaturedMutation.mutate(project)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
                      project.featured
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:text-amber-500'
                    }`}
                  >
                    <Award className="h-4.5 w-4.5" />
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="destructive" className="rounded-xl p-2 h-10 w-10 shrink-0" />}>
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                          This action cannot be undone. It will permanently remove this project entity and details from the database portfolio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(project.id)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-24 text-slate-400 dark:text-slate-500">
          <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30 animate-pulse" />
          <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-1">No Projects Found</h4>
          <p className="text-sm opacity-80">Adjust search parameters or select different construction filter criteria.</p>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-12">
          <Button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="border-slate-200 dark:border-slate-800 rounded-xl h-10 px-4 disabled:opacity-50"
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
            className="border-slate-200 dark:border-slate-800 rounded-xl h-10 px-4 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}

      {/* DETAILS SLIDE OUT DRAWER */}
      {drawerProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0b0e14] h-full shadow-2xl overflow-y-auto p-8 relative border-l border-slate-200 dark:border-amber-500/10 flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-amber-500" />
                  <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Project Specifications Drawer</span>
                </div>
                <button
                  onClick={() => setDrawerProject(null)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="py-6 space-y-8">
                {/* Project Image Banner */}
                {drawerProject.thumbnailUrl && (
                  <div className="h-64 rounded-2xl overflow-hidden shadow-inner border border-slate-100 dark:border-slate-850">
                    <img src={drawerProject.thumbnailUrl} alt={drawerProject.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Title and location */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{drawerProject.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span>{drawerProject.location || 'Location not specified'}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 bg-slate-50 dark:bg-[#111622] p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600 dark:text-slate-350">Construction Progress</span>
                    <span className="text-amber-500">{drawerProject.metadata?.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${drawerProject.metadata?.progressPercent || 0}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 text-xs text-slate-400">
                    <span>Stage: <span className="font-semibold text-slate-700 dark:text-slate-300">{drawerProject.metadata?.constructionStage || 'Planning'}</span></span>
                    <span>Timeline: <span className="font-semibold text-slate-700 dark:text-slate-300">{drawerProject.metadata?.completionTimeline || 'N/A'}</span></span>
                  </div>
                </div>

                {/* Specs list */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">RERA Number</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{drawerProject.metadata?.reraNumber || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Developer Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{drawerProject.metadata?.developerName || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Capitalization Budget</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {drawerProject.metadata?.budget ? `₹${drawerProject.metadata.budget.toLocaleString('en-IN')}` : 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Launch / Possession</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {drawerProject.metadata?.launchDate || 'N/A'} / {drawerProject.metadata?.possessionDate || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-6">
                  <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Detailed Description</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-light">
                    {drawerProject.cleanDescription || 'No detailed specifications.'}
                  </p>
                </div>

                {/* Highlights and landmarks */}
                {(drawerProject.metadata?.highlights?.length ?? 0) > 0 && (
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-6">
                    <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Key Portfolio Highlights</h4>
                    <div className="flex flex-wrap gap-2">
                      {drawerProject.metadata.highlights?.map((h: string) => (
                        <span key={h} className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Links */}
                {(drawerProject.metadata?.brochureUrl || drawerProject.metadata?.masterPlanUrl) && (
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-6">
                    <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">PDF Documents</h4>
                    <div className="flex gap-4">
                      {drawerProject.metadata.brochureUrl && (
                        <a href={drawerProject.metadata.brochureUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-xs rounded-xl flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4 text-amber-500" />
                            Brochure PDF
                          </Button>
                        </a>
                      )}
                      {drawerProject.metadata.masterPlanUrl && (
                        <a href={drawerProject.metadata.masterPlanUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-xs rounded-xl flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4 text-amber-500" />
                            Master Plan PDF
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Drawer Footer */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-6 flex gap-4 bg-transparent">
              <Link href={`/dashboard/projects/${drawerProject.id}/edit`} className="flex-1">
                <Button className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl h-11 flex items-center justify-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Project details
                </Button>
              </Link>
              <Link href={`/dashboard/properties?projectId=${drawerProject.id}`} className="flex-1">
                <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl h-11 flex items-center justify-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" />
                  View Units Inventory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
