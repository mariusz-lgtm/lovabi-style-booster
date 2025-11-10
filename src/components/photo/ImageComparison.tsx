import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ZoomIn } from "lucide-react";

interface ImageComparisonProps {
  originalImage: string;
  enhancedImage?: string;
  mode: "enhance" | "virtual-tryon";
}

const ImageComparison = ({ originalImage, enhancedImage, mode }: ImageComparisonProps) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card shadow-medium">
          <div className="mb-3">
            <Badge variant="secondary" className="mb-2">Original</Badge>
          </div>
          <div 
            className="relative group cursor-pointer"
            onClick={() => setZoomedImage(originalImage)}
          >
            <img
              src={originalImage}
              alt="Original item"
              className="w-full h-auto rounded-lg transition-opacity group-hover:opacity-90"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>
        
        {enhancedImage ? (
          <Card className="p-6 bg-card shadow-medium border-primary/20">
            <div className="mb-3">
              <Badge className="mb-2 bg-primary text-primary-foreground">
                {mode === "enhance" ? "Enhanced" : "On Model"}
              </Badge>
            </div>
            <div 
              className="relative group cursor-pointer"
              onClick={() => setZoomedImage(enhancedImage)}
            >
              <img
                src={enhancedImage}
                alt={mode === "enhance" ? "Enhanced item" : "Item on model"}
                className="w-full h-auto rounded-lg transition-opacity group-hover:opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                <ZoomIn className="w-8 h-8 text-white" />
              </div>
            </div>
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

      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-2">
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <img
              src={zoomedImage || ''}
              alt="Zoomed view"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageComparison;
