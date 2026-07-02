'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  SlidersHorizontal, 
  Search, 
  FolderOpen, 
  User, 
  Clock, 
  CheckCircle, 
  FileText, 
  UserCheck, 
  ChevronRight, 
  Kanban,
  List,
  PhoneCall,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { parseEnquiryMessage, getProjectIdFromKeywords } from '@/lib/metadata';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string; // New, Contacted, Closed
  createdDate: string;
  property?: {
    id: number;
    title: string;
  };
}

interface ParsedEnquiry extends Enquiry {
  cleanMessage: string;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  assignedTo: string;
  followUpDate: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; accent: string }> = {
  New: { label: 'Inbox', bg: 'bg-indigo-500/10 dark:bg-indigo-500/5', text: 'text-indigo-650 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-950', accent: 'bg-indigo-500' },
  Contacted: { label: 'In Progress', bg: 'bg-amber-500/10 dark:bg-amber-500/5', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-950', accent: 'bg-amber-500' },
  Closed: { label: 'Closed Won', bg: 'bg-emerald-500/10 dark:bg-emerald-500/5', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-950', accent: 'bg-emerald-500' },
};

const priorityColors = {
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-200 dark:border-rose-950 font-bold',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-200 dark:border-amber-950 font-bold',
  low: 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-medium',
};

export default function EnquiriesPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [viewing, setViewing] = useState<ParsedEnquiry | null>(null);

  // Notes/priority update state
  const [crmNotes, setCrmNotes] = useState('');
  const [crmPriority, setCrmPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [crmAssigned, setCrmAssigned] = useState('');
  const [crmStatus, setCrmStatus] = useState('New');
  const [crmFollowUp, setCrmFollowUp] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Fetch Enquiries
  const { data: rawEnquiries = [], isLoading } = useQuery<Enquiry[]>({
    queryKey: ['enquiries'],
    queryFn: async () => {
      const res = await api.get('/enquiries?size=100');
      return res.data?.data?.content || res.data?.data || [];
    },
  });

  // Fetch properties
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await api.get('/properties?size=100');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?size=100');
      return res.data?.data?.content || res.data?.data || [];
    }
  });

  // Parse enquiries and inject metadata
  const parsedEnquiries = useMemo(() => {
    return rawEnquiries.map(item => {
      const { message, metadata } = parseEnquiryMessage(item.message || '');
      
      let localMeta: { priority?: 'low' | 'medium' | 'high'; notes?: string; assignedTo?: string; followUpDate?: string } = {};
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`crm_enquiry_metadata_${item.id}`);
        if (stored) {
          try {
            localMeta = JSON.parse(stored);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {}
        }
      }

      const priority = localMeta.priority || metadata.priority || 'medium';
      const notes = localMeta.notes || metadata.notes || '';
      const assignedTo = localMeta.assignedTo || metadata.assignedTo || '';
      const followUpDate = localMeta.followUpDate || '';

      return {
        ...item,
        cleanMessage: message,
        priority,
        notes,
        assignedTo,
        followUpDate,
      } as ParsedEnquiry;
    }).sort((a, b) => new Date(b.createdDate || '').getTime() - new Date(a.createdDate || '').getTime());
  }, [rawEnquiries]);

  // CRM update mutations
  const updateCRM = useMutation({
    mutationFn: async ({ id, status, notes, priority, assignedTo, followUpDate }: {
      id: number; status: string; notes: string; priority: 'low' | 'medium' | 'high'; assignedTo: string; followUpDate: string;
    }) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`crm_enquiry_metadata_${id}`, JSON.stringify({
          priority,
          notes,
          assignedTo,
          followUpDate
        }));
      }

      const res = await api.patch(`/enquiries/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setViewing(null);
    }
  });

  const updateCardStatus = useMutation({
    mutationFn: async ({ id, status, currentItem }: { id: number; status: string; currentItem: ParsedEnquiry }) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`crm_enquiry_metadata_${id}`, JSON.stringify({
          priority: currentItem.priority,
          notes: currentItem.notes,
          assignedTo: currentItem.assignedTo,
          followUpDate: currentItem.followUpDate
        }));
      }
      const res = await api.patch(`/enquiries/${id}/status?status=${status}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/enquiries/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      if (viewing?.id === deletedId) setViewing(null);
    },
  });

  // Open Preview Drawer and hydrate notes states
  const openEnquiryDrawer = (enquiry: ParsedEnquiry) => {
    setViewing(enquiry);
    setCrmNotes(enquiry.notes);
    setCrmPriority(enquiry.priority);
    setCrmAssigned(enquiry.assignedTo);
    setCrmStatus(enquiry.status || 'New');
    setCrmFollowUp(enquiry.followUpDate || '');
  };

  // Find linked property and project detailed objects
  const associatedData = useMemo(() => {
    if (!viewing?.property) return null;
    
    const propObj = properties.find((p: { id: number; keywords?: string }) => p.id === viewing.property?.id);
    if (!propObj) return null;

    const projectId = getProjectIdFromKeywords(propObj.keywords || '');
    const projObj = projectId ? projects.find((p: { id: number }) => p.id === projectId) : null;

    return {
      property: propObj,
      project: projObj
    };
  }, [viewing, properties, projects]);

  // Filtered list
  const filteredEnquiries = useMemo(() => {
    return parsedEnquiries.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.email.toLowerCase().includes(search.toLowerCase()) || 
                            item.phone.toLowerCase().includes(search.toLowerCase()) || 
                            item.cleanMessage.toLowerCase().includes(search.toLowerCase()) ||
                            (item.property?.title || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [parsedEnquiries, search, statusFilter, priorityFilter]);

  // Activity log helper for viewing item
  const timelineActivities = useMemo(() => {
    if (!viewing) return [];
    const activities = [];
    
    // 1. Initial Submission
    activities.push({
      id: 'sub',
      title: 'Prospect enquiry received',
      desc: `Prospect submitted request via portfolio landing page for ${viewing.property?.title || 'general enquiry'}.`,
      date: viewing.createdDate ? new Date(viewing.createdDate).toLocaleString('en-IN') : 'Unknown',
      icon: Clock,
      color: 'text-indigo-500 bg-indigo-500/10'
    });

    // 2. Rep assignment
    if (viewing.assignedTo) {
      activities.push({
        id: 'assign',
        title: `Sales Agent Assigned`,
        desc: `Sales Executive ${viewing.assignedTo} has taken ownership of this prospect.`,
        date: 'Hydrated from CRM cache',
        icon: UserCheck,
        color: 'text-amber-500 bg-amber-500/10'
      });
    }

    // 3. Status/Stage change
    activities.push({
      id: 'stage',
      title: `Deal Stage: ${viewing.status}`,
      desc: viewing.status === 'New' 
        ? 'Lead sits in qualification inbox waiting for assessment.'
        : viewing.status === 'Contacted' 
          ? 'Agent reached out to client. Deal is in ongoing follow-up.'
          : 'Lead finalized and deal records successfully closed.',
      date: 'Latest Update',
      icon: Activity,
      color: viewing.status === 'Closed' ? 'text-emerald-505 bg-emerald-500/10' : 'text-amber-505 bg-amber-500/10'
    });

    return activities;
  }, [viewing]);

  // KPIs
  const totalCount = parsedEnquiries.length;
  const newCount = parsedEnquiries.filter(e => e.status === 'New').length;
  const contactedCount = parsedEnquiries.filter(e => e.status === 'Contacted').length;
  const closedCount = parsedEnquiries.filter(e => e.status === 'Closed').length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Lead CRM & Pipeline
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Qualify incoming portfolio requests, contact prospective buyers, and track deal stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('board')}
              className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-800 shadow text-amber-550 dark:text-amber-400' : 'text-slate-400 hover:text-slate-650'}`}
            >
              <Kanban className="h-4.5 w-4.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('list')}
              className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-amber-550 dark:text-amber-400' : 'text-slate-400 hover:text-slate-650'}`}
            >
              <List className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <PhoneCall className="h-4.5 w-4.5 text-indigo-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalCount}</h3>
          <p className="text-xs text-slate-400 mt-1">Lifetime incoming requests</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unassigned / New</span>
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-violet-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{newCount}</h3>
          <p className="text-xs text-violet-500 font-semibold mt-1">Inbox qualification queue</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Contact</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <UserCheck className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{contactedCount}</h3>
          <p className="text-xs text-slate-450 mt-1">Ongoing discussions</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deals Closed</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{closedCount}</h3>
          <p className="text-xs text-slate-450 mt-1">{Math.round((closedCount / Math.max(totalCount, 1)) * 100)}% closing conversion rate</p>
        </div>
      </div>

      {/* CRM Filter Controls */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prospect name, phone, email, linked property..."
            className="pl-10 h-10.5 w-full bg-white dark:bg-[#050816]/65 border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">CRM Filters</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 bg-white dark:bg-[#050816]/65 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 rounded-xl px-3 outline-none text-xs font-semibold focus:border-amber-500 cursor-pointer"
          >
            <option value="All">Stage: All Pipeline</option>
            <option value="New">Stage: Inbox Queue (New)</option>
            <option value="Contacted">Stage: In Contact (Follow-up)</option>
            <option value="Closed">Stage: Closed Won (Resolved)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 bg-white dark:bg-[#050816]/65 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 rounded-xl px-3 outline-none text-xs font-semibold focus:border-amber-500 cursor-pointer"
          >
            <option value="All">Priority: All levels</option>
            <option value="high">Priority: High Priority</option>
            <option value="medium">Priority: Medium Priority</option>
            <option value="low">Priority: Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Board Pipeline View vs List View */}
      {isLoading ? (
        <div className="space-y-4 py-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-850/40 animate-pulse border border-slate-200/50" />
          ))}
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0f172a]/20 border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-slate-105 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
            <FolderOpen className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No CRM Enquiries Registered</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
            Try adjusting your status or priority query filters.
          </p>
        </div>
      ) : viewMode === 'board' ? (
        /* CRM PIPELINE BOARD (KANBAN STYLE) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-[fadeIn_0.3s_ease-out]">
          {Object.entries(statusConfig).map(([status, config]) => {
            const listForStatus = filteredEnquiries.filter(x => x.status === status);
            return (
              <div key={status} className="bg-slate-50 dark:bg-[#0a0f1d]/50 border border-slate-200 dark:border-slate-900/60 rounded-3xl p-4 flex flex-col space-y-4 min-h-[500px]">
                {/* Column header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${config.accent}`} />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-150">{config.label}</h4>
                  </div>
                  <span className="text-xs bg-slate-200 dark:bg-slate-850 px-2 py-0.5 rounded-full font-bold text-slate-500 dark:text-slate-400">
                    {listForStatus.length}
                  </span>
                </div>

                {/* Lead cards scroll area */}
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin">
                  {listForStatus.map((enquiry) => (
                    <div 
                      key={enquiry.id}
                      onClick={() => openEnquiryDrawer(enquiry)}
                      className="group bg-white dark:bg-[#0f172a]/65 border border-slate-150 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-500/20 transition-all duration-200 flex flex-col gap-3 cursor-pointer relative"
                    >
                      {/* Name & Priority */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors text-sm">
                            {enquiry.name}
                          </h5>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {enquiry.createdDate ? new Date(enquiry.createdDate).toLocaleDateString('en-IN') : '—'}
                          </span>
                        </div>
                        {enquiry.priority && (
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${priorityColors[enquiry.priority]}`}>
                            {enquiry.priority}
                          </span>
                        )}
                      </div>

                      {/* Estate interest info */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-450 uppercase flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {enquiry.property?.title || 'General Enquiry'}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">
                          {enquiry.cleanMessage || 'General message text not registered.'}
                        </p>
                      </div>

                      {/* Executive Assignment & Follow up dates */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900/60 pt-3 mt-1 text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-400">
                          {enquiry.assignedTo ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-[8px] border border-amber-500/10">
                                {enquiry.assignedTo[0]}
                              </div>
                              <span className="font-semibold truncate max-w-[90px]">{enquiry.assignedTo}</span>
                            </>
                          ) : (
                            <span className="italic font-medium text-slate-400 flex items-center gap-1">
                              <User className="h-3.5 w-3.5" /> Unassigned
                            </span>
                          )}
                        </div>

                        {enquiry.followUpDate ? (
                          <span className="text-amber-600 dark:text-amber-450 font-bold bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> FU: {new Date(enquiry.followUpDate).toLocaleDateString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">No FU Date</span>
                        )}
                      </div>

                      {/* Quick Move Buttons (Visible on hover on desktop) */}
                      <div className="flex justify-end gap-1.5 mt-1 border-t border-slate-100 dark:border-slate-900/60 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {status !== 'New' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCardStatus.mutate({ id: enquiry.id, status: 'New', currentItem: enquiry });
                            }}
                            className="text-[9px] uppercase font-bold text-indigo-500 hover:underline px-1.5 py-0.5 rounded"
                          >
                            To Inbox
                          </button>
                        )}
                        {status !== 'Contacted' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCardStatus.mutate({ id: enquiry.id, status: 'Contacted', currentItem: enquiry });
                            }}
                            className="text-[9px] uppercase font-bold text-amber-505 hover:underline px-1.5 py-0.5 rounded"
                          >
                            To In-Progress
                          </button>
                        )}
                        {status !== 'Closed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCardStatus.mutate({ id: enquiry.id, status: 'Closed', currentItem: enquiry });
                            }}
                            className="text-[9px] uppercase font-bold text-emerald-500 hover:underline px-1.5 py-0.5 rounded"
                          >
                            To Closed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {listForStatus.length === 0 && (
                    <div className="border border-dashed border-slate-200 dark:border-slate-900 rounded-3xl py-12 text-center text-xs text-slate-400 italic font-medium">
                      No leads in this stage.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CRM DATA FEED / LIST VIEW */
        <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
          {filteredEnquiries.map((enquiry) => (
            <div 
              key={enquiry.id}
              onClick={() => openEnquiryDrawer(enquiry)}
              className="group bg-white dark:bg-[#0f172a]/55 border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:border-amber-500/20 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 text-sm font-bold border border-slate-200 dark:border-slate-800 flex-shrink-0 group-hover:border-amber-500/35 transition-colors">
                  <User className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors text-base">
                      {enquiry.name}
                    </h4>
                    <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> 
                      {enquiry.createdDate ? new Date(enquiry.createdDate).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-550 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-450" /> {enquiry.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-455" /> {enquiry.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 md:px-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-450 uppercase flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> 
                    {enquiry.property?.title || 'General Enquiry'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-1">
                  {enquiry.cleanMessage || 'No message text registered.'}
                </p>
              </div>

              <div className="flex items-center gap-3 self-stretch justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800/40 pt-3 md:pt-0">
                <div className="flex gap-2">
                  {enquiry.priority && (
                    <Badge className={`border rounded-lg text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider ${priorityColors[enquiry.priority]}`}>
                      {enquiry.priority}
                    </Badge>
                  )}
                  <Badge className={`border rounded-lg text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider ${statusConfig[enquiry.status]?.accent} ${statusConfig[enquiry.status]?.text} ${statusConfig[enquiry.status]?.border}`}>
                    {statusConfig[enquiry.status]?.label || enquiry.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openEnquiryDrawer(enquiry)}
                    className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-lg" />}>
                      <Trash2 className="h-4.5 w-4.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
                          <ShieldAlert className="h-5 w-5 text-rose-500" />
                          Delete Enquiry?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-550 dark:text-slate-400">
                          Delete lead for <strong>{enquiry.name}</strong>? This removes the record from CRM statistics.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(enquiry.id)} 
                          className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/10"
                        >
                          Delete Permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <ChevronRight className="hidden md:inline h-5 w-5 text-slate-350 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRM Qualification side drawer dialog */}
      <Dialog open={!!viewing} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-855 rounded-3xl p-6 overflow-hidden shadow-2xl">
          {viewing && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
                <div>
                  <h3 className="text-xl font-black dark:text-white">Lead Qualification & CRM rep</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ID #{viewing.id} • Registered on {viewing.createdDate ? new Date(viewing.createdDate).toLocaleString('en-IN') : '—'}</p>
                </div>
                
                <Badge className={`border rounded-lg text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${statusConfig[crmStatus]?.bg} ${statusConfig[crmStatus]?.text} ${statusConfig[crmStatus]?.border}`}>
                  {statusConfig[crmStatus]?.label || crmStatus}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: CRM Details & Assignment */}
                <div className="space-y-5">
                  {/* Contact Info Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> Lead Information</h4>
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Prospect Name</span>
                        <p className="text-sm font-bold dark:text-white text-slate-900">{viewing.name}</p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Email Address</span>
                          <p className="font-semibold dark:text-slate-300 text-slate-700">{viewing.email}</p>
                        </div>
                        <a href={`mailto:${viewing.email}`} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors shadow-sm bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850">
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Phone number</span>
                          <p className="font-semibold dark:text-slate-300 text-slate-700">{viewing.phone}</p>
                        </div>
                        <a href={`tel:${viewing.phone}`} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors shadow-sm bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850">
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Message details */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prospect message text</span>
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-150 dark:border-slate-800/80 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif italic max-h-28 overflow-y-auto">
                      &ldquo;{viewing.cleanMessage || 'No specific text submitted.'}&rdquo;
                    </div>
                  </div>
                </div>

                {/* Right Side: Linked Estate info */}
                <div className="space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-slate-400" /> Property Interest</h4>
                    
                    {associatedData?.property ? (
                      <div className="space-y-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Target Listing</span>
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-450">{associatedData.property.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-900 pt-2">
                          <div>
                            <span className="text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Price tag</span>
                            <p className="font-bold dark:text-white text-slate-850">
                              {associatedData.property.priceLabel || `₹${associatedData.property.price?.toLocaleString('en-IN')}`}
                            </p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-semibold uppercase tracking-wider">Type</span>
                            <p className="font-bold dark:text-white text-slate-850 uppercase">{associatedData.property.type}</p>
                          </div>
                        </div>

                        {associatedData.project && (
                          <div className="border-t border-slate-100 dark:border-slate-900 pt-2">
                            <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Associated Project</span>
                            <div className="flex justify-between items-center mt-0.5">
                              <p className="font-bold text-slate-700 dark:text-slate-350">{associatedData.project.title}</p>
                              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                {associatedData.project.status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic font-medium">General inquiry, not associated with a specific property.</p>
                    )}
                  </div>

                  {/* Priority & Status Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">CRM Stage</Label>
                      <select 
                        value={crmStatus}
                        onChange={(e) => setCrmStatus(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none text-xs font-semibold cursor-pointer"
                      >
                        <option value="New">Inbox (New)</option>
                        <option value="Contacted">In Progress</option>
                        <option value="Closed">Closed Won</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Priority</Label>
                      <select 
                        value={crmPriority}
                        onChange={(e) => setCrmPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none text-xs font-semibold cursor-pointer"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal notes & follow up date picker */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-900 pt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-405 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-slate-400" /> Internal CRM Qualification Notes
                  </Label>
                  <textarea 
                    value={crmNotes}
                    onChange={(e) => setCrmNotes(e.target.value)}
                    placeholder="Enter customer call summaries, lead qualification questions, budget limits, or site visits details..."
                    rows={3} 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-105 px-3 py-2.5 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Assigned Agent</Label>
                    <Input 
                      value={crmAssigned}
                      onChange={(e) => setCrmAssigned(e.target.value)}
                      placeholder="e.g. Madhumathi I." 
                      className="h-9.5 text-xs bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Follow-Up Date</Label>
                    <input 
                      type="date"
                      value={crmFollowUp}
                      onChange={(e) => setCrmFollowUp(e.target.value)}
                      className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none text-xs font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 h-9.5 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Logs Timeline */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-900 pt-5">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-slate-450" /> Prospect Audit timeline
                </h4>
                <div className="space-y-3 pl-2 max-h-[140px] overflow-y-auto pr-1">
                  {timelineActivities.map((act) => {
                    const ActIcon = act.icon;
                    return (
                      <div key={act.id} className="flex gap-3 text-xs">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${act.color} border dark:border-slate-800 shadow-sm`}>
                          <ActIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 space-y-0.5 border-b border-slate-50 dark:border-slate-900 pb-2">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-white">{act.title}</span>
                            <span className="text-[9px] text-slate-400">{act.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-450 leading-relaxed font-medium">{act.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this CRM enquiry permanently?')) {
                      deleteMutation.mutate(viewing.id);
                    }
                  }}
                  className="text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Delete Enquiry
                </button>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setViewing(null)}
                    className="rounded-xl font-bold h-11 border-slate-200 dark:border-slate-800 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => updateCRM.mutate({
                      id: viewing.id,
                      status: crmStatus,
                      notes: crmNotes,
                      priority: crmPriority,
                      assignedTo: crmAssigned,
                      followUpDate: crmFollowUp
                    })}
                    className="rounded-xl font-bold h-11 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 px-6 cursor-pointer text-xs"
                  >
                    Save Qualification
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
