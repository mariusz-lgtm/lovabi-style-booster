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
        model_photos (
          storage_path,
          photo_order
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
      return;
    }

    const customModels = await Promise.all(
      data.map(async (model: any) => {
        // Get generated portrait
        let generatedPortrait = '';
        if (model.generated_portrait_path) {
          const { data: signedUrl } = await supabase.storage
            .from('model-photos')
            .createSignedUrl(model.generated_portrait_path, 3600);
          
          if (signedUrl) {
            generatedPortrait = signedUrl.signedUrl;
          }
        }

        // Keep original photos for potential regeneration
        const sortedPhotos = model.model_photos
          .sort((a: any, b: any) => a.photo_order - b.photo_order);
        
        const photoUrls = await Promise.all(
          sortedPhotos.map(async (p: any) => {
            const { data: signedData } = await supabase.storage
              .from('model-photos')
              .createSignedUrl(p.storage_path, 3600);
            return signedData?.signedUrl || '';
          })
        );

        return {
          id: model.id,
          name: model.name,
          photos: photoUrls.filter(url => url !== ''),
          generatedPortrait,
          createdAt: model.created_at,
          gender: ((model as any).gender || 'female') as 'female' | 'male',
          age: model.age,
          bodyType: model.body_type,
          heightCm: model.height_cm,
          skinTone: model.skin_tone,
          hairDescription: model.hair_description,
          additionalNotes: model.additional_notes
        };
      })
    );

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

  const handleSaveModel = async (
    name: string, 
    photos: string[], 
    description: {
      gender: 'female' | 'male';
      age: number;
      bodyType: string;
      heightCm: number;
      skinTone: string;
      hairDescription: string;
      additionalNotes: string;
    }
  ) => {
    if (!user) return;
    
    setIsCreating(false);
    toast.info("Creating your custom model and generating AI portrait...");

    try {
      const { data, error } = await supabase.functions.invoke('manage-custom-model', {
        body: {
          action: 'create',
          modelName: name,
          photos,
          setActive: models.length === 0,
          gender: description.gender,
          age: description.age,
          bodyType: description.bodyType,
          heightCm: description.heightCm,
          skinTone: description.skinTone,
          hairDescription: description.hairDescription,
          additionalNotes: description.additionalNotes
        }
      });

      if (error) throw error;

      toast.success('Model portrait generated successfully!');
      await fetchModels();
      await fetchPreferences();
    } catch (error: any) {
      console.error('Error creating model:', error);
      toast.error(error.message || 'Failed to create model');
      setIsCreating(true);
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
      await fetchPreferences();
    } catch (error: any) {
      console.error('Error deleting model:', error);
      toast.error(error.message || 'Failed to delete model');
    }
  };

  const handleRegeneratePortrait = async (modelId: string) => {
    toast.info("Regenerating model portrait...");
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-custom-model', {
        body: {
          action: 'regenerate',
          modelId
        }
      });

      if (error) throw error;

      toast.success("Portrait regenerated successfully!");
      await fetchModels();
    } catch (error: any) {
      console.error('Error regenerating portrait:', error);
      toast.error(error.message || 'Failed to regenerate portrait');
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
              onRegeneratePortrait={handleRegeneratePortrait}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Models;
