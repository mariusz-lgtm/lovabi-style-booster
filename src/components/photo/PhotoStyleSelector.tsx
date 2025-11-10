import { Camera, Building2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PhotoStyle } from "@/types/models";

interface PhotoStyleSelectorProps {
  selectedStyle: PhotoStyle;
  onStyleChange: (style: PhotoStyle) => void;
}

const PhotoStyleSelector = ({ selectedStyle, onStyleChange }: PhotoStyleSelectorProps) => {
  return (
    <Card className="p-6 bg-card">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Photo Style
      </h3>
      <RadioGroup 
        value={selectedStyle} 
        onValueChange={(value) => onStyleChange(value as PhotoStyle)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Label
          htmlFor="selfie"
          className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            selectedStyle === "selfie"
              ? "border-primary bg-secondary/50"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          <RadioGroupItem value="selfie" id="selfie" className="sr-only" />
          <Camera className={`w-8 h-8 ${selectedStyle === "selfie" ? "text-primary" : "text-foreground-secondary"}`} />
          <div className="text-center">
            <p className="font-heading font-semibold text-foreground mb-1">Selfie</p>
            <p className="text-sm text-foreground-secondary">
              Casual, natural lighting, authentic feel
            </p>
          </div>
        </Label>

        <Label
          htmlFor="studio"
          className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            selectedStyle === "studio"
              ? "border-primary bg-secondary/50"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          <RadioGroupItem value="studio" id="studio" className="sr-only" />
          <Building2 className={`w-8 h-8 ${selectedStyle === "studio" ? "text-primary" : "text-foreground-secondary"}`} />
          <div className="text-center">
            <p className="font-heading font-semibold text-foreground mb-1">Studio Photo</p>
            <p className="text-sm text-foreground-secondary">
              Professional setup, perfect lighting, polished look
            </p>
          </div>
        </Label>
      </RadioGroup>
    </Card>
  );
};

export default PhotoStyleSelector;
