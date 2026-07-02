'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  MessageSquare, 
  Quote, 
  Calendar, 
  Sparkles,
  Building,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert
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
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { parseTestimonialContent, serializeTestimonialContent } from '@/lib/metadata';

interface Testimonial {
  id: number;
  authorName: string;
  authorDesignation: string;
  content: string;
  rating: number;
  propertyName: string;
  active: boolean;
  authorImage: string;
}

interface ParsedTestimonial extends Testimonial {
  cleanContent: string;
  purchaseYear: string;
  isFeatured: boolean;
}

const schema = z.object({
  authorName: z.string().min(1, 'Author name is required'),
  authorDesignation: z.string().optional(),
  descriptionText: z.string().min(1, 'Review content is required'),
  rating: z.coerce.number().min(1).max(5),
  propertyName: z.string().optional(),
  active: z.boolean().optional(),
  
  // Premium metadata fields
  purchaseYear: z.string().optional(),
  isFeatured: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

function TestimonialDialog({ defaultValues, testimonialId, onClose }: {
  defaultValues?: Partial<FormValues> & { authorImage?: string }; testimonialId?: number; onClose: () => void
}) {
  const queryClient = useQueryClient();
  const [authorImage, setAuthorImage] = useState(defaultValues?.authorImage || '');

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      rating: 5,
      active: true,
      isFeatured: false,
      purchaseYear: new Date().getFullYear().toString(),
      ...defaultValues,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const serializedContent = serializeTestimonialContent(data.descriptionText, {
        purchaseYear: data.purchaseYear,
        isFeatured: data.isFeatured,
      });

      const payload = {
        authorName: data.authorName,
        authorDesignation: data.authorDesignation || '',
        propertyName: data.propertyName || '',
        rating: data.rating,
        content: serializedContent,
        active: data.active ?? true,
        authorImage: authorImage,
      };

      return testimonialId 
        ? api.put(`/testimonials/${testimonialId}`, payload) 
        : api.post('/testimonials', payload);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['testimonials'] }); 
      onClose(); 
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-1">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Name *</Label>
          <Input {...register('authorName')} placeholder="e.g. Vikram & Meera Oberoi" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
          {errors.authorName && <p className="text-xs text-rose-500 font-medium">{errors.authorName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designation / Role</Label>
          <Input {...register('authorDesignation')} className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" placeholder="e.g. Tech Investor, CEO" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Purchased</Label>
          <Input {...register('propertyName')} className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" placeholder="e.g. Villa Azure, Oceanique 405" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Year</Label>
          <Input {...register('purchaseYear')} className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
        </div>

        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating (1 to 5 Stars)</Label>
          <select 
            {...register('rating')} 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none text-sm font-medium cursor-pointer"
          >
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
            <option value="2">★★☆☆☆ (2 Stars)</option>
            <option value="1">★☆☆☆☆ (1 Star)</option>
          </select>
          {errors.rating && <p className="text-xs text-rose-500 font-medium">{errors.rating.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Luxury Statement / Review *</Label>
        <textarea 
          {...register('descriptionText')} 
          placeholder="Enter premium endorsement or luxury review text details here..."
          rows={3} 
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none transition-all" 
        />
        {errors.descriptionText && <p className="text-xs text-rose-500 font-medium">{errors.descriptionText.message}</p>}
      </div>

      <div className="flex flex-wrap gap-5 py-2.5 border-y border-slate-100 dark:border-slate-900">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" {...register('active')} className="w-4.5 h-4.5 rounded border-slate-350 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Listing</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" {...register('isFeatured')} className="w-4.5 h-4.5 rounded border-slate-350 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Featured (Lux Showcase)</span>
        </label>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Profile Photo</Label>
        <FileUpload value={authorImage} onUpload={setAuthorImage} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 py-5 rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-sm">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-650 hover:to-amber-700 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/10 text-sm" disabled={mutation.isPending}>
          {mutation.isPending ? 'Publishing...' : testimonialId ? 'Update Endorsement' : 'Publish Endorsement'}
        </Button>
      </div>
    </form>
  );
}

export default function TestimonialsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParsedTestimonial | null>(null);
  
  // Carousel active state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Search/Filters
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [featuredFilter, setFeaturedFilter] = useState('All');

  // Fetch Testimonials
  const { data: rawTestimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const res = await api.get('/testimonials?size=100');
      return res.data?.data?.content || res.data?.data || [];
    },
  });

  // Parse metadata
  const parsedTestimonials = useMemo(() => {
    return rawTestimonials.map(item => {
      const { content, metadata } = parseTestimonialContent(item.content || '');
      return {
        ...item,
        cleanContent: content,
        purchaseYear: metadata.purchaseYear || '2025',
        isFeatured: metadata.isFeatured || false,
      } as ParsedTestimonial;
    });
  }, [rawTestimonials]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      // Reset carousel index if index becomes invalid
      setCarouselIndex(0);
    },
  });



  // Filtered list
  const filteredTestimonials = useMemo(() => {
    return parsedTestimonials.filter(item => {
      const matchesSearch = (item.authorName || '').toLowerCase().includes(search.toLowerCase()) || 
                            (item.propertyName || '').toLowerCase().includes(search.toLowerCase()) || 
                            (item.cleanContent || '').toLowerCase().includes(search.toLowerCase());
      
      const matchesRating = ratingFilter === 'All' || item.rating === Number(ratingFilter);
      
      const matchesFeatured = featuredFilter === 'All' || 
                              (featuredFilter === 'Featured' && item.isFeatured) || 
                              (featuredFilter === 'Standard' && !item.isFeatured);

      return matchesSearch && matchesRating && matchesFeatured;
    });
  }, [parsedTestimonials, search, ratingFilter, featuredFilter]);

  // Featured Testimonials for Luxury Showcase Carousel
  const featuredShowcase = useMemo(() => {
    return parsedTestimonials.filter(t => t.active && t.isFeatured);
  }, [parsedTestimonials]);

  const activeFeatured = useMemo(() => {
    if (featuredShowcase.length === 0) return null;
    return featuredShowcase[carouselIndex] || featuredShowcase[0] || null;
  }, [featuredShowcase, carouselIndex]);

  const nextSlide = () => {
    if (featuredShowcase.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % featuredShowcase.length);
  };

  const prevSlide = () => {
    if (featuredShowcase.length === 0) return;
    setCarouselIndex((prev) => (prev - 1 + featuredShowcase.length) % featuredShowcase.length);
  };

  // KPIs
  const totalCount = parsedTestimonials.length;
  const featuredCount = parsedTestimonials.filter(t => t.isFeatured).length;
  const avgRating = useMemo(() => {
    if (parsedTestimonials.length === 0) return 0;
    const sum = parsedTestimonials.reduce((acc, t) => acc + t.rating, 0);
    return Number((sum / parsedTestimonials.length).toFixed(1));
  }, [parsedTestimonials]);

  // Rating Distribution breakdown
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    parsedTestimonials.forEach(t => {
      if (t.rating >= 1 && t.rating <= 5) {
        dist[5 - t.rating]++;
      }
    });
    return dist;
  }, [parsedTestimonials]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Brand Testimonials & Endorsements
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Display luxury property endorsements, high-profile purchaser feedback, and ratings.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger render={<Button onClick={() => setEditing(null)} className="h-11 bg-slate-900 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 rounded-xl px-5 font-bold shadow-lg shadow-amber-500/5 transition-all duration-300" />}>
            <Plus className="mr-2 h-5 w-5" />Add Testimonial
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold dark:text-white">
                {editing ? 'Edit Testimonial Details' : 'Publish New Endorsement'}
              </DialogTitle>
            </DialogHeader>
            <TestimonialDialog 
              defaultValues={editing ? {
                authorName: editing.authorName,
                authorDesignation: editing.authorDesignation,
                descriptionText: editing.cleanContent,
                rating: editing.rating,
                propertyName: editing.propertyName,
                active: editing.active,
                purchaseYear: editing.purchaseYear,
                isFeatured: editing.isFeatured,
                authorImage: editing.authorImage
              } : undefined}
              testimonialId={editing?.id}
              onClose={() => { setOpen(false); setEditing(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Luxury Showcase Carousel */}
      {featuredShowcase.length > 0 && (
        <div className="relative bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-3xl p-6 md:p-8 overflow-hidden shadow-md">
          {/* Decorative quote icon */}
          <Quote className="absolute right-8 bottom-6 h-40 w-40 text-amber-500/5 select-none pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4.5 w-4.5 text-amber-550 dark:text-amber-400 animate-spin" />
            <span className="text-xs font-black tracking-widest text-amber-600 dark:text-amber-400 uppercase">Featured Endorsements</span>
          </div>

          <div key={carouselIndex} className="min-h-36 flex flex-col md:flex-row gap-6 items-center animate-[fadeIn_0.4s_ease-out]">
            {/* Customer Photo */}
            <div className="h-24 w-24 rounded-full border-2 border-amber-500/30 overflow-hidden bg-slate-900/10 dark:bg-slate-800 flex-shrink-0 shadow">
              {activeFeatured?.authorImage ? (
                <img src={activeFeatured.authorImage} alt={activeFeatured.authorName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-3xl font-bold text-amber-500">
                  {activeFeatured?.authorName?.[0]}
                </div>
              )}
            </div>

            {/* Review text */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex justify-center md:justify-start items-center gap-0.5 text-amber-550">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4.5 w-4.5 ${i < (activeFeatured?.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-slate-200 dark:text-slate-850'}`} 
                  />
                ))}
              </div>
              <p className="text-lg md:text-xl font-serif italic text-slate-800 dark:text-slate-250 leading-relaxed max-w-4xl">
                &ldquo;{activeFeatured?.cleanContent}&rdquo;
              </p>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-base">
                  {activeFeatured?.authorName}
                </h5>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                  <span>{activeFeatured?.authorDesignation || 'Brand Ambassador'}</span>
                  <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-450 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                    <Building className="h-3 w-3" /> Property: {activeFeatured?.propertyName || 'Premium Residence'} ({activeFeatured?.purchaseYear})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          {featuredShowcase.length > 1 && (
            <div className="absolute top-6 right-6 flex gap-1.5 z-10">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={prevSlide}
                className="h-8 w-8 rounded-lg bg-white/75 dark:bg-[#0f172a]/75 hover:bg-white dark:hover:bg-[#0f172a] border-slate-200 dark:border-white/5 cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={nextSlide}
                className="h-8 w-8 rounded-lg bg-white/75 dark:bg-[#0f172a]/75 hover:bg-white dark:hover:bg-[#0f172a] border-slate-200 dark:border-white/5 cursor-pointer"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats & Star Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic numbers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Avg Rating</span>
            <div className="flex items-baseline gap-1 mt-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{avgRating}</h3>
              <Star className="h-5 w-5 fill-amber-500 text-amber-500 inline-block mb-1" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Excellent purchaser trust</p>
          </div>

          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Testimonials</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{totalCount}</h3>
            <p className="text-xs text-slate-400 mt-1">{featuredCount} featured in showcase</p>
          </div>
        </div>

        {/* Rating distribution chart */}
        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm md:col-span-2 space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rating Distribution</span>
          <div className="space-y-1.5 pt-1">
            {ratingDistribution.map((count, index) => {
              const stars = 5 - index;
              const percent = Math.round((count / Math.max(totalCount, 1)) * 100);
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-10 font-bold dark:text-white flex items-center gap-0.5">{stars} <Star className="h-3 w-3 fill-amber-500 text-amber-500" /></span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium text-slate-500 dark:text-slate-400">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-50 dark:bg-[#0f172a]/40 border border-slate-150 dark:border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, purchased property..."
            className="pl-10 h-10.5 w-full bg-white dark:bg-[#050816]/60 border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Filters</span>
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-10 bg-white dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-3 outline-none text-xs font-semibold focus:border-amber-500 cursor-pointer"
          >
            <option value="All">Rating: All Stars</option>
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="h-10 bg-white dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-3 outline-none text-xs font-semibold focus:border-amber-500 cursor-pointer"
          >
            <option value="All">Showcase Status: All</option>
            <option value="Featured">Featured Showcase Only</option>
            <option value="Standard">Standard Testimonials</option>
          </select>
        </div>
      </div>

      {/* Main Grid display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200/50 dark:border-slate-800/50" />
          ))}
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0f172a]/20 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
            <MessageSquare className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Endorsements Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
            Try adjusting your search criteria or register a new feedback entry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
          {filteredTestimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="group relative bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Rating & status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-amber-550">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < testimonial.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200 dark:text-slate-850'}`} 
                    />
                  ))}
                </div>

                <div className="flex gap-1.5">
                  {testimonial.isFeatured && (
                    <Badge className="bg-amber-500/10 text-amber-550 border border-amber-500/20 rounded-lg text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      Featured
                    </Badge>
                  )}
                  <Badge className={`border rounded-lg text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider ${testimonial.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-550/20' : 'bg-rose-500/10 text-rose-500 border-rose-550/20'}`}>
                    {testimonial.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Text content block */}
              <div className="my-5 flex-1 relative">
                <Quote className="h-8 w-8 text-amber-500/10 mb-1" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif line-clamp-5 italic">
                  &ldquo;{testimonial.cleanContent}&rdquo;
                </p>
              </div>

              {/* Customer Profile Row */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0 shadow-sm">
                    {testimonial.authorImage ? (
                      <img src={testimonial.authorImage} alt={testimonial.authorName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-amber-500/10 to-transparent text-amber-500">
                        {testimonial.authorName?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">{testimonial.authorName}</h5>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold truncate max-w-[130px]">{testimonial.authorDesignation || 'Verified Purchaser'}</p>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="text-[9px] font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider truncate max-w-[120px]" title={testimonial.propertyName}>
                    {testimonial.propertyName || 'Premium Residence'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium flex items-center justify-end gap-1">
                    <Calendar className="h-3 w-3" /> Yr {testimonial.purchaseYear}
                  </p>
                </div>
              </div>

              {/* Actions Overlay on Hover */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-150 dark:border-white/5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { setEditing(testimonial); setOpen(true); }}
                  className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-lg" />}>
                    <Trash2 className="h-4 w-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-rose-500" />
                        Delete Testimonial?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-550 dark:text-slate-400">
                        Permanently delete endorsement by <strong>{testimonial.authorName}</strong>? This action is irreversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                      <AlertDialogCancel className="rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(testimonial.id)} 
                        className="bg-rose-550 hover:bg-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/10"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
