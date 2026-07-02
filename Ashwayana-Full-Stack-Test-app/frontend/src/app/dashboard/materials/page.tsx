'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Tags,
  Activity,
  Award,
  Loader2,
  Layers,
  AlertTriangle,
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

interface Material {
  id: number;
  name: string;
  category?: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
}

export default function MaterialsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await api.get('/materials?size=100');
      return (res.data?.data?.content || res.data?.data || []) as Material[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['materials'],
      });
    },
  });

  // Unique lists for filters
  const categories = Array.from(
    new Set(data.map((m) => m.category).filter(Boolean))
  ) as string[];

  const brands = Array.from(
    new Set(data.map((m) => m.brand).filter(Boolean))
  ) as string[];

  // Filter materials
  const filteredMaterials = data.filter((material) => {
    const matchesSearch =
      material.name?.toLowerCase().includes(search.toLowerCase()) ||
      material.description?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !selectedCategory || material.category === selectedCategory;
    const matchesBrand = !selectedBrand || material.brand === selectedBrand;

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && material.active === true) ||
      (selectedStatus === 'INACTIVE' && material.active === false);

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  // KPI Calculations
  const totalMaterials = data.length;
  const uniqueCategoriesCount = categories.length;
  const activeCount = data.filter((m) => m.active).length;
  const uniqueBrandsCount = brands.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-800 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading materials specs...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-800 dark:text-white p-8">
        <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Failed to load materials</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error instanceof Error ? error.message : 'An unexpected error occurred while communicating with backend APIs.'}
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['materials'] })} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white p-8 transition-colors duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white">
            Materials Library
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage high-end materials, specs, finishes, and suppliers
          </p>
        </div>

        <Link href="/dashboard/materials/new">
          <Button className="bg-amber-500 text-black hover:bg-amber-400 font-semibold rounded-xl px-5 h-12 shadow-lg shadow-amber-500/10 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Material
          </Button>
        </Link>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Total Materials */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/20 bg-white dark:bg-[#0f172a] p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/40 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Total Materials</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {totalMaterials}
            </h2>
          </div>
          <Package className="h-10 w-10 text-amber-500" />
        </div>

        {/* Categories */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/20 bg-white dark:bg-[#0f172a] p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/40 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Categories</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {uniqueCategoriesCount}
            </h2>
          </div>
          <Tags className="h-10 w-10 text-amber-500" />
        </div>

        {/* Active Materials */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/20 bg-white dark:bg-[#0f172a] p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/40 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Active (Visible)</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {activeCount}
            </h2>
          </div>
          <Activity className="h-10 w-10 text-amber-500" />
        </div>

        {/* Brands */}
        <div className="rounded-3xl border border-slate-200 dark:border-amber-500/20 bg-white dark:bg-[#0f172a] p-6 hover:-translate-y-1 hover:border-slate-350 dark:hover:border-amber-500/40 transition-all duration-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Unique Brands</p>
            <h2 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              {uniqueBrandsCount}
            </h2>
          </div>
          <Award className="h-10 w-10 text-amber-500" />
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        {/* Search */}
        <div className="lg:col-span-1 relative">
          <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, specifications..."
            className="w-full h-12 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-amber-500/20 text-slate-800 dark:text-white pl-12 pr-4 outline-none shadow-sm focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-amber-500/20 text-slate-800 dark:text-white rounded-2xl px-4 outline-none shadow-sm focus:border-amber-500 transition-colors cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-amber-500/20 text-slate-800 dark:text-white rounded-2xl px-4 outline-none shadow-sm focus:border-amber-500 transition-colors cursor-pointer"
        >
          <option value="">All Brands / Sources</option>
          {brands.map((brnd) => (
            <option key={brnd} value={brnd}>
              {brnd}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-amber-500/20 text-slate-800 dark:text-white rounded-2xl px-4 outline-none shadow-sm focus:border-amber-500 transition-colors cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      {/* CARDS GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMaterials.map((material) => (
          <div
            key={material.id}
            className="rounded-3xl overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-amber-500/20 hover:border-amber-500 transition-all duration-300 shadow-sm flex flex-col justify-between"
          >
            <div>
              {/* Material Texture Image */}
              <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
                {material.imageUrl ? (
                  <img
                    src={material.imageUrl}
                    alt={material.name}
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
                    <Layers className="h-12 w-12 opacity-35 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Luxury Texture Placeholder</span>
                  </div>
                )}
                {/* Active/Inactive badge absolute */}
                <span
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md ${
                    material.active
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  {material.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Specs Info */}
              <div className="p-6 pb-2 space-y-3">
                <div className="flex items-center gap-3">
                  {material.category && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      {material.category}
                    </span>
                  )}
                  {material.brand && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-500/5 border border-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {material.brand}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1">
                  {material.name}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 min-h-[48px] font-light leading-relaxed">
                  {material.description || 'No detailed technical specifications provided for this custom material texture.'}
                </p>
              </div>
            </div>

            {/* Actions Card Footer */}
            <div className="p-6 pt-2">
              <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                <Link href={`/dashboard/materials/${material.id}/edit`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="destructive" className="rounded-xl shrink-0" />}>
                    <Trash2 className="h-4 w-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-900 dark:text-white">Delete Material?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                        This action is irreversible. It will permanently remove this material specification from the repository database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(material.id)}
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
        ))}
      </div>

      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          <Layers className="h-16 w-16 mx-auto mb-4 opacity-30 animate-pulse" />
          <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No Materials Found</h4>
          <p className="text-sm opacity-85">Try adjusting your filters or search terms, or add a new material.</p>
        </div>
      )}
    </div>
  );
}
