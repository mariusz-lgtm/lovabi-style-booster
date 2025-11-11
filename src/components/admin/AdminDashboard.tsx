import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Users, Image, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersResult, generationsResult, modelsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('generation_history').select('id', { count: 'exact', head: true }),
        supabase.from('user_models').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalGenerations: generationsResult.count || 0,
        totalCustomModels: modelsResult.count || 0,
      };
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generation_history')
        .select('id, created_at, user_id, model_used, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Total Users</p>
              <p className="text-3xl font-bold text-foreground">{stats?.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Image className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Total Generations</p>
              <p className="text-3xl font-bold text-foreground">{stats?.totalGenerations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Custom Models</p>
              <p className="text-3xl font-bold text-foreground">{stats?.totalCustomModels}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity?.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div>
                <p className="text-sm text-foreground">
                  {(activity.profiles as any)?.email || 'Unknown user'}
                </p>
                <p className="text-xs text-foreground-secondary">
                  Generated with {activity.model_used}
                </p>
              </div>
              <p className="text-xs text-foreground-secondary">
                {new Date(activity.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
