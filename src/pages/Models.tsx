import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import CustomModelCreator from "@/components/models/CustomModelCreator";
import ModelManagementList from "@/components/models/ModelManagementList";
import { toast } from "sonner";
import { CustomModel } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMigrateLocalStorage } from "@/hooks/useMigrateLocalStorage";

const Models = () => {
  const { user } = useAuth();
  useMigrateLocalStorage();
  
  const [models, setModels] = useState<CustomModel[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeModelId, setActiveModelId] = useState("");

  useEffect(() => {
    if (user) {
      fetchModels();
      fetchPreferences();
    }
  }, [user]);

  const fetchModels = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_models')
      .select(`
        *,
        model_photos (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
      return;
    }

    const customModels = data.map(model => ({
      id: model.id,
      name: model.name,
      photos: model.model_photos
        .sort((a: any, b: any) => a.photo_order - b.photo_order)
        .map((p: any) => {
          const { data: urlData } = supabase.storage
            .from('model-photos')
            .getPublicUrl(p.storage_path);
          return urlData.publicUrl;
        }),
      createdAt: model.created_at
    }));

    setModels(customModels);
  };

  const fetchPreferences = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('model_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setActiveModelId(data.selected_model_id);
    }
  };

  const handleSaveModel = async (name: string, photos: string[]) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-custom-model', {
        body: {
          action: 'create',
          modelName: name,
          photos,
          setActive: models.length === 0
        }
      });

      if (error) throw error;

      toast.success('Model created successfully!');
      await fetchModels();
      await fetchPreferences();
      setIsCreating(false);
    } catch (error: any) {
      console.error('Error creating model:', error);
      toast.error(error.message || 'Failed to create model');
    }
  };

  const handleSetActive = async (modelId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-custom-model', {
        body: {
          action: 'set-active',
          modelId
        }
      });

      if (error) throw error;

      setActiveModelId(modelId);
      toast.success('Active model updated!');
    } catch (error: any) {
      console.error('Error setting active model:', error);
      toast.error(error.message || 'Failed to update active model');
    }
  };

  const handleDelete = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const { error } = await supabase.functions.invoke('manage-custom-model', {
        body: {
          action: 'delete',
          modelId
        }
      });

      if (error) throw error;

      toast.success('Model deleted successfully!');
      await fetchModels();
      
      if (activeModelId === modelId) {
        setActiveModelId('emma');
      }
    } catch (error: any) {
      console.error('Error deleting model:', error);
      toast.error(error.message || 'Failed to delete model');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-2">
                Your Custom Models
              </h1>
              <p className="text-lg text-foreground-secondary">
                Create and manage personalized models for virtual try-on
              </p>
            </div>
            {!isCreating && (
              <Button
                onClick={() => setIsCreating(true)}
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-5 h-5" />
                Create New Model
              </Button>
            )}
          </div>

          {isCreating ? (
            <CustomModelCreator
              onSave={handleSaveModel}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <ModelManagementList
              models={models}
              activeModelId={activeModelId}
              onSetActive={handleSetActive}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Models;
