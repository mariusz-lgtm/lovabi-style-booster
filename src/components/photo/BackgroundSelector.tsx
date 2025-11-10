import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home, Mountain, Square, Building2 } from "lucide-react";
import type { BackgroundType } from "@/types/models";

interface BackgroundSelectorProps {
  selectedBackground: BackgroundType;
  onBackgroundChange: (background: BackgroundType) => void;
}

const BACKGROUNDS = [
  {
    id: "white" as BackgroundType,
    label: "White/Plain",
    description: "Clean minimal background",
    icon: Square,
  },
  {
    id: "outdoor" as BackgroundType,
    label: "Outdoor",
    description: "Natural street setting",
    icon: Mountain,
  },
  {
    id: "studio-grey" as BackgroundType,
    label: "Studio Grey",
    description: "Professional grey backdrop",
    icon: Building2,
  },
  {
    id: "home-interior" as BackgroundType,
    label: "Home Interior",
    description: "Cozy indoor setting",
    icon: Home,
  },
];

const BackgroundSelector = ({ selectedBackground, onBackgroundChange }: BackgroundSelectorProps) => {
  return (
    <Card className="p-6 bg-card shadow-medium">
      <Label className="text-lg font-semibold mb-4 block">Background Setting</Label>
      <p className="text-sm text-foreground-secondary mb-4">
        Available only for your custom models
      </p>
      
      <RadioGroup
        value={selectedBackground}
        onValueChange={(value) => onBackgroundChange(value as BackgroundType)}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {BACKGROUNDS.map((bg) => {
          const Icon = bg.icon;
          return (
            <div key={bg.id} className="relative">
              <RadioGroupItem
                value={bg.id}
                id={bg.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={bg.id}
                className="flex flex-col items-start gap-2 p-4 rounded-lg border-2 border-border bg-background cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{bg.label}</span>
                </div>
                <span className="text-sm text-foreground-secondary">
                  {bg.description}
                </span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </Card>
  );
};

export default BackgroundSelector;
