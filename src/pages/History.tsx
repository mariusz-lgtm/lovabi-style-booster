import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ImagePlus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";

const History = () => {
  const { user } = useAuth();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['generation-history'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('generation_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const { data: customModels = [] } = useQuery({
    queryKey: ['custom-models-names'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_models')
        .select('id, name')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const getModelDisplayName = (modelUsed: string): string => {
    if (modelUsed === 'enhance') return 'Enhance';
    if (modelUsed === 'emma') return 'Emma';
    if (modelUsed === 'sofia') return 'Sofia';
    if (modelUsed === 'maya') return 'Maya';
    
    const customModel = customModels.find((m: any) => m.id === modelUsed);
    return customModel?.name || 'Custom Model';
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "d MMM yyyy, HH:mm");
  };

  const formatBackground = (bg: string): string => {
    const map: Record<string, string> = {
      'white': 'White',
      'outdoor': 'Outdoor',
      'studio-grey': 'Studio Grey',
      'home-interior': 'Home Interior'
    };
    return map[bg] || bg;
  };

  const handleDownload = (imagePath: string, historyId: string) => {
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(imagePath);
    
    const a = document.createElement('a');
    a.href = urlData.publicUrl;
    a.download = `lovabi-${historyId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download started",
      description: "Your image is being downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Generation History
          </h1>
          <p className="text-foreground-secondary">
            View and download all your AI-generated photos
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-9 w-full bg-muted animate-pulse rounded" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ImagePlus className="w-16 h-16 text-foreground-secondary/50 mb-4" />
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
              No generations yet
            </h3>
            <p className="text-foreground-secondary mb-6 max-w-md">
              Start by enhancing your first photo or trying virtual try-on with your items.
            </p>
            <Link to="/enhance">
              <Button>
                <ImagePlus className="w-4 h-4 mr-2" />
                Start Creating
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item: any) => {
              const imageUrl = supabase.storage
                .from('generated-images')
                .getPublicUrl(item.output_image_path).data.publicUrl;

              return (
                <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {getModelDisplayName(item.model_used)}
                      </Badge>
                      {item.style_used !== 'enhance' && (
                        <Badge variant="outline">
                          {item.style_used === 'studio' ? 'Studio' : 'Selfie'}
                        </Badge>
                      )}
                      {item.background_used && (
                        <Badge variant="outline" className="text-primary">
                          {formatBackground(item.background_used)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-foreground-secondary space-y-1">
                      <p>{formatDate(item.created_at)}</p>
                      {item.generation_time_ms && (
                        <p>Generated in {(item.generation_time_ms / 1000).toFixed(1)}s</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownload(item.output_image_path, item.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
