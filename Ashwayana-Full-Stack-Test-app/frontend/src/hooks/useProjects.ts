import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Project {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  location?: string;
  status?: string;
  thumbnailUrl?: string;
  completionYear?: number;
  totalUnits?: number;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?size=100');
      return (res.data?.data?.content || []) as Project[];
    },
  });
}

export function useProject(id: number | string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/projects/${id}`);
      return res.data?.data as Project;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await api.post('/projects', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await api.put(`/projects/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const res = await api.delete(`/projects/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
