import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import CustomModelCreator from "@/components/models/CustomModelCreator";
import ModelManagementList from "@/components/models/ModelManagementList";
import { toast } from "sonner";
import {
  getCustomModels,
  addCustomModel,
  deleteCustomModel,
  getModelPreferences,
  saveModelPreferences
} from "@/lib/mockModels";
import { CustomModel } from "@/types/models";

const Models = () => {
  const [models, setModels] = useState<CustomModel[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeModelId, setActiveModelId] = useState("");

  useEffect(() => {
    setModels(getCustomModels());
    const prefs = getModelPreferences();
    setActiveModelId(prefs.selectedModelId);
  }, []);

  const handleSaveModel = (name: string, photos: string[]) => {
    const newModel = addCustomModel({ name, photos });
    setModels(getCustomModels());
    setIsCreating(false);
    toast.success(`${name} created successfully!`);
    
    // Automatically set as active
    handleSetActive(newModel.id);
  };

  const handleSetActive = (modelId: string) => {
    const prefs = getModelPreferences();
    saveModelPreferences({ ...prefs, selectedModelId: modelId });
    setActiveModelId(modelId);
    toast.success("Active model updated");
  };

  const handleDelete = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    deleteCustomModel(modelId);
    setModels(getCustomModels());
    toast.success(`${model?.name} deleted`);
    
    // If deleted model was active, reset to default
    if (modelId === activeModelId) {
      const prefs = getModelPreferences();
      saveModelPreferences({ ...prefs, selectedModelId: "emma" });
      setActiveModelId("emma");
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
