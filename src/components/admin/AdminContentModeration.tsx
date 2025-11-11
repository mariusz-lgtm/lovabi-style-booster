import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const AdminContentModeration = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: generations, isLoading, refetch } = useQuery({
    queryKey: ['admin-generations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generation_history')
        .select('id, created_at, user_id, model_used, style_used, output_image_path, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get signed URLs for images
      const generationsWithUrls = await Promise.all(
        data.map(async (gen) => {
          if (gen.output_image_path) {
            const { data: signedUrl } = await supabase.storage
              .from('generated-images')
              .createSignedUrl(gen.output_image_path, 3600);
            return { ...gen, imageUrl: signedUrl?.signedUrl };
          }
          return { ...gen, imageUrl: null };
        })
      );

      return generationsWithUrls;
    },
  });

  const handleDeleteGeneration = async () => {
    if (!selectedGenerationId) return;

    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'delete-generation',
          generationId: selectedGenerationId,
        },
      });

      if (error) throw error;

      toast.success('Generation deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedGenerationId(null);
      refetch();
    } catch (error: any) {
      console.error('Error deleting generation:', error);
      toast.error(error.message || 'Failed to delete generation');
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
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Recent Generations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generations?.map((gen) => (
            <Card key={gen.id} className="overflow-hidden">
              {gen.imageUrl && (
                <div className="relative aspect-square bg-muted">
                  <img
                    src={gen.imageUrl}
                    alt="Generated"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImage(gen.imageUrl)}
                  />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{gen.model_used}</Badge>
                  {gen.style_used && (
                    <Badge variant="outline">{gen.style_used}</Badge>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-foreground-secondary">
                    {(gen.profiles as any)?.email || 'Unknown user'}
                  </p>
                  <p className="text-xs text-foreground-secondary">
                    {new Date(gen.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setSelectedGenerationId(gen.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Generation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this generation from the database and storage.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGeneration}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewImage && (
        <AlertDialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Image Preview</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="max-h-[70vh] overflow-auto">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default AdminContentModeration;
