'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  MapPin,
  Pencil,
  Trash2,
  Building2,
  Loader2,
  Percent,
  SlidersHorizontal,
  DollarSign,
  Award,
  FileText,
  HeartPulse,
  X,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  Video,
  Compass,
  Eye,
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
import { 
  parsePropertyDescription, 
  parseProjectDescription,
  getProjectIdFromKeywords 
} from '@/lib/metadata';

interface Property {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceLabel?: string;
  type: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: string;
  floor?: number;
  totalFloors?: number;
  parkingSpaces?: number;
  thumbnailUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  videoUrl?: string;
  featured: boolean;
  imageUrls?: string[];
}

interface ParsedProperty extends Property {
  cleanDescription: string;
  metadata: import('@/lib/metadata').PropertyMetadata;
  associatedProjId: number | null;
  linkedProject?: { id: number; title: string };
}

function PropertiesDashboardContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('PRICE_ASC');

  // Bulk & Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [drawerProperty, setDrawerProperty] = useState<ParsedProperty | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Sync associated project ID from URL parameters
  useEffect(() => {
    if (urlProjectId) {
      setSelectedProjectFilter(urlProjectId);
    }
  }, [urlProjectId]);

  // Fetch Properties & Projects
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await api.get('/properties?size=100');
      return (res.data?.data?.content || res.data?.data || []) as Property[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?size=100');
      return res.data?.data?.content || res.data?.data || [];
    },
  });

  const drawerLinkedProjectObj = drawerProperty ? projects.find((p: { id: number; description?: string }) => p.id === drawerProperty.associatedProjId) as { id: number; description: string } | undefined : null;
  const drawerLinkedProjectRera = drawerLinkedProjectObj ? parseProjectDescription(drawerLinkedProjectObj.description || '').metadata?.reraNumber : null;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/properties/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setSelectedIds(prev => prev.filter(x => x !== deletedId));
      if (drawerProperty?.id === deletedId) setDrawerProperty(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => api.delete(`/properties/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setSelectedIds([]);
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (property: Property) => {
      const payload = {
        ...property,
        featured: !property.featured,
      };
      return api.put(`/properties/${property.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const bulkFeaturedMutation = useMutation({
    mutationFn: async ({ ids, featured }: { ids: number[]; featured: boolean }) => {
      await Promise.all(
        ids.map(async (id) => {
          const prop = properties.find((p) => p.id === id);
          if (prop) {
            await api.put(`/properties/${id}`, { ...prop, featured });
          }
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setSelectedIds([]);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      await Promise.all(
        ids.map(async (id) => {
          const prop = properties.find((p) => p.id === id);
          if (prop) {
            await api.put(`/properties/${id}`, { ...prop, status });
          }
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setSelectedIds([]);
    },
  });

  // Parse Metadata & Project link
  const parsedProperties = properties.map((property) => {
    const { description: cleanDesc, metadata } = parsePropertyDescription(property.description);
    const associatedProjId = getProjectIdFromKeywords(property.keywords);
    const linkedProject = projects.find((p: { id: number; title: string }) => p.id === associatedProjId);
    
    return {
      ...property,
      cleanDescription: cleanDesc,
      metadata,
      associatedProjId,
      linkedProject,
    };
  });

  // Filters logic
  const filteredProperties = parsedProperties.filter((prop) => {
    const matchesSearch =
      prop.title?.toLowerCase().includes(search.toLowerCase()) ||
      prop.city?.toLowerCase().includes(search.toLowerCase()) ||
      prop.address?.toLowerCase().includes(search.toLowerCase()) ||
      prop.metadata?.propertyCode?.toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedType === 'ALL' || prop.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || prop.status === selectedStatus;
    
    const matchesProject =
      selectedProjectFilter === 'ALL' ||
      String(prop.associatedProjId) === selectedProjectFilter;

    return matchesSearch && matchesType && matchesStatus && matchesProject;
  });

  // Sort logic
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'PRICE_ASC') return a.price - b.price;
    if (sortBy === 'PRICE_DESC') return b.price - a.price;
    if (sortBy === 'AREA_DESC') return (b.area || 0) - (a.area || 0);
    if (sortBy === 'BEDROOMS_DESC') return (b.bedrooms || 0) - (a.bedrooms || 0);
    return 0;
  });

  // Pagination
  const totalItems = sortedProperties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProperties = sortedProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats Calculations
  const totalPropsCount = parsedProperties.length;
  const availableCount = parsedProperties.filter(p => p.status === 'UPCOMING' || p.status === 'ONGOING').length;
  const soldCount = parsedProperties.filter(p => p.status === 'SOLD_OUT').length;
  const featuredCount = parsedProperties.filter(p => p.featured).length;

  const villasCount = parsedProperties.filter(p => p.type === 'VILLA').length;
  const apartmentsCount = parsedProperties.filter(p => p.type === 'APARTMENT').length;
  const penthouseCount = parsedProperties.filter(p => p.type === 'PENTHOUSE').length;
  const commercialCount = parsedProperties.filter(p => p.type === 'COMMERCIAL').length;

  const totalInventoryValue = parsedProperties.reduce((acc, p) => acc + (p.price || 0), 0);
  const averagePricePerSqFt = parsedProperties.reduce((acc, p) => {
    if (p.price && p.area) {
      return acc + (p.price / p.area);
    }
    return acc;
  }, 0) / (parsedProperties.filter(p => p.price && p.area).length || 1);

  // Selection toggles
  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };


  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white p-8 transition-colors duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Properties Inventory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
            Control room for pricing matrix, structural floor plans, and unit availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/properties/new">
            <Button className="bg-amber-500 text-black hover:bg-amber-400 font-semibold rounded-xl px-5 h-12 shadow-lg shadow-amber-500/10 flex items-center gap-2 cursor-pointer">
              <Plus className="h-5 w-5" />
              Add Property Unit
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Total Units */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Properties</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {totalPropsCount}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <span className="text-amber-500 font-semibold">{featuredCount} Featured</span>
              <span>•</span>
              <span className="text-emerald-500 font-semibold">{availableCount} Available</span>
            </div>
          </div>
          <Building2 className="h-10 w-10 text-amber-500 shrink-0" />
        </div>

        {/* Villas */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Luxury Villas</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {villasCount}
            </h2>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Individual premium estates
            </p>
          </div>
          <Award className="h-10 w-10 text-amber-500 shrink-0" />
        </div>

        {/* Apartments */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Apartments & Penthouses</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {apartmentsCount + penthouseCount}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <span>{apartmentsCount} Apts</span>
              <span>/</span>
              <span>{penthouseCount} Penthouses</span>
            </div>
          </div>
          <Layers className="h-10 w-10 text-amber-500 shrink-0" />
        </div>

        {/* Inventory Value */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-[#0f172a]/60 backdrop-blur-md p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/35 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Inventory Valuation</p>
            <h2 className="text-3xl font-extrabold mt-2.5 text-slate-900 dark:text-white">
              ₹{(totalInventoryValue / 10000000).toFixed(1)} Cr
            </h2>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Market capitalization threshold
            </p>
          </div>
          <DollarSign className="h-10 w-10 text-amber-500 shrink-0" />
        </div>
      </div>

      {/* PROPERTIES INSIGHTS PANEL */}
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
              Dynamic Inventory Insights
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
              Average square-foot valuation across the estate portfolio stands at <span className="font-semibold text-amber-500">₹{Math.round(averagePricePerSqFt).toLocaleString('en-IN')}/sq.ft</span>. Currently, <span className="font-semibold text-emerald-500">{availableCount} luxury units</span> are available for immediate lease/purchase, yielding an average forecast rental yield of <span className="font-semibold text-blue-400">{(parsedProperties.reduce((acc, p) => acc + (p.metadata?.rentalYield || 0), 0) / (parsedProperties.filter(p => p.metadata?.rentalYield).length || 1)).toFixed(2)}%</span>.
            </p>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="bg-slate-900/10 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Commercial</span>
              <span className="text-lg font-bold text-amber-500">{commercialCount}</span>
            </div>
            <div className="bg-slate-900/10 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Sold Units</span>
              <span className="text-lg font-bold text-emerald-500">{soldCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* LUXURY METRIC CHARTS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart 1: Property Type Share */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/10 bg-white dark:bg-[#0f172a]/40 p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <h4 className="text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Property Type share
            </h4>
            <p className="text-xs text-slate-400 mt-1">Portfolio share distribution</p>
          </div>
          
          <div className="py-4 space-y-3">
            {/* Villas */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-450 font-semibold">VILLAS ({villasCount})</span>
                <span className="text-slate-400">{totalPropsCount > 0 ? Math.round((villasCount / totalPropsCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalPropsCount > 0 ? (villasCount / totalPropsCount) * 100 : 0}%` }} />
              </div>
            </div>
            {/* Apartments */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-450 font-semibold">APARTMENTS ({apartmentsCount})</span>
                <span className="text-slate-400">{totalPropsCount > 0 ? Math.round((apartmentsCount / totalPropsCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalPropsCount > 0 ? (apartmentsCount / totalPropsCount) * 100 : 0}%` }} />
              </div>
            </div>
            {/* Penthouses */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-450 font-semibold">PENTHOUSES ({penthouseCount})</span>
                <span className="text-slate-400">{totalPropsCount > 0 ? Math.round((penthouseCount / totalPropsCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalPropsCount > 0 ? (penthouseCount / totalPropsCount) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Inventory Value Distribution */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/10 bg-white dark:bg-[#0f172a]/40 p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <h4 className="text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range Distribution
            </h4>
            <p className="text-xs text-slate-400 mt-1">Property units count by budget tier</p>
          </div>
          
          <div className="py-4 grid grid-cols-4 items-end h-28 gap-3">
            {/* < 2 Cr */}
            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="bg-amber-500/30 border border-amber-500/40 w-full rounded-t-lg transition-all duration-550 hover:bg-amber-500" style={{ height: `${(properties.filter(p => p.price < 20000000).length / (totalPropsCount || 1)) * 100}%` }} />
              <span className="text-[9px] text-slate-400 tracking-tighter">&lt;2Cr</span>
            </div>
            {/* 2-5 Cr */}
            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="bg-amber-500/30 border border-amber-500/40 w-full rounded-t-lg transition-all duration-550 hover:bg-amber-500" style={{ height: `${(properties.filter(p => p.price >= 20000000 && p.price < 50000000).length / (totalPropsCount || 1)) * 100}%` }} />
              <span className="text-[9px] text-slate-400 tracking-tighter">2-5Cr</span>
            </div>
            {/* 5-10 Cr */}
            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="bg-amber-500/30 border border-amber-500/40 w-full rounded-t-lg transition-all duration-550 hover:bg-amber-500" style={{ height: `${(properties.filter(p => p.price >= 50000000 && p.price < 100000000).length / (totalPropsCount || 1)) * 100}%` }} />
              <span className="text-[9px] text-slate-400 tracking-tighter">5-10Cr</span>
            </div>
            {/* > 10 Cr */}
            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="bg-amber-500/30 border border-amber-500/40 w-full rounded-t-lg transition-all duration-550 hover:bg-amber-500" style={{ height: `${(properties.filter(p => p.price >= 100000000).length / (totalPropsCount || 1)) * 100}%` }} />
              <span className="text-[9px] text-slate-400 tracking-tighter">&gt;10Cr</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Availability Status */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/10 bg-white dark:bg-[#0f172a]/40 p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
          <div>
            <h4 className="text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Availability Trends
            </h4>
            <p className="text-xs text-slate-400 mt-1">Status share of the units</p>
          </div>
          
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Available Units ({availableCount})</span>
              <span className="font-bold text-emerald-500">{totalPropsCount > 0 ? Math.round((availableCount / totalPropsCount) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${totalPropsCount > 0 ? (availableCount / totalPropsCount) * 100 : 0}%` }} />
              <div className="bg-amber-500 h-full rounded-r-full" style={{ width: `${totalPropsCount > 0 ? (soldCount / totalPropsCount) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <span>Available ({availableCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                <span>Sold ({soldCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BULK ACTIONS HEADER PANEL */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500 text-black rounded-3xl p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl animate-bounce-short">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-6 w-6" />
            <div>
              <h4 className="font-bold text-lg">{selectedIds.length} Property Units Selected</h4>
              <p className="text-xs opacity-90 font-medium">Choose administrative action to execute across inventory</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Button
              onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'UPCOMING' })}
              className="bg-black text-white hover:bg-slate-900 rounded-xl"
            >
              Mark Available
            </Button>
            <Button
              onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'SOLD_OUT' })}
              className="bg-black text-white hover:bg-slate-900 rounded-xl"
            >
              Mark Sold Out
            </Button>
            <Button
              onClick={() => bulkFeaturedMutation.mutate({ ids: selectedIds, featured: true })}
              className="bg-black text-white hover:bg-slate-900 rounded-xl"
            >
              Feature Selection
            </Button>
            <Button
              onClick={() => bulkFeaturedMutation.mutate({ ids: selectedIds, featured: false })}
              className="bg-black text-white hover:bg-slate-900 rounded-xl"
            >
              Unfeature Selection
            </Button>

            <AlertDialog>
              <AlertDialogTrigger render={<Button className="bg-red-600 hover:bg-red-750 text-white rounded-xl" />}>
                Delete Selection
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-900 dark:text-white">Delete Selected Properties?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                    Are you sure you want to delete these {selectedIds.length} properties? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                    className="bg-red-500 hover:bg-red-650 text-white rounded-xl"
                  >
                    Delete Selected
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={() => setSelectedIds([])}
              variant="ghost"
              className="hover:bg-black/10 rounded-xl border border-black text-black font-semibold"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

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
              setSelectedType('ALL');
              setSelectedStatus('ALL');
              setSelectedProjectFilter('ALL');
              setSortBy('PRICE_ASC');
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
              placeholder="Search property code, title, city, address..."
              className="w-full h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 outline-none text-sm text-slate-800 dark:text-white focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Project Dropdown */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => {
              setSelectedProjectFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 outline-none text-sm text-slate-700 dark:text-white cursor-pointer focus:border-amber-500"
          >
            <option value="ALL">All Associated Projects</option>
            {projects.map((proj: { id: number; title: string }) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </select>

          {/* Type Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 outline-none text-sm text-slate-700 dark:text-white cursor-pointer focus:border-amber-500"
          >
            <option value="ALL">All Types</option>
            <option value="APARTMENT">Apartment</option>
            <option value="VILLA">Villa</option>
            <option value="PLOT">Plot</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="PENTHOUSE">Penthouse</option>
            <option value="DUPLEX">Duplex</option>
            <option value="STUDIO">Studio</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 outline-none text-sm text-slate-700 dark:text-white cursor-pointer focus:border-amber-500"
          >
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="AREA_DESC">Area: Large to Small</option>
            <option value="BEDROOMS_DESC">Bedrooms: High to Low</option>
          </select>
        </div>
      </div>

      {/* PROPERTIES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedProperties.map((property) => {
          const isSelected = selectedIds.includes(property.id);
          return (
            <div
              key={property.id}
              className={`rounded-[32px] overflow-hidden bg-white dark:bg-[#0f172a]/60 border transition-all duration-500 shadow-sm flex flex-col justify-between group ${
                isSelected ? 'border-amber-500' : 'border-slate-200 dark:border-white/5 hover:border-amber-500/40'
              }`}
            >
              <div>
                {/* Visual Image Banner */}
                <div className="h-56 overflow-hidden relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  {property.thumbnailUrl ? (
                    <img
                      src={property.thumbnailUrl}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />
                  ) : (
                    <div className="text-slate-400 dark:text-slate-650 flex flex-col items-center gap-2">
                      <Building2 className="h-14 w-14 opacity-30" />
                      <span className="text-[10px] tracking-wider uppercase font-bold opacity-60">Asset Placeholder</span>
                    </div>
                  )}

                  {/* Bulk selection toggle top-left */}
                  <button
                    onClick={() => toggleSelect(property.id)}
                    className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-amber-500 border border-white/10 hover:bg-black transition-colors"
                  >
                    {isSelected ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5 text-slate-400" />}
                  </button>

                  {/* Status absolute badge */}
                  <span
                    className={`absolute top-4 right-4 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md ${
                      property.status === 'UPCOMING'
                        ? 'bg-emerald-500 text-black'
                        : property.status === 'SOLD_OUT'
                        ? 'bg-red-500 text-white'
                        : property.status === 'ONGOING'
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {property.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Info specifications */}
                <div className="p-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-450 font-mono">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{property.city || 'Location'}</span>
                    </span>
                    {property.metadata?.propertyCode && (
                      <span className="uppercase text-amber-600 dark:text-amber-400">{property.metadata.propertyCode}</span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight group-hover:text-amber-500 transition-colors line-clamp-1">
                    {property.title}
                  </h3>

                  {property.linkedProject && (
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      Project: <span className="text-slate-700 dark:text-slate-350">{property.linkedProject.title}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/40 pt-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Unit Price</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        ₹{property.price ? Number(property.price).toLocaleString('en-IN') : 'N/A'} {property.priceLabel}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Dimensions</span>
                      <span className="font-bold text-slate-900 dark:text-white">{property.area || 'N/A'} {property.areaUnit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div>
                      <span className="block text-slate-400 uppercase font-semibold">Beds</span>
                      <span className="font-bold">{property.bedrooms || 0}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase font-semibold">Baths</span>
                      <span className="font-bold">{property.bathrooms || 0}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase font-semibold">Floors</span>
                      <span className="font-bold">{property.floor || 0}/{property.totalFloors || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="p-6 pt-2">
                <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                  {/* View Details drawer */}
                  <Button
                    onClick={() => setDrawerProperty(property)}
                    variant="outline"
                    className="flex-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Inspect Unit
                  </Button>

                  <Link href={`/dashboard/properties/${property.id}/edit`}>
                    <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-2 h-10 w-10 flex items-center justify-center shrink-0">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>

                  <button
                    onClick={() => toggleFeaturedMutation.mutate(property)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
                      property.featured
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
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Delete Property Unit?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                          This action is irreversible. It will permanently remove this unit listing from the inventory database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(property.id)}
                          className="bg-red-500 hover:bg-red-650 text-white rounded-xl"
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
      {filteredProperties.length === 0 && (
        <div className="text-center py-24 text-slate-400 dark:text-slate-500">
          <Layers className="h-16 w-16 mx-auto mb-4 opacity-30 animate-pulse" />
          <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-1">No Properties Found</h4>
          <p className="text-sm opacity-80">Adjust search parameters or select different project filter criteria.</p>
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
      {drawerProperty && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0b0e14] h-full shadow-2xl overflow-y-auto p-8 relative border-l border-slate-200 dark:border-amber-500/10 flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-amber-500" />
                  <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Property Details Drawer</span>
                </div>
                <button
                  onClick={() => setDrawerProperty(null)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="py-6 space-y-8">
                {/* Image Banner */}
                {drawerProperty.thumbnailUrl && (
                  <div className="h-64 rounded-2xl overflow-hidden shadow-inner border border-slate-100 dark:border-slate-850">
                    <img src={drawerProperty.thumbnailUrl} alt={drawerProperty.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Title and location */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{drawerProperty.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span>{drawerProperty.address ? `${drawerProperty.address}, ` : ''}{drawerProperty.city || 'N/A'}</span>
                  </div>
                </div>

                {/* Specs card list */}
                <div className="grid grid-cols-2 gap-6 text-sm bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Unit Price</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      ₹{drawerProperty.price ? Number(drawerProperty.price).toLocaleString('en-IN') : 'N/A'} {drawerProperty.priceLabel}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Property Code</span>
                    <span className="font-semibold text-slate-900 dark:text-white uppercase">{drawerProperty.metadata?.propertyCode || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Associated Project</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{drawerProperty.linkedProject?.title || 'N/A'}</span>
                  </div>
                  <div className="space-y-1 flex flex-col justify-start">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Project RERA Reg</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[200px]" title={drawerLinkedProjectRera || 'N/A'}>{drawerLinkedProjectRera || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Furnishing Status</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{drawerProperty.metadata?.furnishingStatus?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Facing / Parking Slots</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{drawerProperty.metadata?.facingDirection || 'N/A'} / {drawerProperty.parkingSpaces || 0} Slots</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Rental Yield / Age</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {drawerProperty.metadata?.rentalYield ? `${drawerProperty.metadata.rentalYield}%` : 'N/A'} / {drawerProperty.metadata?.propertyAge || 0} Years
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Built-up Area / Dimensions</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{drawerProperty.area || 'N/A'} {drawerProperty.areaUnit || 'sq ft'}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-6">
                  <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Property Description</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-light font-sans">
                    {drawerProperty.cleanDescription || 'No description provided.'}
                  </p>
                </div>

                {/* Virtual Tour and Floor plan urls */}
                {(drawerProperty.metadata?.virtualTourUrl || drawerProperty.metadata?.floorPlanUrl || drawerProperty.videoUrl) && (
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-6">
                    <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Media assets</h4>
                    <div className="flex flex-wrap gap-4">
                      {drawerProperty.metadata?.virtualTourUrl && (
                        <a href={drawerProperty.metadata.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[150px]">
                          <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-xs rounded-xl flex items-center justify-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Virtual Tour Link
                          </Button>
                        </a>
                      )}
                      {drawerProperty.videoUrl && (
                        <a href={drawerProperty.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[150px]">
                          <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-xs rounded-xl flex items-center justify-center gap-2">
                            <Video className="h-4 w-4 text-amber-500" />
                            Video Tour Link
                          </Button>
                        </a>
                      )}
                      {drawerProperty.metadata?.floorPlanUrl && (
                        <a href={drawerProperty.metadata.floorPlanUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[150px]">
                          <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-xs rounded-xl flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4 text-amber-500" />
                            Floor Plan Image
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Gallery */}
                {(drawerProperty.imageUrls?.length ?? 0) > 0 && (
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-6">
                    <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Image Gallery</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {drawerProperty.imageUrls?.map((url: string, index: number) => (
                        <div key={index} className="h-20 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900">
                          <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Drawer Footer */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-6 flex gap-4 bg-transparent">
              <Link href={`/dashboard/properties/${drawerProperty.id}/edit`} className="flex-1">
                <Button className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl h-11 flex items-center justify-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-800 dark:text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <PropertiesDashboardContent />
    </Suspense>
  );
}