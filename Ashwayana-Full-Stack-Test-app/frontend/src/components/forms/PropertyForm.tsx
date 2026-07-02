'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { UseFormRegisterReturn, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { 
  parsePropertyDescription, 
  serializePropertyDescription, 
  getProjectIdFromKeywords, 
  setProjectIdInKeywords 
} from '@/lib/metadata';
import type { PropertyMetadata } from '@/lib/metadata';

const propertyFormSchema = z.object({
  title: z.string().min(1, 'Property title is required'),
  descriptionText: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  priceLabel: z.string().optional(),
  type: z.string().min(1, 'Property type is required'),
  status: z.string().min(1, 'Property status is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  bedrooms: z.coerce.number().optional().nullable(),
  bathrooms: z.coerce.number().optional().nullable(),
  area: z.coerce.number().optional().nullable(),
  areaUnit: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
  videoUrl: z.string().optional(),
  featured: z.boolean().optional(),
  
  // Project Association ID
  associatedProjectId: z.coerce.number().optional().nullable(),
  
  // Premium metadata fields
  virtualTourUrl: z.string().optional(),
  floorPlanUrl: z.string().optional(),
  propertyCode: z.string().optional(),
  furnishingStatus: z.string().optional(),
  facingDirection: z.string().optional(),
  possessionStatus: z.string().optional(),
  propertyAge: z.coerce.number().optional().nullable(),
  investmentScore: z.coerce.number().min(0).max(100).optional().nullable(),
  rentalYield: z.coerce.number().optional().nullable(),
  
  // Native fields
  floor: z.coerce.number().optional().nullable(),
  totalFloors: z.coerce.number().optional().nullable(),
  parkingSpaces: z.coerce.number().optional().nullable(),
  galleryUrls: z.string().optional(), // Comma separated list of images
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface RawPropertyData {
  [key: string]: unknown;
}

interface PropertyFormProps {
  defaultValues?: RawPropertyData;
  propertyId?: number;
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
  name: 'type' | 'status' | 'associatedProjectId' | 'featured' | 'furnishingStatus';
  control: Control<PropertyFormValues>;
  options: (string | { label: string; value: string | number | boolean })[];
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
          value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
          onValueChange={(val) => {
            if (val === 'true') field.onChange(true);
            else if (val === 'false') field.onChange(false);
            else if (val === 'null') field.onChange(null);
            else if (!isNaN(Number(val)) && name === 'associatedProjectId') field.onChange(Number(val));
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

export function PropertyForm({ defaultValues, propertyId }: PropertyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Load Projects for Association Select
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?size=100');
      return res.data?.data?.content || res.data?.data || [];
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema) as Resolver<PropertyFormValues>,
    defaultValues: {
      featured: false,
    },
  });

  const thumbnailUrl = watch('thumbnailUrl');

  useEffect(() => {
    if (defaultValues) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = defaultValues as any;
      const { description, metadata } = parsePropertyDescription(raw.description as string | undefined);
      const associatedProjId = getProjectIdFromKeywords(raw.keywords as string | undefined);

      reset({
        title: raw.title || '',
        descriptionText: description,
        price: raw.price || 0,
        priceLabel: raw.priceLabel || '',
        type: raw.type || '',
        status: raw.status || '',
        address: raw.address || '',
        city: raw.city || '',
        state: raw.state || '',
        pincode: raw.pincode || '',
        bedrooms: raw.bedrooms || null,
        bathrooms: raw.bathrooms || null,
        area: raw.area || null,
        areaUnit: raw.areaUnit || 'sq.ft',
        thumbnailUrl: raw.thumbnailUrl || '',
        metaTitle: raw.metaTitle || '',
        metaDescription: raw.metaDescription || '',
        keywords: raw.keywords || '',
        videoUrl: raw.videoUrl || '',
        featured: !!raw.featured,
        
        associatedProjectId: associatedProjId,
        floor: raw.floor || null,
        totalFloors: raw.totalFloors || null,
        parkingSpaces: raw.parkingSpaces || null,
        galleryUrls: (raw.imageUrls as string[] | undefined)?.join(', ') || '',
        
        virtualTourUrl: metadata.virtualTourUrl || '',
        floorPlanUrl: metadata.floorPlanUrl || '',
        propertyCode: metadata.propertyCode || '',
        furnishingStatus: metadata.furnishingStatus || 'UNFURNISHED',
        facingDirection: metadata.facingDirection || '',
        possessionStatus: metadata.possessionStatus || '',
        propertyAge: metadata.propertyAge || null,
        investmentScore: metadata.investmentScore || 80,
        rentalYield: metadata.rentalYield || null,
      });
    }
  }, [defaultValues, reset]);

  const mutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      // Package metadata
      const metadata: PropertyMetadata = {
        virtualTourUrl: data.virtualTourUrl,
        floorPlanUrl: data.floorPlanUrl,
        propertyCode: data.propertyCode,
        furnishingStatus: data.furnishingStatus,
        facingDirection: data.facingDirection,
        possessionStatus: data.possessionStatus,
        propertyAge: data.propertyAge ?? undefined,
        investmentScore: data.investmentScore ?? undefined,
        rentalYield: data.rentalYield ?? undefined,
      };

      // Serialize into description field
      const serializedDescription = serializePropertyDescription(data.descriptionText, metadata);

      // Associate Project ID inside keywords
      const finalKeywords = setProjectIdInKeywords(data.keywords || '', data.associatedProjectId || undefined);

      const payload = {
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: serializedDescription,
        price: data.price,
        priceLabel: data.priceLabel || '',
        type: data.type,
        status: data.status,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        bedrooms: data.bedrooms || null,
        bathrooms: data.bathrooms || null,
        area: data.area || null,
        areaUnit: data.areaUnit || 'sq.ft',
        thumbnailUrl: data.thumbnailUrl || '',
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        keywords: finalKeywords,
        videoUrl: data.videoUrl || '',
        featured: !!data.featured,
        
        floor: data.floor || null,
        totalFloors: data.totalFloors || null,
        parkingSpaces: data.parkingSpaces || null,
        imageUrls: data.galleryUrls ? data.galleryUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      const response = propertyId
        ? await api.put(`/properties/${propertyId}`, payload)
        : await api.post('/properties', payload);

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      router.push('/dashboard/properties');
    },

    onError: (error: unknown) => {
      console.error(error);
    },
  });

  const onSubmit = (data: PropertyFormValues) => {
    mutation.mutate(data);
  };

  const projectOptions = [
    { label: 'None / General Listing', value: 'null' },
    ...projects.map((p: { id: number; title: string }) => ({
      label: p.title,
      value: p.id,
    }))
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-transparent text-slate-900 dark:text-white p-6 md:p-8 space-y-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <Link
            href="/dashboard/properties"
            className="group inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Properties
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-amber-600 dark:from-white dark:via-slate-100 dark:to-amber-400">
            {propertyId ? 'Edit Property Unit' : 'New Property Unit'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {propertyId ? 'Modify structural elements, association bounds, and price valuation' : 'Publish a new luxury property listing in the inventory'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/properties">
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
                {propertyId ? 'Save Changes' : 'Create Property'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <GlassCard title="Basic Unit Information" icon={Info}>
            <FormInput
              label="Property Title *"
              id="title"
              placeholder="e.g. Penthouse 502, Wing B"
              register={register('title')}
              error={errors.title?.message}
            />

            <FormTextarea
              label="Property Description *"
              id="descriptionText"
              placeholder="Describe the unit layout, furnishing items, view, pricing flexibility..."
              rows={4}
              register={register('descriptionText')}
              error={errors.descriptionText?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Price (₹) *"
                id="price"
                type="number"
                placeholder="e.g. 12500000"
                register={register('price')}
                error={errors.price?.message}
              />
              <FormInput
                label="Price Label (e.g. Cr Onwards)"
                id="priceLabel"
                placeholder="e.g. onwards"
                register={register('priceLabel')}
                error={errors.priceLabel?.message}
              />
            </div>
          </GlassCard>

          <GlassCard title="Project Association & Specifications" icon={LayoutGrid}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect
                label="Associated Project"
                name="associatedProjectId"
                control={control}
                placeholder="Choose parent project..."
                options={projectOptions}
                error={errors.associatedProjectId?.message}
              />
              <FormInput
                label="Property Code / ID"
                id="propertyCode"
                placeholder="e.g. PENT-AV-502"
                register={register('propertyCode')}
                error={errors.propertyCode?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Bedrooms"
                id="bedrooms"
                type="number"
                placeholder="e.g. 3"
                register={register('bedrooms')}
                error={errors.bedrooms?.message}
              />
              <FormInput
                label="Bathrooms"
                id="bathrooms"
                type="number"
                placeholder="e.g. 3"
                register={register('bathrooms')}
                error={errors.bathrooms?.message}
              />
              <FormInput
                label="Parking Slots"
                id="parkingSpaces"
                type="number"
                placeholder="e.g. 2"
                register={register('parkingSpaces')}
                error={errors.parkingSpaces?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Floor Number"
                id="floor"
                type="number"
                placeholder="e.g. 5"
                register={register('floor')}
                error={errors.floor?.message}
              />
              <FormInput
                label="Total Floors"
                id="totalFloors"
                type="number"
                placeholder="e.g. 25"
                register={register('totalFloors')}
                error={errors.totalFloors?.message}
              />
              <FormSelect
                label="Furnishing Status"
                name="furnishingStatus"
                control={control}
                placeholder="Select status..."
                options={['FULLY_FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']}
                error={errors.furnishingStatus?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Area Size"
                id="area"
                type="number"
                placeholder="e.g. 2500"
                register={register('area')}
                error={errors.area?.message}
              />
              <FormInput
                label="Area Unit"
                id="areaUnit"
                placeholder="e.g. sq.ft"
                register={register('areaUnit')}
                error={errors.areaUnit?.message}
              />
              <FormInput
                label="Facing Direction"
                id="facingDirection"
                placeholder="e.g. East Facing"
                register={register('facingDirection')}
                error={errors.facingDirection?.message}
              />
            </div>
          </GlassCard>

          <GlassCard title="Location Settings" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Address"
                id="address"
                placeholder="Street Address"
                register={register('address')}
                error={errors.address?.message}
              />
              <FormInput
                label="City"
                id="city"
                placeholder="e.g. Mumbai"
                register={register('city')}
                error={errors.city?.message}
              />
              <FormInput
                label="State"
                id="state"
                placeholder="e.g. Maharashtra"
                register={register('state')}
                error={errors.state?.message}
              />
              <FormInput
                label="Pincode"
                id="pincode"
                placeholder="e.g. 400051"
                register={register('pincode')}
                error={errors.pincode?.message}
              />
            </div>
          </GlassCard>

          <GlassCard title="Investment Metrics & Lifespan" icon={Award}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Property Age (Years)"
                id="propertyAge"
                type="number"
                placeholder="e.g. 1"
                register={register('propertyAge')}
                error={errors.propertyAge?.message}
              />
              <FormInput
                label="Investment Score (0-100)"
                id="investmentScore"
                type="number"
                placeholder="e.g. 88"
                register={register('investmentScore')}
                error={errors.investmentScore?.message}
              />
              <FormInput
                label="Rental Yield (%)"
                id="rentalYield"
                type="number"
                step="any"
                placeholder="e.g. 4.5"
                register={register('rentalYield')}
                error={errors.rentalYield?.message}
              />
            </div>
            <FormInput
              label="Possession Status"
              id="possessionStatus"
              placeholder="e.g. Ready to Move / Dec 2026"
              register={register('possessionStatus')}
              error={errors.possessionStatus?.message}
            />
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <GlassCard title="Status & Type">
            <FormSelect
              label="Property Type"
              name="type"
              control={control}
              placeholder="Select type"
              options={['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'PENTHOUSE', 'DUPLEX', 'STUDIO']}
              error={errors.type?.message}
            />
            <FormSelect
              label="Property Status"
              name="status"
              control={control}
              placeholder="Select status"
              options={['UPCOMING', 'ONGOING', 'COMPLETED', 'SOLD_OUT']}
              error={errors.status?.message}
            />
            <FormSelect
              label="Featured Property"
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

          <GlassCard title="Media & Document Assets" icon={FileText}>
            <FileUpload
              value={thumbnailUrl}
              onUpload={(url) => setValue('thumbnailUrl', url, { shouldDirty: true })}
            />

            <FormInput
              label="Virtual Tour / 3D URL"
              id="virtualTourUrl"
              placeholder="Paste Virtual Tour link"
              register={register('virtualTourUrl')}
              error={errors.virtualTourUrl?.message}
            />

            <FormInput
              label="Video tour URL"
              id="videoUrl"
              placeholder="Paste YouTube / Vimeo tour link"
              register={register('videoUrl')}
              error={errors.videoUrl?.message}
            />

            <FormInput
              label="Floor Plan Image URL"
              id="floorPlanUrl"
              placeholder="Paste Floor Plan Image URL"
              register={register('floorPlanUrl')}
              error={errors.floorPlanUrl?.message}
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
              placeholder="Search engine optimized title"
              register={register('metaTitle')}
              error={errors.metaTitle?.message}
            />
            <FormTextarea
              label="Meta Description"
              id="metaDescription"
              placeholder="Search engine snippet description..."
              rows={3}
              register={register('metaDescription')}
              error={errors.metaDescription?.message}
            />
            <FormInput
              label="Keywords (SEO)"
              id="keywords"
              placeholder="e.g. luxury, penthouse, Sea View"
              register={register('keywords')}
              error={errors.keywords?.message}
            />
          </GlassCard>
        </div>
      </div>
    </form>
  );
}
