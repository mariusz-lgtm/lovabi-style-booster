import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Shirt } from "lucide-react";

interface ModeSelectorProps {
  mode: "enhance" | "virtual-tryon";
  onModeChange: (mode: "enhance" | "virtual-tryon") => void;
}

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  return (
    <Tabs value={mode} onValueChange={(value) => onModeChange(value as "enhance" | "virtual-tryon")}>
      <TabsList className="grid w-full grid-cols-2 bg-secondary">
        <TabsTrigger value="enhance" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Enhance Photo
        </TabsTrigger>
        <TabsTrigger value="virtual-tryon" className="gap-2">
          <Shirt className="w-4 h-4" />
          Dress on Model
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ModeSelector;
