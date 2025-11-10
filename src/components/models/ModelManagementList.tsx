import { Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomModel } from "@/types/models";

interface ModelManagementListProps {
  models: CustomModel[];
  activeModelId: string;
  onSetActive: (modelId: string) => void;
  onDelete: (modelId: string) => void;
}

const ModelManagementList = ({ 
  models, 
  activeModelId,
  onSetActive, 
  onDelete 
}: ModelManagementListProps) => {
  if (models.length === 0) {
    return (
      <Card className="p-12 bg-secondary/30 border-2 border-dashed border-border">
        <div className="text-center">
          <p className="text-lg text-foreground-secondary mb-2">
            No custom models yet
          </p>
          <p className="text-sm text-foreground-secondary">
            Create your first custom model to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map((model) => {
        const isActive = model.id === activeModelId;
        
        return (
          <Card key={model.id} className="p-4 bg-card relative group">
            {isActive && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground gap-1">
                <Star className="w-3 h-3" />
                Active
              </Badge>
            )}

            <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-secondary">
              <img
                src={model.photos[0]}
                alt={model.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                  {model.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {model.photos.length} photo{model.photos.length > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="flex gap-2">
                {!isActive && (
                  <Button
                    onClick={() => onSetActive(model.id)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-border hover:bg-secondary"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Set Active
                  </Button>
                )}
                <Button
                  onClick={() => onDelete(model.id)}
                  size="sm"
                  variant="outline"
                  className="border-border hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Preview other photos on hover */}
            {model.photos.length > 1 && (
              <div className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity p-4 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">All Photos:</p>
                <div className="grid grid-cols-3 gap-2">
                  {model.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`${model.name} ${idx + 1}`}
                      className="w-full aspect-square object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default ModelManagementList;
