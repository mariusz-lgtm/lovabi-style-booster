import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PREDEFINED_MODELS } from "@/lib/mockModels";
import { CustomModel } from "@/types/models";

interface SelectedModelPreviewProps {
  selectedModelId: string;
  customModels: CustomModel[];
}

const SelectedModelPreview = ({ selectedModelId, customModels }: SelectedModelPreviewProps) => {
  const predefinedModel = PREDEFINED_MODELS.find(m => m.id === selectedModelId);
  const customModel = customModels.find(m => m.id === selectedModelId);
  
  const model = predefinedModel || customModel;
  if (!model) return null;

  const imageUrl = predefinedModel ? predefinedModel.imageUrl : (customModel!.generatedPortrait || customModel!.photos[0]);
  const modelName = predefinedModel ? predefinedModel.name : customModel!.name;
  const isCustom = !!customModel;

  return (
    <Card className="p-4 bg-secondary/30 border-primary/20">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
          <img
            src={imageUrl}
            alt={modelName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-heading font-semibold text-foreground">
              {modelName}
            </p>
            {isCustom && (
              <Badge variant="secondary" className="text-xs">
                Your Model
              </Badge>
            )}
          </div>
          <p className="text-xs text-foreground-secondary">
            Selected for virtual try-on
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SelectedModelPreview;
