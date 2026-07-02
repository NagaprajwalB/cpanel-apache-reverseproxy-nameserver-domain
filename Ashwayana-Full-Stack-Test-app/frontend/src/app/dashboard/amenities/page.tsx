'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Search, 
  Layers, 
  Activity, 
  Clock, 
  Sparkles, 
  Image as ImageIcon,
  Compass, 
  Eye, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import * as z from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { IconPicker } from '@/components/ui/icon-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { parseAmenityDescription, serializeAmenityDescription } from '@/lib/metadata';

interface Amenity {
  id: number;
  name: string;
  icon: string;
  description: string;
  active: boolean;
}

interface ParsedAmenity extends Amenity {
  cleanDescription: string;
  category: string;
  imageUrl: string;
  isFeatured: boolean;
}

const AMENITY_CATEGORIES = ['All', 'Wellness & Spa', 'Sports & Fitness', 'Leisure & Social', 'Services & Convenience', 'Security & Smart Home', 'Other'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().optional(),
  descriptionText: z.string().optional(),
  active: z.boolean().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

function AmenityDialog({ defaultValues, amenityId, onClose }: {
  defaultValues?: Partial<FormValues>; amenityId?: number; onClose: () => void
}) {
  const queryClient = useQueryClient();
  const [icon, setIcon] = useState(defaultValues?.icon || 'HelpCircle');
  const [imageUrl, setImageUrl] = useState(defaultValues?.imageUrl || '');
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      active: true,
      category: 'Wellness & Spa',
      isFeatured: false,
      ...defaultValues
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const serializedDescription = serializeAmenityDescription(data.descriptionText || '', {
        category: data.category,
        imageUrl: imageUrl,
        isFeatured: data.isFeatured,
      });

      const payload = {
        name: data.name,
        icon: icon,
        description: serializedDescription,
        active: data.active ?? true,
      };

      return amenityId 
        ? api.put(`/amenities/${amenityId}`, payload) 
        : api.post('/amenities', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      onClose();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Name *</Label>
          <Input 
            {...register('name')} 
            className="w-full bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-2 px-3 focus-visible:border-amber-500 dark:focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/30"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Category</Label>
          <select 
            {...register('category')}
            className="w-full bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-2 px-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none text-sm bg-white dark:bg-slate-900"
          >
            {AMENITY_CATEGORIES.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 flex flex-col justify-end">
          <Label className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">Icon</Label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Description</Label>
        <textarea 
          {...register('descriptionText')} 
          rows={3} 
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050816]/60 text-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none"
        />
      </div>

      <div className="flex items-center gap-6 py-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('active')} className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 text-amber-505 focus:ring-amber-500/30" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('isFeatured')} className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 text-amber-505 focus:ring-amber-500/30" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured Amenity</span>
        </label>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Amenity Image</Label>
        <FileUpload value={imageUrl} onUpload={setImageUrl} />
      </div>

      <Button type="submit" className="w-full py-5 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/10 font-bold" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : amenityId ? 'Update Amenity' : 'Create Amenity'}
      </Button>
    </form>
  );
}

