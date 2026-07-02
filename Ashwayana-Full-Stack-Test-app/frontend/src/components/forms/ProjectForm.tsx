'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { UseFormRegisterReturn, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { ArrowLeft, Loader2, Save, MapPin, LayoutGrid, Info, Sparkles, Award, FileText } from 'lucide-react';
import Link from 'next/link';
import { parseProjectDescription, serializeProjectDescription } from '@/lib/metadata';
import type { ProjectMetadata } from '@/lib/metadata';

const projectFormSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  descriptionText: z.string().min(1, 'Project description is required'),
  shortDescription: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  completionYear: z.string().optional().nullable(),
  totalUnits: z.coerce.number().optional().nullable(),
  thumbnailUrl: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featured: z.boolean().optional(),
  
  // Premium metadata fields
  budget: z.coerce.number().optional().nullable(),
  possessionDate: z.string().optional(),
  launchDate: z.string().optional(),
  availableUnits: z.coerce.number().optional().nullable(),
  soldUnits: z.coerce.number().optional().nullable(),
  galleryUrls: z.string().optional(), // Comma separated
  amenitiesList: z.string().optional(), // Comma separated
  masterPlanUrl: z.string().optional(),
  brochureUrl: z.string().optional(),
  reraNumber: z.string().optional(),
  developerName: z.string().optional(),
  projectType: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  progressPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  constructionStage: z.string().optional(),
  completionTimeline: z.string().optional(),
  investmentRating: z.string().optional(),
  highlightsList: z.string().optional(), // Comma separated
  landmarksList: z.string().optional(), // Comma separated
  connectivity: z.string().optional(),
  healthScore: z.coerce.number().min(0).max(100).optional().nullable(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface RawProjectData {
  [key: string]: unknown;
}

interface ProjectFormProps {
  defaultValues?: RawProjectData;
  projectId?: number;
}

interface GlassCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

const GlassCard = ({ title, children, icon: Icon }: GlassCardProps) => (
  <Card className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-amber-500/25 transition-all duration-300 rounded-3xl shadow-xl overflow-hidden backdrop-blur-md">
    <CardHeader className="border-b border-slate-200 dark:border-slate-800/40 pb-4">
      <CardTitle className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6 space-y-6">
      {children}
    </CardContent>
  </Card>
);

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  register?: UseFormRegisterReturn;
}

const FormInput = ({ label, id, error, register, type = "text", placeholder, ...props }: FormInputProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      className="h-12 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all w-full px-4"
      {...register}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
  register?: UseFormRegisterReturn;
}

const FormTextarea = ({ label, id, error, register, rows = 4, placeholder, ...props }: FormTextareaProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
      {label}
    </Label>
    <textarea
      id={id}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050816]/60 text-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-500 transition-all resize-none"
      {...register}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

interface FormSelectProps {
  label: string;
  name: 'status' | 'projectType' | 'featured';
  control: Control<ProjectFormValues>;
  options: (string | { label: string; value: string | boolean })[];
  placeholder?: string;
  error?: string;
}

