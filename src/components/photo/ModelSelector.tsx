import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PREDEFINED_MODELS } from "@/lib/mockModels";
import { CustomModel } from "@/types/models";
import CustomModelCard from "./CustomModelCard";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  customModels: CustomModel[];
}

const ModelSelector = ({ selectedModelId, onModelSelect, customModels }: ModelSelectorProps) => {
  return (
    <Card className="p-6 bg-card">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Choose Your Model
      </h3>
      
      {/* Predefined Models */}
      <div className="mb-6">
        <p className="text-sm text-foreground-secondary mb-3">Predefined Models</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PREDEFINED_MODELS.map((model) => (
            <Card
              key={model.id}
              onClick={() => onModelSelect(model.id)}
              className={`relative p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedModelId === model.id
                  ? "border-2 border-primary bg-secondary/50 shadow-lg"
                  : "border-2 border-border hover:border-primary/50"
              }`}
            >
              {selectedModelId === model.id && (
                <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                  Active
                </Badge>
              )}
              
              <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-secondary">
                <img
                  src={model.imageUrl}
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-1">
                <p className="font-heading font-semibold text-foreground">{model.name}</p>
                <p className="text-sm text-foreground-secondary">{model.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Models */}
      {customModels.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-foreground-secondary mb-3">Your Custom Models</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {customModels.map((model) => (
              <CustomModelCard
                key={model.id}
                model={model}
                isSelected={selectedModelId === model.id}
                onSelect={() => onModelSelect(model.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create New Model Link */}
      <Link to="/models">
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed border-2 hover:border-primary hover:bg-secondary"
        >
          <Plus className="w-4 h-4" />
          {customModels.length > 0 ? "Create Another Model" : "Create Your Own Model"}
        </Button>
      </Link>
    </Card>
  );
};

export default ModelSelector;
