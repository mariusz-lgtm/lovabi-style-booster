import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CreditTransactionsSection = () => {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['credit-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Transactions</CardTitle>
          <CardDescription>Your credit usage history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Transactions</CardTitle>
        <CardDescription>
          Complete history of your credit changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <p className="text-center text-foreground-secondary py-8">
            No transactions yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
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
      </CardContent>
    </Card>
  );
};

export default CreditTransactionsSection;
