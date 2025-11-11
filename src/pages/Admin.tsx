import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/Header';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminContentModeration from '@/components/admin/AdminContentModeration';

const Admin = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useAdminCheck();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-foreground-secondary mb-8">
            Manage users, content, and platform statistics
          </p>

          <Tabs defaultValue="dashboard" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="content">Content Moderation</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>

            <TabsContent value="content">
              <AdminContentModeration />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
