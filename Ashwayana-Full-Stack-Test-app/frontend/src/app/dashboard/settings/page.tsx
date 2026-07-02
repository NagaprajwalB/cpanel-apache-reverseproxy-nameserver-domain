'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useState, useEffect } from 'react';
import { 
  Save, 
  Globe, 
  FileText, 
  Info, 
  Share2, 
  Sparkles, 
  Building,
  Smartphone,
  Mail,
  MapPin,
  Link as LinkIcon,
  Search
} from 'lucide-react';
import { parseSettingsFooter, serializeSettingsFooter } from '@/lib/metadata';

const schema = z.object({
  companyName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  googleMapsLink: z.string().optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  footerText: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  
  // Custom SEO / Metadata fields saved inside footerText
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  reraNumber: z.string().optional(),
  siteDomain: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const GlassCard = ({ title, description, children, icon: Icon }: { title: string; description?: string; children: React.ReactNode; icon?: React.ElementType }) => (
  <Card className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-amber-500/20 transition-all duration-300 overflow-hidden">
    <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4">
      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-amber-500" />}
        {title}
      </CardTitle>
      {description && <CardDescription className="text-xs text-slate-400 font-semibold">{description}</CardDescription>}
    </CardHeader>
    <CardContent className="pt-6 space-y-4">
      {children}
    </CardContent>
  </Card>
);

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data || {};
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (settings) {
      const parsedFooter = parseSettingsFooter(settings.footerText || '');
      reset({
        companyName: settings.companyName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        googleMapsLink: settings.googleMapsLink || '',
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        linkedinUrl: settings.linkedinUrl || '',
        youtubeUrl: settings.youtubeUrl || '',
        footerText: parsedFooter.footerText,
        seoTitle: parsedFooter.metadata.seoTitle || '',
        seoDescription: parsedFooter.metadata.seoDescription || '',
        seoKeywords: parsedFooter.metadata.seoKeywords || '',
        reraNumber: parsedFooter.metadata.reraNumber || '',
        siteDomain: parsedFooter.metadata.siteDomain || '',
      });
      setLogoUrl(settings.logoUrl || '');
      setFaviconUrl(settings.faviconUrl || '');
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const serializedFooter = serializeSettingsFooter(data.footerText || '', {
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        reraNumber: data.reraNumber,
        siteDomain: data.siteDomain,
      });

      const payload = {
        companyName: data.companyName,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        googleMapsLink: data.googleMapsLink || '',
        facebookUrl: data.facebookUrl || '',
        instagramUrl: data.instagramUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        youtubeUrl: data.youtubeUrl || '',
        footerText: serializedFooter,
        logoUrl,
        faviconUrl,
      };

      return api.post('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center gap-3">
        <Info className="h-8 w-8 animate-pulse text-amber-500" />
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Loading configurations...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-[1200px] mx-auto p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/40">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            System Configuration
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Configure global website settings, branding parameters, business metadata and SEO.
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={mutation.isPending}
          className="h-11 bg-slate-900 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 rounded-xl px-6 font-bold shadow-lg shadow-amber-500/5 transition-all duration-305 flex items-center gap-2 cursor-pointer"
        >
          <Save className="h-4.5 w-4.5" />
          {mutation.isPending ? 'Saving...' : saved ? '✓ Saved Configurations' : 'Save Configurations'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Business Identity */}
        <GlassCard title="Business Identity & Info" description="Basic info representing your company across property pages" icon={Building}>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Company Name</Label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input {...register('companyName')} placeholder="e.g. Ashvayana Realty Private Limited" className="pl-10 rounded-xl border-slate-200 dark:border-slate-800" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Corporate Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="email" {...register('email')} className="pl-10 rounded-xl border-slate-200 dark:border-slate-800" placeholder="sales@ashvayana.com" />
              </div>
              {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Contact Phone</Label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input {...register('phone')} className="pl-10 rounded-xl border-slate-200 dark:border-slate-800" placeholder="+91 22 9900 8800" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">RERA License Number</Label>
              <Input {...register('reraNumber')} className="rounded-xl border-slate-200 dark:border-slate-800" placeholder="PRM/KA/RERA/1251/..." />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Site Primary Domain</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input {...register('siteDomain')} className="pl-8.5 rounded-xl border-slate-200 dark:border-slate-800" placeholder="https://ashvayanadevelopers.com" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">HQ Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <textarea
                {...register('address')}
                placeholder="Corporate office headquarters address details..."
                rows={2}
                className="pl-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Google Maps Embed Link</Label>
            <Input {...register('googleMapsLink')} placeholder="https://google.com/maps/embed/..." className="rounded-xl border-slate-200 dark:border-slate-800" />
          </div>
        </GlassCard>

        {/* SEO Settings */}
        <GlassCard title="SEO & Search Visibility" description="Optimize public listing discovery on Google and social shares" icon={Search}>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Global Meta Title</Label>
            <Input {...register('seoTitle')} placeholder="e.g. Ashvayana Developers | Luxury Residential Estates & Villas" className="rounded-xl border-slate-200 dark:border-slate-800" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Global Meta Description</Label>
            <textarea
              {...register('seoDescription')}
              placeholder="Provide a search snippet describing your development brand (recommended 150-160 characters)..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-105 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Global SEO Keywords</Label>
            <Input {...register('seoKeywords')} placeholder="luxury villas, luxury penthouse, gated villas Goa, Ashvayana" className="rounded-xl border-slate-200 dark:border-slate-800" />
          </div>

          <div className="space-y-1.5 bg-slate-50 dark:bg-[#0a0f1d]/50 p-4 border border-slate-150 dark:border-slate-850 rounded-2xl">
            <div className="flex gap-2">
              <Globe className="h-4.5 w-4.5 text-amber-550 flex-shrink-0" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Search Engine Preview</span>
                <h5 className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer leading-snug">
                  {settings?.companyName || 'Ashvayana Developers'} | Luxury Residences
                </h5>
                <p className="text-xs text-emerald-700 dark:text-emerald-500 font-medium">https://ashvayanadevelopers.com</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  Discover curated luxury properties, infinity pools, and signature developments by Ashvayana Group. Built for selective purchasers.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Corporate Assets Branding */}
        <Card className="md:col-span-2 bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Corporate Identity Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Corporate Primary Logo</Label>
              <FileUpload value={logoUrl} onUpload={setLogoUrl} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-455 uppercase tracking-wider">Site Shortcut Favicon</Label>
              <FileUpload value={faviconUrl} onUpload={setFaviconUrl} />
            </div>
          </CardContent>
        </Card>

        {/* Social Integrations */}
        <GlassCard title="Social Integrations & Connections" description="Connect brand profiles visible in public footer navigation" icon={Share2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Facebook URL</Label>
              <Input {...register('facebookUrl')} placeholder="https://facebook.com/ashvayana" className="rounded-xl border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Instagram URL</Label>
              <Input {...register('instagramUrl')} placeholder="https://instagram.com/ashvayana" className="rounded-xl border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">LinkedIn URL</Label>
              <Input {...register('linkedinUrl')} placeholder="https://linkedin.com/company/ashvayana" className="rounded-xl border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">YouTube URL</Label>
              <Input {...register('youtubeUrl')} placeholder="https://youtube.com/c/ashvayana" className="rounded-xl border-slate-200 dark:border-slate-800" />
            </div>
          </div>
        </GlassCard>

        {/* Footer Configurations */}
        <GlassCard title="Footer Config & copyright Notice" description="Global copyright message rendered at page footer" icon={FileText}>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Footer copyright text</Label>
            <Input {...register('footerText')} placeholder="e.g. © 2026 Ashvayana Group. All rights reserved." className="rounded-xl border-slate-200 dark:border-slate-800" />
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-[#0a0f1d]/50 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-1 text-slate-500 dark:text-slate-400 text-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Global Footer Preview</span>
            <div className="flex flex-col sm:flex-row justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-900 gap-2">
              <p className="font-medium">© 2026 Ashvayana. All rights reserved.</p>
              <div className="flex gap-3 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-450 tracking-wider">
                <span>Privacy</span>
                <span>Terms</span>
                <span>RERA License</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </form>
  );
}
