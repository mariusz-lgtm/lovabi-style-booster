import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ImageComparisonProps {
  originalImage: string;
  enhancedImage?: string;
  mode: "enhance" | "virtual-tryon";
}

const ImageComparison = ({ originalImage, enhancedImage, mode }: ImageComparisonProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 bg-card shadow-medium">
        <div className="mb-3">
          <Badge variant="secondary" className="mb-2">Original</Badge>
        </div>
        <img
          src={originalImage}
          alt="Original item"
          className="w-full h-auto rounded-lg"
        />
      </Card>
      
      {enhancedImage ? (
        <Card className="p-6 bg-card shadow-medium border-primary/20">
          <div className="mb-3">
            <Badge className="mb-2 bg-primary text-primary-foreground">
              {mode === "enhance" ? "Enhanced" : "On Model"}
            </Badge>
          </div>
          <img
            src={enhancedImage}
            alt={mode === "enhance" ? "Enhanced item" : "Item on model"}
            className="w-full h-auto rounded-lg"
          />
        </Card>
      ) : (
        <Card className="p-6 bg-secondary/30 border-2 border-dashed border-border">
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <p className="text-foreground-secondary text-center">
              {mode === "enhance" 
                ? "Enhanced version will appear here" 
                : "Virtual try-on will appear here"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageComparison;
