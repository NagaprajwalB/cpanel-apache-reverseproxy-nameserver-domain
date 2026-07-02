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
import { ArrowLeft, Loader2, Save, Info, LayoutGrid, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  defaultValues?: Partial<MaterialFormValues>;
  materialId?: number;
}

interface GlassCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

const GlassCard = ({ title, children, icon: Icon }: GlassCardProps) => (
  <Card className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-amber-500/10 hover:border-slate-300 dark:hover:border-amber-500/20 transition-all duration-300 rounded-3xl shadow-xl overflow-hidden backdrop-blur-md">
    <CardHeader className="border-b border-slate-100 dark:border-slate-800/40 pb-4">
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
      className="w-full bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-2.5 px-4 focus-visible:border-amber-500 dark:focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/30 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
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
      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050816]/60 text-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder-slate-400 dark:placeholder-slate-500 transition-all resize-none"
      {...register}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

interface FormSelectProps {
  label: string;
  name: 'active';
  control: Control<MaterialFormValues>;
  options: { label: string; value: string }[];
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
          onValueChange={(val) => field.onChange(val === 'true')}
        >
          <SelectTrigger className="w-full bg-slate-50 dark:bg-[#050816]/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl h-10 px-4 focus-visible:border-amber-500 dark:focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/30 transition-all flex items-center justify-between">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl shadow-2xl p-1">
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-slate-800 dark:text-white cursor-pointer rounded-lg px-3 py-2 transition-colors"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export function MaterialForm({ defaultValues, materialId }: MaterialFormProps) {
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
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema) as Resolver<MaterialFormValues>,
    defaultValues: {
      active: true,
      ...defaultValues,
    },
  });

  const imageUrl = watch('imageUrl');

  useEffect(() => {
    if (defaultValues) {
      reset({
        active: true,
        ...defaultValues,
      });
    }
  }, [defaultValues, reset]);

  const mutation = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      const response = materialId
        ? await api.put(`/materials/${materialId}`, data)
        : await api.post('/materials', data);

      return response.data;
    },

    onSuccess: () => {
      router.push('/dashboard/materials');
      queryClient.invalidateQueries({
        queryKey: ['materials'],
      });
    },

    onError: (error: unknown) => {
      console.error(error);
    },
  });

  const onSubmit = (data: MaterialFormValues) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-transparent text-slate-900 dark:text-white p-6 md:p-8 space-y-8 transition-colors duration-300">
      {/* Header section with back button and form buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-amber-500/10">
        <div>
          <Link
            href="/dashboard/materials"
            className="group inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Materials
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-amber-600 dark:from-white dark:via-slate-100 dark:to-amber-400">
            {materialId ? 'Edit Material' : 'New Material'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {materialId ? 'Modify technical specifications of building material' : 'Add a premium material specification'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/materials">
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
                {materialId ? 'Save Changes' : 'Create Material'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <GlassCard title="Material Specifications" icon={Info}>
            <FormInput
              label="Material Name *"
              id="name"
              placeholder="e.g. Italian Carrara Marble"
              register={register('name')}
              error={errors.name?.message}
            />
            
            <FormTextarea
              label="Description / Technical Details"
              id="description"
              placeholder="Describe origin, quality rating, sizing, structural strength, finish details..."
              register={register('description')}
              error={errors.description?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Category"
                id="category"
                placeholder="e.g. Flooring / Woodwork"
                register={register('category')}
                error={errors.category?.message}
              />
              <FormInput
                label="Brand / Source"
                id="brand"
                placeholder="e.g. Antolini / Marmi"
                register={register('brand')}
                error={errors.brand?.message}
              />
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <GlassCard title="Status & Visibility" icon={LayoutGrid}>
            <FormSelect
              label="Status"
              name="active"
              control={control}
              placeholder="Select status"
              options={[
                { label: 'Active (Visible)', value: 'true' },
                { label: 'Inactive (Hidden)', value: 'false' },
              ]}
              error={errors.active?.message}
            />
          </GlassCard>

          <GlassCard title="Material Texture / Preview">
            <FileUpload
              value={imageUrl}
              onUpload={(url) => setValue('imageUrl', url, { shouldDirty: true })}
            />
            {imageUrl ? (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium break-all flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl animate-fade-in">
                <span>✓ Active URL:</span>
                <span className="opacity-80 font-mono text-[10px]">{imageUrl}</span>
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-500 text-center">
                No image selected. Upload a file to preview texture.
              </p>
            )}
          </GlassCard>

          {/* Action/Save Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-amber-500/10 backdrop-blur-md space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Save Material</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Ensure all parameters are accurate. Once published, this material will be linked to the live design specifications.
            </p>
            {mutation.isError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Failed to save material:</p>
                  <p className="mt-1 opacity-90 break-words">
                    {mutation.error instanceof Error ? mutation.error.message : JSON.stringify(mutation.error)}
                  </p>
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold py-3 shadow-lg shadow-amber-500/10 rounded-xl flex items-center justify-center gap-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Progress...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {materialId ? 'Publish Changes' : 'Publish Material'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
