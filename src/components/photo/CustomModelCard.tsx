import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CustomModel } from "@/types/models";

interface CustomModelCardProps {
  model: CustomModel;
  isSelected: boolean;
  onSelect: () => void;
}

const CustomModelCard = ({ model, isSelected, onSelect }: CustomModelCardProps) => {
  return (
    <Card
      onClick={onSelect}
      className={`relative p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected
          ? "border-2 border-primary bg-secondary/50 shadow-lg"
          : "border-2 border-border hover:border-primary/50"
      }`}
    >
      {isSelected && (
        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
          Active
        </Badge>
      )}
      
      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-secondary">
        <img
          src={model.photos[0]}
          alt={model.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="space-y-1">
        <p className="font-heading font-semibold text-foreground">{model.name}</p>
        <Badge variant="secondary" className="text-xs">
          {model.photos.length} photo{model.photos.length > 1 ? "s" : ""}
        </Badge>
      </div>
    </Card>
  );
};

export default CustomModelCard;