const FormSelect = ({ label, name, control, options, placeholder, error }: FormSelectProps) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
      {label}
    </Label>
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={field.value !== undefined ? String(field.value) : ""}
          onValueChange={(val) => {
            if (val === 'true') field.onChange(true);
            else if (val === 'false') field.onChange(false);
            else field.onChange(val);
          }}
        >
          <SelectTrigger className="h-12 bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all w-full px-4 flex items-center justify-between">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl shadow-2xl p-1">
            {options.map((opt) => {
              const optVal = typeof opt === 'string' ? opt : String(opt.value);
              const optLbl = typeof opt === 'string' ? opt.replace('_', ' ') : opt.label;
              return (
                <SelectItem
                  key={optVal}
                  value={optVal}
                  className="hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-slate-800 dark:text-white cursor-pointer rounded-lg px-3 py-2 transition-colors"
                >
                  {optLbl}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export function ProjectForm({ defaultValues, projectId }: ProjectFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema) as Resolver<ProjectFormValues>,
    defaultValues: {
      status: 'UPCOMING',
      featured: false,
    },
  });

  const thumbnailUrl = watch('thumbnailUrl');

  useEffect(() => {
    if (defaultValues) {
      // Parse description metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = defaultValues as any;
      const { description, metadata } = parseProjectDescription(raw.description as string | undefined);
      reset({
        title: raw.title || '',
        descriptionText: description,
        shortDescription: raw.shortDescription || '',
        location: raw.location || '',
        status: raw.status || 'UPCOMING',
        completionYear: raw.completionYear ? String(raw.completionYear) : '',
        totalUnits: raw.totalUnits || 0,
        thumbnailUrl: raw.thumbnailUrl || '',
        metaTitle: raw.metaTitle || '',
        metaDescription: raw.metaDescription || '',
        featured: !!raw.featured,
        
        // Metadata fields
        budget: metadata.budget || null,
        possessionDate: metadata.possessionDate || '',
        launchDate: metadata.launchDate || '',
        availableUnits: metadata.availableUnits || null,
        soldUnits: metadata.soldUnits || null,
        galleryUrls: metadata.gallery?.join(', ') || '',
        amenitiesList: metadata.amenities?.join(', ') || '',
        masterPlanUrl: metadata.masterPlanUrl || '',
        brochureUrl: metadata.brochureUrl || '',
        reraNumber: metadata.reraNumber || '',
        developerName: metadata.developerName || '',
        projectType: metadata.projectType || '',
        latitude: metadata.latitude || null,
        longitude: metadata.longitude || null,
        progressPercent: metadata.progressPercent || 0,
        constructionStage: metadata.constructionStage || '',
        completionTimeline: metadata.completionTimeline || '',
        investmentRating: metadata.investmentRating || '',
        highlightsList: metadata.highlights?.join(', ') || '',
        landmarksList: metadata.landmarks?.join(', ') || '',
        connectivity: metadata.connectivity || '',
        healthScore: metadata.healthScore || 100,
      });
    }
  }, [defaultValues, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Package metadata
      const metadata: ProjectMetadata = {
        budget: data.budget ?? undefined,
        possessionDate: data.possessionDate,
        launchDate: data.launchDate,
        availableUnits: data.availableUnits ?? undefined,
        soldUnits: data.soldUnits ?? undefined,
        gallery: data.galleryUrls ? data.galleryUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
        amenities: data.amenitiesList ? data.amenitiesList.split(',').map(s => s.trim()).filter(Boolean) : [],
        masterPlanUrl: data.masterPlanUrl,
        brochureUrl: data.brochureUrl,
        reraNumber: data.reraNumber,
        developerName: data.developerName,
        projectType: data.projectType,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        progressPercent: data.progressPercent ?? undefined,
        constructionStage: data.constructionStage,
        completionTimeline: data.completionTimeline,
        investmentRating: data.investmentRating,
        highlights: data.highlightsList ? data.highlightsList.split(',').map(s => s.trim()).filter(Boolean) : [],
        landmarks: data.landmarksList ? data.landmarksList.split(',').map(s => s.trim()).filter(Boolean) : [],
        connectivity: data.connectivity,
        healthScore: data.healthScore ?? undefined,
      };

      // Serialize into description field
      const serializedDescription = serializeProjectDescription(data.descriptionText, metadata);

      const payload = {
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: serializedDescription,
        shortDescription: data.shortDescription || '',
        location: data.location || '',
        status: data.status || 'UPCOMING',
        completionYear: data.completionYear || '',
        totalUnits: data.totalUnits || 0,
        thumbnailUrl: data.thumbnailUrl || '',
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        featured: !!data.featured,
      };

      const response = projectId
        ? await api.put(`/projects/${projectId}`, payload)
        : await api.post('/projects', payload);

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/dashboard/projects');
    },

    onError: (error: unknown) => {
      console.error(error);
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-transparent text-slate-900 dark:text-white p-6 md:p-8 space-y-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <Link
            href="/dashboard/projects"
            className="group inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-amber-600 dark:from-white dark:via-slate-100 dark:to-amber-400">
            {projectId ? 'Edit Real Estate Project' : 'New Real Estate Project'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {projectId ? 'Update visual assets, timeline milestones, and parameters of the development' : 'Publish a new luxury portfolio development'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/projects">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-amber-500 text-black hover:bg-amber-400 font-semibold px-6 shadow-lg shadow-amber-500/10 flex items-center gap-2 rounded-xl"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {projectId ? 'Save Changes' : 'Create Project'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <GlassCard title="Basic Information" icon={Info}>
            <FormInput
              label="Project Title *"
              id="title"
              placeholder="e.g. Ashvayana Pavilions"
              register={register('title')}
              error={errors.title?.message}
            />

            <FormTextarea
              label="Short Description"
              id="shortDescription"
              placeholder="Provide an eye-catching summary of the development..."
              rows={2}
              register={register('shortDescription')}
              error={errors.shortDescription?.message}
            />
            
            <FormTextarea
              label="Description *"
              id="descriptionText"
              placeholder="Describe details, structural framework, visual elements..."
              rows={5}
              register={register('descriptionText')}
              error={errors.descriptionText?.message}
            />
          </GlassCard>

          <GlassCard title="Location & Map Settings" icon={MapPin}>
            <FormInput
              label="Location"
              id="location"
              placeholder="e.g. Bandra East, Mumbai"
              register={register('location')}
              error={errors.location?.message}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Latitude"
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g. 19.0544"
                register={register('latitude')}
                error={errors.latitude?.message}
              />
              <FormInput
                label="Longitude"
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g. 72.8402"
                register={register('longitude')}
                error={errors.longitude?.message}
              />
            </div>
          </GlassCard>

          <GlassCard title="Specifications & Timeline" icon={LayoutGrid}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Total Units"
                id="totalUnits"
                type="number"
                placeholder="e.g. 150"
                register={register('totalUnits')}
                error={errors.totalUnits?.message}
              />
              <FormInput
                label="Available Units"
                id="availableUnits"
                type="number"
                placeholder="e.g. 90"
                register={register('availableUnits')}
                error={errors.availableUnits?.message}
              />
              <FormInput
                label="Sold Units"
                id="soldUnits"
                type="number"
                placeholder="e.g. 60"
                register={register('soldUnits')}
                error={errors.soldUnits?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Launch Date"
                id="launchDate"
                type="date"
                register={register('launchDate')}
                error={errors.launchDate?.message}
              />
              <FormInput
                label="Possession Date"
                id="possessionDate"
                type="date"
                register={register('possessionDate')}
                error={errors.possessionDate?.message}
              />
              <FormInput
                label="Completion Year"
                id="completionYear"
                placeholder="e.g. 2027"
                register={register('completionYear')}
                error={errors.completionYear?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Progress Percentage (%)"
                id="progressPercent"
                type="number"
                placeholder="e.g. 45"
                register={register('progressPercent')}
                error={errors.progressPercent?.message}
              />
              <FormInput
                label="Construction Stage"
                id="constructionStage"
                placeholder="e.g. Excavation / Plinth"
                register={register('constructionStage')}
                error={errors.constructionStage?.message}
              />
              <FormInput
                label="Completion Timeline"
                id="completionTimeline"
                placeholder="e.g. Q4 2027"
                register={register('completionTimeline')}
                error={errors.completionTimeline?.message}
              />
            </div>
          </GlassCard>

          <GlassCard title="Financials & Highlights" icon={Award}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Budget (₹)"
                id="budget"
                type="number"
                placeholder="e.g. 750000000"
                register={register('budget')}
                error={errors.budget?.message}
              />
              <FormInput
                label="Developer Name"
                id="developerName"
                placeholder="e.g. Ashvayana Homes"
                register={register('developerName')}
                error={errors.developerName?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="RERA Number"
                id="reraNumber"
                placeholder="e.g. P51800012345"
                register={register('reraNumber')}
                error={errors.reraNumber?.message}
              />
              <FormInput
                label="Investment Rating"
                id="investmentRating"
                placeholder="e.g. AAA+ / High Yield"
                register={register('investmentRating')}
                error={errors.investmentRating?.message}
              />
            </div>

            <FormInput
              label="Project Health Score (0-100)"
              id="healthScore"
              type="number"
              placeholder="e.g. 95"
              register={register('healthScore')}
              error={errors.healthScore?.message}
            />
          </GlassCard>

          <GlassCard title="Marketing Highlights, Landmarks & Amenities" icon={Sparkles}>
            <FormTextarea
              label="Highlights (Comma Separated)"
              id="highlightsList"
              placeholder="e.g. Sea View, Private Elevators, Italian Marble, Helipad"
              rows={2}
              register={register('highlightsList')}
              error={errors.highlightsList?.message}
            />

            <FormTextarea
              label="Nearby Landmarks (Comma Separated)"
              id="landmarksList"
              placeholder="e.g. International Airport - 15 mins, Grand Hyatt - 5 mins"
              rows={2}
              register={register('landmarksList')}
              error={errors.landmarksList?.message}
            />

            <FormInput
              label="Connectivity Info"
              id="connectivity"
              placeholder="e.g. Direct access to Western Express Highway"
              register={register('connectivity')}
              error={errors.connectivity?.message}
            />

            <FormTextarea
              label="Project Amenities (Comma Separated)"
              id="amenitiesList"
              placeholder="e.g. Infinity Pool, Clubhouse, Private Gym, Spa, 24/7 Concierge"
              rows={2}
              register={register('amenitiesList')}
              error={errors.amenitiesList?.message}
            />
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <GlassCard title="Status & Visibility">
            <FormSelect
              label="Project Status"
              name="status"
              control={control}
              placeholder="Select status"
              options={['UPCOMING', 'ONGOING', 'COMPLETED']}
              error={errors.status?.message}
            />
            <FormSelect
              label="Project Type"
              name="projectType"
              control={control}
              placeholder="Select project type"
              options={['RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'TOWNSHIP', 'INDUSTRIAL']}
              error={errors.projectType?.message}
            />
            <FormSelect
              label="Featured Project"
              name="featured"
              control={control}
              placeholder="Is Featured?"
              options={[
                { label: 'Yes (Featured)', value: 'true' },
                { label: 'No (Regular)', value: 'false' },
              ]}
              error={errors.featured?.message}
            />
          </GlassCard>

          <GlassCard title="Assets & Documents" icon={FileText}>
            <FileUpload
              value={thumbnailUrl}
              onUpload={(url) => setValue('thumbnailUrl', url, { shouldDirty: true })}
            />

            <FormInput
              label="Brochure PDF URL"
              id="brochureUrl"
              placeholder="Paste Brochure PDF link"
              register={register('brochureUrl')}
              error={errors.brochureUrl?.message}
            />

            <FormInput
              label="Master Plan PDF URL"
              id="masterPlanUrl"
              placeholder="Paste Master Plan PDF link"
              register={register('masterPlanUrl')}
              error={errors.masterPlanUrl?.message}
            />

            <FormTextarea
              label="Gallery Image URLs (Comma Separated)"
              id="galleryUrls"
              placeholder="Paste image URLs separated by commas..."
              rows={3}
              register={register('galleryUrls')}
              error={errors.galleryUrls?.message}
            />
          </GlassCard>

          <GlassCard title="SEO Settings" icon={Sparkles}>
            <FormInput
              label="Meta Title"
              id="metaTitle"
              placeholder="e.g. Ashvayana Pavilions | Luxury Residences"
              register={register('metaTitle')}
              error={errors.metaTitle?.message}
            />
            <FormTextarea
              label="Meta Description"
              id="metaDescription"
              placeholder="Search engine optimized description text..."
              rows={3}
              register={register('metaDescription')}
              error={errors.metaDescription?.message}
            />
          </GlassCard>
        </div>
      </div>
    </form>
  );
}
