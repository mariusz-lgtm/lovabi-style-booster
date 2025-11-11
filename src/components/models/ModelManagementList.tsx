import { Trash2, Star, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { CustomModel } from "@/types/models";

interface ModelManagementListProps {
  models: CustomModel[];
  activeModelId: string;
  onSetActive: (modelId: string) => void;
  onRegeneratePortrait: (modelId: string) => void;
  onDelete: (modelId: string) => void;
}

const ModelManagementList = ({ 
  models, 
  activeModelId,
  onSetActive,
  onRegeneratePortrait,
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

            <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-secondary relative">
              <img
                src={model.generatedPortrait || model.photos[0]}
                alt={model.name}
                className="w-full h-full object-cover"
              />
              {model.generatedPortrait && (
                <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                  AI Generated
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                  {model.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {model.photos.length} photo{model.photos.length > 1 ? "s" : ""}
                  </Badge>
                  {model.photos.length > 1 && (
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <button 
                          className="text-foreground-secondary hover:text-primary transition-colors p-1 rounded-sm hover:bg-secondary/50"
                          aria-label="Preview all photos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" align="start" className="w-80 p-4">
                        <p className="text-sm font-medium text-foreground mb-3">All Photos:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {model.photos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`${model.name} ${idx + 1}`}
                              className="w-full aspect-square object-cover rounded border border-border"
                            />
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
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
                  onClick={() => onRegeneratePortrait(model.id)}
                  size="sm"
                  variant="outline"
                  className="border-border hover:bg-secondary"
                  title="Regenerate AI portrait"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
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

          </Card>
        );
      })}
    </div>
  );
};

export default ModelManagementList;
