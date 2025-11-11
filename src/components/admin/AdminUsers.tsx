import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Ban, ShieldCheck, Search } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, country, created_at, is_banned, banned_at, banned_reason')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleBanUser = async () => {
    if (!selectedUserId || !banReason.trim()) {
      toast.error('Please provide a reason for banning');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'ban-user',
          userId: selectedUserId,
          reason: banReason,
        },
      });

      if (error) throw error;

      toast.success('User banned successfully');
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUserId(null);
      refetch();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error(error.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'unban-user',
          userId,
        },
      });

      if (error) throw error;

      toast.success('User unbanned successfully');
      refetch();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast.error(error.message || 'Failed to unban user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.full_name || '-'}</TableCell>
                <TableCell>{user.country || '-'}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.is_banned ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.is_banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setBanDialogOpen(true);
                        }}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ban
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the user from accessing the platform. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for banning..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser}>Ban User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
