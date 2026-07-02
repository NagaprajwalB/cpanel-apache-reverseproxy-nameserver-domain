'use client';

import { use } from 'react';
import { useProject } from '@/hooks/useProjects';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { Loader2 } from 'lucide-react';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-800 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  return <ProjectForm projectId={Number(id)} defaultValues={project as Record<string, unknown> | undefined} />;
}