export default function AmenitiesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParsedAmenity | null>(null);
  const [previewing, setPreviewing] = useState<ParsedAmenity | null>(null);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Fetch Amenities
  const { data: rawAmenities = [], isLoading } = useQuery<Amenity[]>({
    queryKey: ['amenities'],
    queryFn: async () => {
      const res = await api.get('/amenities?size=100');
      return res.data?.data?.content || res.data?.data || [];
    },
  });

  // Fetch Properties & Projects for calculating "Most Used"
  useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await api.get('/properties?size=100');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?size=100');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  // Parse all amenities
  const parsedAmenities = useMemo(() => {
    return rawAmenities.map(item => {
      const { description, metadata } = parseAmenityDescription(item.description || '');
      return {
        ...item,
        cleanDescription: description,
        category: metadata.category || 'Other',
        imageUrl: metadata.imageUrl || '',
        isFeatured: metadata.isFeatured || false,
      } as ParsedAmenity;
    });
  }, [rawAmenities]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/amenities/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      if (previewing?.id === deletedId) setPreviewing(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (amenity: ParsedAmenity) => {
      const payload = {
        name: amenity.name,
        icon: amenity.icon,
        description: serializeAmenityDescription(amenity.cleanDescription, {
          category: amenity.category,
          imageUrl: amenity.imageUrl,
          isFeatured: amenity.isFeatured
        }),
        active: !amenity.active
      };
      return api.put(`/amenities/${amenity.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    }
  });

  // Filtered amenities
  const filteredAmenities = useMemo(() => {
    return parsedAmenities.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                            item.cleanDescription.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || 
                            (selectedStatus === 'Active' && item.active) || 
                            (selectedStatus === 'Inactive' && !item.active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [parsedAmenities, search, selectedCategory, selectedStatus]);

  // Usage stats (how many projects or properties use the amenity)
  const usageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    parsedAmenities.forEach(a => {
      stats[a.name.toLowerCase()] = 0;
    });

    // Check projects
    projects.forEach((proj: { description?: string }) => {
      const desc = proj.description || '';
      const parts = desc.split('---METADATA---');
      if (parts[1]) {
        try {
          const meta = JSON.parse(parts[1].trim());
          if (Array.isArray(meta.amenities)) {
            meta.amenities.forEach((amenityName: string) => {
              const nameLower = amenityName.trim().toLowerCase();
              if (nameLower in stats) {
                stats[nameLower]++;
              }
            });
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}
      }
    });

    return stats;
  }, [parsedAmenities, projects]);

  // KPI Calculations
  const totalCount = parsedAmenities.length;
  const activeCount = parsedAmenities.filter(a => a.active).length;
  
  const mostUsedAmenityName = useMemo(() => {
    let bestName = 'None';
    let maxVal = 0;
    Object.entries(usageStats).forEach(([name, count]) => {
      if (count > maxVal) {
        maxVal = count;
        // Find proper casing
        const properObj = parsedAmenities.find(a => a.name.toLowerCase() === name);
        if (properObj) bestName = properObj.name;
      }
    });
    return maxVal > 0 ? `${bestName} (${maxVal} Projects)` : 'Not associated yet';
  }, [usageStats, parsedAmenities]);

  const recentlyAddedName = useMemo(() => {
    if (parsedAmenities.length === 0) return 'None';
    const sorted = [...parsedAmenities].sort((a, b) => b.id - a.id);
    return sorted[0]?.name || 'None';
  }, [parsedAmenities]);

  // Render Lucide Icon dynamically
  const renderAmenityIcon = (iconName: string, className: string = "h-5 w-5 text-amber-500") => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = iconName && icons[iconName] ? icons[iconName] : LucideIcons.HelpCircle;
    return <Icon className={className} />;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Amenities Inventory
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage premium comfort offerings and estate experiences.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger render={<Button onClick={() => setEditing(null)} className="h-11 bg-slate-900 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 rounded-xl px-5 font-bold shadow-lg shadow-amber-500/5 transition-all duration-300" />}>
            <Plus className="mr-2 h-5 w-5" />Add Amenity
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold dark:text-white">
                {editing ? 'Edit Amenity Details' : 'Register New Amenity'}
              </DialogTitle>
            </DialogHeader>
            <AmenityDialog 
              defaultValues={editing ? {
                name: editing.name,
                icon: editing.icon,
                descriptionText: editing.cleanDescription,
                active: editing.active,
                category: editing.category,
                imageUrl: editing.imageUrl,
                isFeatured: editing.isFeatured
              } : undefined} 
              amenityId={editing?.id} 
              onClose={() => { setOpen(false); setEditing(null); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Amenities</span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalCount}</h3>
          <p className="text-xs text-slate-400 mt-1">Available in layout templates</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Offerings</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{activeCount}</h3>
          <p className="text-xs text-slate-450 mt-1">{Math.round((activeCount / Math.max(totalCount, 1)) * 100)}% active status rate</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Most Associated</span>
            <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Compass className="h-4 w-4 text-violet-500" />
            </div>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 truncate" title={mostUsedAmenityName}>
            {mostUsedAmenityName}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Highest frequency in projects</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recently Added</span>
            <div className="h-7 w-7 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-pink-500" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 truncate" title={recentlyAddedName}>
            {recentlyAddedName}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Latest registration entry</p>
        </div>
      </div>

      {/* Filters Control Bar */}
      <div className="bg-slate-50 dark:bg-[#0f172a]/40 border border-slate-150 dark:border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tags, description..."
            className="pl-10 h-10 w-full bg-white dark:bg-[#050816]/60 border-slate-200 dark:border-slate-800 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase">Filters</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 bg-white dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white rounded-xl px-3 outline-none text-xs"
          >
            {AMENITY_CATEGORIES.map(c => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 bg-white dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white rounded-xl px-3 outline-none text-xs"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-60 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200/50 dark:border-slate-800/50" />
          ))}
        </div>
      ) : filteredAmenities.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0f172a]/20 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="h-7 w-7 text-slate-400 dark:text-slate-650" />
          </div>
          <h3 className="text-xl font-bold text-slate-850 dark:text-white">No Amenities Found</h3>
          <p className="text-slate-450 dark:text-slate-400 mt-2 max-w-sm">
            Try adjusting your search criteria or register a new offering to display it in the inventory.
          </p>
          <Button onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedStatus('All'); }} variant="outline" className="mt-4 rounded-xl">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAmenities.map((amenity) => {
            const usageCount = usageStats[amenity.name.toLowerCase()] || 0;
            return (
              <div 
                key={amenity.id}
                className="group relative bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image / Header Block */}
                <div className="relative h-44 bg-slate-105 dark:bg-[#050816] flex items-center justify-center overflow-hidden">
                  {amenity.imageUrl ? (
                    <img 
                      src={amenity.imageUrl} 
                      alt={amenity.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-none rounded-lg text-xs font-semibold px-2 py-0.5">
                      {amenity.category}
                    </Badge>
                    {amenity.isFeatured && (
                      <Badge className="bg-amber-500 text-slate-950 font-bold border-none rounded-lg text-xs px-2 py-0.5 flex items-center gap-1 shadow-md shadow-amber-500/20 animate-pulse">
                        <Sparkles className="h-3 w-3 fill-slate-950" /> Featured
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-4 right-4">
                    <Badge className={`border-none rounded-lg text-xs font-bold px-2 py-0.5 ${amenity.active ? 'bg-emerald-500/20 text-emerald-400 backdrop-blur-md' : 'bg-rose-500/20 text-rose-400 backdrop-blur-md'}`}>
                      {amenity.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Floating Icon Circle */}
                  <div className="absolute bottom-4 left-4 h-11 w-11 rounded-2xl bg-white dark:bg-[#0f172a] shadow-lg border border-slate-100 dark:border-white/5 flex items-center justify-center">
                    {renderAmenityIcon(amenity.icon, "h-5 w-5 text-amber-500")}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                        {amenity.name}
                      </h4>
                      <span className="text-xs text-slate-400 mt-1 font-medium">{usageCount} project link{usageCount !== 1 ? 's' : ''}</span>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {amenity.cleanDescription || 'No description provided.'}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4">
                    <button 
                      onClick={() => toggleActiveMutation.mutate(amenity)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${amenity.active ? 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 hover:bg-slate-100' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25'}`}
                    >
                      {amenity.active ? 'Deactivate' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setPreviewing(amenity)}
                        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Quick View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setEditing(amenity); setOpen(true); }}
                        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg text-slate-400" title="Delete" />}>
                          <Trash2 className="h-4 w-4" />
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold dark:text-white">Delete Amenity?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                              This will permanently remove <strong>{amenity.name}</strong> from the database. This action is irreversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="rounded-xl border border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(amenity.id)} 
                              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/10"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rich Preview Drawer Dialog */}
      <Dialog open={!!previewing} onOpenChange={(v) => { if (!v) setPreviewing(null); }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-0 overflow-hidden shadow-2xl">
          {previewing && (
            <div className="flex flex-col">
              {/* Cover Header */}
              <div className="relative h-64 bg-slate-100 dark:bg-[#050816] flex items-center justify-center">
                {previewing.imageUrl ? (
                  <img src={previewing.imageUrl} alt={previewing.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/35 to-transparent" />
                
                <div className="absolute bottom-6 left-6 flex items-end gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white dark:bg-[#0f172a] shadow-xl border border-slate-100 dark:border-white/5 flex items-center justify-center">
                    {renderAmenityIcon(previewing.icon, "h-7 w-7 text-amber-500")}
                  </div>
                  <div className="text-white space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black tracking-tight">{previewing.name}</h3>
                      <Badge className="bg-amber-500 text-slate-950 font-bold rounded-lg border-none text-[10px] px-2 py-0.5">
                        {previewing.category}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-xs">Registered Amenity Offering</p>
                  </div>
                </div>

                <button 
                  onClick={() => setPreviewing(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {previewing.cleanDescription || 'No detailed description available.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/40 pt-5">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">System ID</span>
                    <p className="text-sm font-bold dark:text-white">#{previewing.id}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Availability Status</span>
                    <p className="text-sm font-bold flex items-center gap-1.5 dark:text-white">
                      <span className={`h-2.5 w-2.5 rounded-full ${previewing.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {previewing.active ? 'Active & Selectable' : 'Inactive / Suspended'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Linked Projects</span>
                    <p className="text-sm font-bold dark:text-white">
                      {usageStats[previewing.name.toLowerCase()] || 0} Projects associated
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Premium Showcase</span>
                    <p className="text-sm font-bold dark:text-white">
                      {previewing.isFeatured ? 'Yes (Highlighting)' : 'No (Standard listing)'}
                    </p>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                  <Button 
                    variant="outline" 
                    onClick={() => { setEditing(previewing); setOpen(true); setPreviewing(null); }}
                    className="rounded-xl font-bold h-11 border-slate-200 dark:border-slate-800"
                  >
                    Edit Details
                  </Button>
                  <Button 
                    onClick={() => setPreviewing(null)}
                    className="rounded-xl font-bold h-11 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 px-6"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
