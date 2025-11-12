import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CreditsDisplay = () => {
  const { user } = useAuth();

  const { data: credits, refetch } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        return 0;
      }

      return data?.credits ?? 0;
    },
    enabled: !!user,
  });

  if (!user || credits === null) return null;

  return (
    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
      <Coins className="h-4 w-4 text-primary" />
      <span className="font-semibold">{credits}</span>
      <span className="text-xs text-foreground-secondary">credits</span>
    </Badge>
  );
};

export default CreditsDisplay;
