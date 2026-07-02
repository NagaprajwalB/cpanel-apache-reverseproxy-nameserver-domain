'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import * as z from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
});
type FormValues = z.infer<typeof schema>;

function UserDialog({ defaultValues, userId, onClose }: {
  defaultValues?: Partial<FormValues>; userId?: number; onClose: () => void
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = userId ? { name: data.name, role: data.role } : data;
      return userId ? api.put(`/users/${userId}`, payload) : api.post('/users', data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); onClose(); },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label>Full Name *</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Email *</Label>
        <Input type="email" {...register('email')} disabled={!!userId} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      {!userId && (
        <div className="space-y-1">
          <Label>Password *</Label>
          <Input type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
      )}
      <div className="space-y-1">
        <Label>Role *</Label>
        <Select
          onValueChange={(v) => setValue('role', v as string)}
          defaultValue={defaultValues?.role || undefined}
        >
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : userId ? 'Update User' : 'Create User'}
      </Button>
      {mutation.isError && <p className="text-xs text-red-500 text-center">Error saving user. Check if email is already taken.</p>}
    </form>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data as User[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'SUPER_ADMIN' ? 'default' : 'outline'}>
          {row.original.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: ({ row }) => row.original.active
        ? <Check className="h-4 w-4 text-green-500" />
        : <X className="h-4 w-4 text-red-500" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isSelf = currentUser?.id === row.original.id;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { setEditing(row.original); setOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-red-500" disabled={isSelf} />}>
                <Trash2 className="h-4 w-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{row.original.name}&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(row.original.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger render={<Button onClick={() => setEditing(null)} />}>
            <Plus className="mr-2 h-4 w-4" />Add User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit User' : 'New User'}</DialogTitle>
            </DialogHeader>
            <UserDialog
              defaultValues={editing ? { name: editing.name, email: editing.email, role: editing.role } : undefined}
              userId={editing?.id}
              onClose={() => { setOpen(false); setEditing(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <div className="text-center py-10">Loading...</div> : <DataTable columns={columns} data={data ?? []} />}
    </div>
  );
}
