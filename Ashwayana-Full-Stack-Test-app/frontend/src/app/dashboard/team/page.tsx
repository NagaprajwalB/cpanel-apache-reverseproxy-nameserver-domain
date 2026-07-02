'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Mail, 
  Phone, 
  Grid, 
  List, 
  Users, 
  Briefcase,
  Search,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  ShieldCheck,
  UserCheck,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

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
import { parseTeamBio, serializeTeamBio } from '@/lib/metadata';

interface TeamMember {
  id: number;
  name: string;
  designation: string;
  email: string;
  phone: string;
  linkedin: string;
  bio: string;
  displayOrder: number;
  active: boolean;
  imageUrl: string;
}

interface ParsedTeamMember extends TeamMember {
  cleanBio: string;
  department: string;
  twitter: string;
  github: string;
  isLeadership: boolean;
}

const DEPARTMENTS = ['All', 'Leadership', 'Sales & Marketing', 'Engineering & Construction', 'Legal & Finance', 'Operations & Admin'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().min(1, 'Designation is required'),
  bioText: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  active: z.boolean().optional(),
  
  // Premium metadata fields
  department: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  isLeadership: z.boolean().optional(),
  imageUrl: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function TeamMemberDialog({ defaultValues, memberId, onClose }: {
  defaultValues?: Partial<FormValues>; memberId?: number; onClose: () => void
}) {
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState(defaultValues?.imageUrl || '');
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      active: true,
      department: 'Sales & Marketing',
      isLeadership: false,
      displayOrder: 1,
      ...defaultValues
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const serializedBio = serializeTeamBio(data.bioText || '', {
        department: data.department,
        twitter: data.twitter,
        github: data.github,
        isLeadership: data.isLeadership,
      });

      const payload = {
        name: data.name,
        designation: data.designation,
        email: data.email || '',
        phone: data.phone || '',
        linkedin: data.linkedin || '',
        bio: serializedBio,
        displayOrder: data.displayOrder || 1,
        active: data.active ?? true,
        imageUrl: imageUrl,
      };

      return memberId 
        ? api.put(`/team/${memberId}`, payload) 
        : api.post('/team', payload);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['team'] }); 
      onClose(); 
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name *</Label>
          <Input {...register('name')} placeholder="e.g. Vikramaditya Scindia" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
          {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designation *</Label>
          <Input {...register('designation')} placeholder="e.g. Chief Investment Officer" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
          {errors.designation && <p className="text-xs text-rose-500 font-medium">{errors.designation.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Division / Department</Label>
          <select 
            {...register('department')} 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none text-sm font-medium"
          >
            {DEPARTMENTS.filter(d => d !== 'All' && d !== 'Leadership').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</Label>
          <Input type="email" {...register('email')} placeholder="name@ashvayana.com" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
          {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</Label>
          <Input {...register('phone')} placeholder="+91 99000 88000" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">LinkedIn Profile URL</Label>
          <Input {...register('linkedin')} placeholder="https://linkedin.com/in/username" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Twitter Profile URL</Label>
          <Input {...register('twitter')} placeholder="https://twitter.com/username" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">GitHub Profile URL</Label>
          <Input {...register('github')} placeholder="https://github.com/username" className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Display Order Weight</Label>
          <Input type="number" {...register('displayOrder')} className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-amber-500/50 transition-all" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Biography</Label>
        <textarea {...register('bioText')} placeholder="Describe employee experience, expertise and portfolio milestones..." rows={3} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none transition-all" />
      </div>

      <div className="flex flex-wrap gap-5 py-2 border-y border-slate-100 dark:border-slate-900">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" {...register('active')} className="w-4.5 h-4.5 rounded border-slate-350 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Staff Status</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" {...register('isLeadership')} className="w-4.5 h-4.5 rounded border-slate-350 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Leadership Board</span>
        </label>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employee Portrait Photo</Label>
        <FileUpload value={imageUrl} onUpload={setImageUrl} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 py-5 rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-sm">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-650 hover:to-amber-700 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/10 text-sm" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : memberId ? 'Save Profile' : 'Register Profile'}
        </Button>
      </div>
    </form>
  );
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParsedTeamMember | null>(null);
  const [previewing, setPreviewing] = useState<ParsedTeamMember | null>(null);
  
  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Fetch Team
  const { data: rawTeam = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: async () => { 
      const res = await api.get('/team?size=100'); 
      return res.data?.data?.content || res.data?.data || []; 
    },
  });

  // Parse team members metadata
  const parsedTeam = useMemo(() => {
    return rawTeam.map(item => {
      const { bio, metadata } = parseTeamBio(item.bio || '');
      return {
        ...item,
        cleanBio: bio,
        department: metadata.isLeadership ? 'Leadership' : (metadata.department || 'Sales & Marketing'),
        twitter: metadata.twitter || '',
        github: metadata.github || '',
        isLeadership: metadata.isLeadership || false,
      } as ParsedTeamMember;
    }).sort((a, b) => (a.displayOrder || 100) - (b.displayOrder || 100));
  }, [rawTeam]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/team/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      if (previewing?.id === deletedId) setPreviewing(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (member: ParsedTeamMember) => {
      const payload = {
        name: member.name,
        designation: member.designation,
        email: member.email,
        phone: member.phone,
        linkedin: member.linkedin,
        bio: serializeTeamBio(member.cleanBio, {
          department: member.department === 'Leadership' ? 'Sales & Marketing' : member.department,
          twitter: member.twitter,
          github: member.github,
          isLeadership: member.isLeadership
        }),
        displayOrder: member.displayOrder,
        active: !member.active,
        imageUrl: member.imageUrl
      };
      return api.put(`/team/${member.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    }
  });

  // Filtered lists
  const filteredTeam = useMemo(() => {
    return parsedTeam.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) || 
                            member.designation.toLowerCase().includes(search.toLowerCase()) || 
                            member.cleanBio.toLowerCase().includes(search.toLowerCase());
      
      const matchesDept = selectedDept === 'All' || 
                         (selectedDept === 'Leadership' && member.isLeadership) || 
                         (member.department === selectedDept);

      const matchesStatus = selectedStatus === 'All' || 
                            (selectedStatus === 'Active' && member.active) || 
                            (selectedStatus === 'Inactive' && !member.active);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [parsedTeam, search, selectedDept, selectedStatus]);

  // Breakdown of departments
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All': parsedTeam.length,
      'Leadership': parsedTeam.filter(m => m.isLeadership).length,
      'Sales & Marketing': parsedTeam.filter(m => !m.isLeadership && m.department === 'Sales & Marketing').length,
      'Engineering & Construction': parsedTeam.filter(m => !m.isLeadership && m.department === 'Engineering & Construction').length,
      'Legal & Finance': parsedTeam.filter(m => !m.isLeadership && m.department === 'Legal & Finance').length,
      'Operations & Admin': parsedTeam.filter(m => !m.isLeadership && m.department === 'Operations & Admin').length,
    };
    return counts;
  }, [parsedTeam]);

  // KPIs
  const totalCount = parsedTeam.length;
  const activeCount = parsedTeam.filter(m => m.active).length;
  const leadershipCount = parsedTeam.filter(m => m.isLeadership).length;
  const engineeringCount = parsedTeam.filter(m => m.department === 'Engineering & Construction').length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Executive Leadership & Team
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage the administrators, consultants, and representatives of the Ashvayana brand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('grid')}
              className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow text-amber-500 dark:text-amber-400' : 'text-slate-400 hover:text-slate-650'}`}
            >
              <Grid className="h-4.5 w-4.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('list')}
              className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-amber-500 dark:text-amber-400' : 'text-slate-400 hover:text-slate-650'}`}
            >
              <List className="h-4.5 w-4.5" />
            </Button>
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger render={<Button onClick={() => setEditing(null)} className="h-11 bg-slate-900 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 rounded-xl px-5 font-bold shadow-lg shadow-amber-500/5 transition-all duration-300" />}>
              <Plus className="mr-2 h-5 w-5" />Add Team Member
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold dark:text-white">
                  {editing ? 'Edit Team Member Details' : 'Register New Team Member'}
                </DialogTitle>
              </DialogHeader>
              <TeamMemberDialog 
                defaultValues={editing ? {
                  name: editing.name,
                  designation: editing.designation,
                  bioText: editing.cleanBio,
                  email: editing.email,
                  phone: editing.phone,
                  linkedin: editing.linkedin,
                  displayOrder: editing.displayOrder,
                  active: editing.active,
                  department: editing.department === 'Leadership' ? 'Sales & Marketing' : editing.department,
                  twitter: editing.twitter,
                  github: editing.github,
                  isLeadership: editing.isLeadership,
                  imageUrl: editing.imageUrl
                } as Partial<FormValues> : undefined}
                memberId={editing?.id}
                onClose={() => { setOpen(false); setEditing(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Members</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalCount}</h3>
          <p className="text-xs text-slate-400 mt-1">Brand representatives</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Staff</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{activeCount}</h3>
          <p className="text-xs text-slate-450 mt-1">{Math.round((activeCount / Math.max(totalCount, 1)) * 100)}% active status rate</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leadership Board</span>
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{leadershipCount}</h3>
          <p className="text-xs text-slate-400 mt-1">Directors & managing execs</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engineering Staff</span>
            <div className="h-8 w-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-pink-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{engineeringCount}</h3>
          <p className="text-xs text-slate-400 mt-1">Construction & architecture</p>
        </div>
      </div>

      {/* Filters Bar & Department Chips */}
      <div className="space-y-4">
        {/* Search and status select bar */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team member name, title, bio..."
              className="pl-10 h-11 w-full bg-white dark:bg-[#050816]/65 border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-slate-400">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">CRM Filter</span>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 bg-white dark:bg-[#050816]/65 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 rounded-xl px-3 outline-none text-xs font-semibold focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="All">Status: All Records</option>
              <option value="Active">Active Staff Only</option>
              <option value="Inactive">Suspended / Inactive</option>
            </select>
          </div>
        </div>

        {/* Department Chips */}
        <div className="flex flex-wrap gap-2 py-1">
          {DEPARTMENTS.map((dept) => {
            const count = deptCounts[dept] || 0;
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-205 flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                  isSelected 
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-amber-550/15'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <span>{dept}</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
                  isSelected ? 'bg-slate-950 text-amber-450' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layouts */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[340px] rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200/50 dark:border-slate-800/50" />
          ))}
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0f172a]/20 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
            <FolderOpen className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Team Members Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
            Try adjusting your search criteria or register a new team profile.
          </p>
          <Button onClick={() => { setSearch(''); setSelectedDept('All'); setSelectedStatus('All'); }} variant="outline" className="mt-4 rounded-xl font-bold text-xs">
            Reset Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">
          {filteredTeam.map((member) => (
            <div 
              key={member.id}
              className="group relative bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Photo & Leadership Overlay */}
              <div className="relative aspect-square w-full bg-slate-100 dark:bg-[#050816] overflow-hidden">
                {member.imageUrl ? (
                  <img 
                    src={member.imageUrl} 
                    alt={member.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent flex items-center justify-center text-6xl font-black text-amber-500/30">
                    {member.name?.[0]}
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-none rounded-lg text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase">
                    {member.department}
                  </Badge>
                  {member.isLeadership && (
                    <Badge className="bg-amber-500 text-slate-950 font-bold border-none rounded-lg text-[9px] px-2 py-0.5 tracking-wider uppercase flex items-center gap-0.5 shadow-sm">
                      <Sparkles className="h-2.5 w-2.5 fill-slate-950" /> Executive
                    </Badge>
                  )}
                </div>

                <div className="absolute top-4 right-4">
                  <Badge className={`border-none rounded-lg text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider ${member.active ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 backdrop-blur-md' : 'bg-rose-500/20 text-rose-500 border border-rose-500/20 backdrop-blur-md'}`}>
                    {member.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Socials Floating Overlay (Hover) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 gap-3">
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="h-9 w-9 bg-white/20 hover:bg-amber-500 text-white hover:text-slate-950 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-md">
                      <Linkedin className="h-4.5 w-4.5" />
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} target="_blank" rel="noreferrer" className="h-9 w-9 bg-white/20 hover:bg-amber-500 text-white hover:text-slate-950 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-md">
                      <Twitter className="h-4.5 w-4.5" />
                    </a>
                  )}
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noreferrer" className="h-9 w-9 bg-white/20 hover:bg-amber-500 text-white hover:text-slate-950 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-md">
                      <Github className="h-4.5 w-4.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Text details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                    {member.name}
                  </h4>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-450 uppercase tracking-wide truncate">
                    {member.designation}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pt-2">
                    {member.cleanBio || 'Ashvayana management partner.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4 mt-1">
                  <button 
                    onClick={() => toggleActiveMutation.mutate(member)}
                    className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-450 transition-colors"
                  >
                    {member.active ? 'Suspend' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setPreviewing(member)}
                      className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { setEditing(member); setOpen(true); }}
                      className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                    >
                      <Pencil className="h-4.5 w-4.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-lg" />}>
                        <Trash2 className="h-4.5 w-4.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                            Delete Profile?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
                            Delete <strong>{member.name}</strong> from team records? This will delete the profile entry completely.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                          <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(member.id)} 
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
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-slate-450 dark:text-slate-450 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Member</th>
                  <th className="py-4 px-6">Designation</th>
                  <th className="py-4 px-6">Division</th>
                  <th className="py-4 px-6">Contacts</th>
                  <th className="py-4 px-6">Display Weight</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredTeam.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-750">
                          {member.imageUrl ? (
                            <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-amber-500/10 to-transparent text-amber-500">
                              {member.name?.[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">{member.name} {member.isLeadership && <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}</h5>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID #{member.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-350 font-medium">
                      {member.designation}
                    </td>
                    <td className="py-4 px-6">
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 border-none rounded-lg text-xs font-semibold">
                        {member.department}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {member.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {member.displayOrder}
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={`border-none rounded-lg text-[10px] font-bold px-2 py-0.5 ${member.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setPreviewing(member)}
                          className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setEditing(member); setOpen(true); }}
                          className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <Pencil className="h-4.5 w-4.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-lg" />}>
                            <Trash2 className="h-4.5 w-4.5" />
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-rose-500" />
                                Delete Profile?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                                This action permanently removes <strong>{member.name}</strong> from team records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="rounded-xl border border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(member.id)} 
                                className="bg-rose-550 hover:bg-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/10"
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rich Preview Drawer */}
      <Dialog open={!!previewing} onOpenChange={(v) => { if (!v) setPreviewing(null); }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-0 overflow-hidden shadow-2xl">
          {previewing && (
            <div className="flex flex-col">
              {/* Cover Background / Photo Area */}
              <div className="relative h-64 bg-slate-100 dark:bg-[#050816] flex items-center justify-center">
                {previewing.imageUrl ? (
                  <img src={previewing.imageUrl} alt={previewing.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-center text-7xl font-black text-amber-500/20">
                    {previewing.name?.[0]}
                  </div>
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/35 to-transparent" />
                
                <button 
                  onClick={() => setPreviewing(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors shadow"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute bottom-6 left-6 space-y-1 text-white">
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-extrabold tracking-tight">{previewing.name}</h3>
                    <Badge className="bg-amber-550 text-slate-950 font-bold border-none rounded-lg text-[10px] px-2.5 py-0.5 tracking-wider uppercase">
                      {previewing.department}
                    </Badge>
                  </div>
                  <p className="text-slate-300 font-semibold text-sm flex items-center gap-1.5">
                    {previewing.designation}
                  </p>
                </div>
              </div>

              {/* Bio & Information details */}
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professional Biography</h4>
                  <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-150 dark:border-slate-800/80">
                    <p className="text-slate-700 dark:text-slate-305 text-sm leading-relaxed whitespace-pre-line font-serif italic">
                      &ldquo;{previewing.cleanBio || 'No biography text registered for this user.'}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-900 pt-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                    <p className="text-sm font-bold flex items-center gap-2 dark:text-white text-slate-800">
                      <Mail className="h-4.5 w-4.5 text-slate-400" />
                      {previewing.email || 'Not registered'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                    <p className="text-sm font-bold flex items-center gap-2 dark:text-white text-slate-800">
                      <Phone className="h-4.5 w-4.5 text-slate-400" />
                      {previewing.phone || 'Not registered'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Corporate Division</span>
                    <p className="text-sm font-bold dark:text-white text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="h-4.5 w-4.5 text-slate-400" />
                      {previewing.department}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Display weight Priority</span>
                    <p className="text-sm font-bold dark:text-white text-slate-800">Index Weight: {previewing.displayOrder}</p>
                  </div>
                </div>

                {/* Socials Connection */}
                {(previewing.linkedin || previewing.twitter || previewing.github) && (
                  <div className="flex gap-4 pt-2 border-t border-slate-105 dark:border-slate-900">
                    {previewing.linkedin && (
                      <a href={previewing.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-400 hover:text-amber-500 font-bold transition-colors">
                        <Linkedin className="h-4.5 w-4.5 text-slate-400" /> LinkedIn
                      </a>
                    )}
                    {previewing.twitter && (
                      <a href={previewing.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-400 hover:text-amber-500 font-bold transition-colors">
                        <Twitter className="h-4.5 w-4.5 text-slate-400" /> Twitter
                      </a>
                    )}
                    {previewing.github && (
                      <a href={previewing.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-400 hover:text-amber-500 font-bold transition-colors">
                        <Github className="h-4.5 w-4.5 text-slate-400" /> GitHub
                      </a>
                    )}
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                  <Button 
                    variant="outline" 
                    onClick={() => { setEditing(previewing); setOpen(true); setPreviewing(null); }}
                    className="rounded-xl font-bold h-11 border-slate-200 dark:border-slate-800"
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    onClick={() => setPreviewing(null)}
                    className="rounded-xl font-bold h-11 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 px-6 cursor-pointer"
                  >
                    Close Profile
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
