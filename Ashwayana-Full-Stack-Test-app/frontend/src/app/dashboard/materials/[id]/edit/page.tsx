'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MaterialForm } from '@/components/forms/MaterialForm';
import { Loader2 } from 'lucide-react';

interface EditMaterialPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMaterialPage({ params }: EditMaterialPageProps) {
  const { id } = use(params);

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      const res = await api.get(`/materials/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-800 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading material details...</p>
        </div>
      </div>
    );
  }

  return <MaterialForm materialId={Number(id)} defaultValues={material || undefined} />;
}
