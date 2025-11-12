import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminUserTransactionsProps {
  userId: string | null;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminUserTransactions = ({ userId, userEmail, open, onOpenChange }: AdminUserTransactionsProps) => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['admin-user-transactions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Credit Transactions - {userEmail}</DialogTitle>
          <DialogDescription>
            Complete transaction history for this user
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-center text-foreground-secondary py-8">
            No transactions found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {transaction.reason}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={transaction.delta > 0 ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      {transaction.delta > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {transaction.delta > 0 ? '+' : ''}{transaction.delta}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {transaction.balance_after}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserTransactions;
