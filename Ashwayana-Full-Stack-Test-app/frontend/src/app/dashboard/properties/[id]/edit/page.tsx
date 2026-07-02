'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PropertyForm } from '@/components/forms/PropertyForm';
import { Loader2 } from 'lucide-react';

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const res = await api.get(`/properties/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-800 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading property details...</p>
        </div>
      </div>
    );
  }

  return <PropertyForm propertyId={Number(id)} defaultValues={property} />;
}
