import { useState } from "react";
import { Upload, Sparkles, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { toast } from "sonner";
import ModeSelector from "@/components/photo/ModeSelector";
import ImageComparison from "@/components/photo/ImageComparison";
import LoadingState from "@/components/photo/LoadingState";

const PhotoEnhance = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"enhance" | "virtual-tryon">("enhance");
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = () => {
    setIsLoading(true);
    // Simulate processing - will be connected to backend later
    setTimeout(() => {
      setIsLoading(false);
      setEnhancedImage(selectedImage); // Placeholder - will be replaced with AI result
      toast.success(
        mode === "enhance" 
          ? "Photo enhanced! (Demo - backend integration coming next)" 
          : "Virtual try-on created! (Demo - backend integration coming next)"
      );
    }, 2000);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setEnhancedImage(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              {mode === "enhance" ? "Enhance Your Photos" : "Dress on Model"}
            </h1>
            <p className="text-lg text-foreground-secondary mb-6">
              {mode === "enhance" 
                ? "Upload your fashion item and we'll make it shine"
                : "See how your item looks on a professional model"}
            </p>
            {!selectedImage && (
              <div className="max-w-md mx-auto">
                <ModeSelector mode={mode} onModeChange={setMode} />
              </div>
            )}
          </div>

          {!selectedImage ? (
            <Card
              className={`border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-secondary/50"
                  : "border-border bg-card hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label className="cursor-pointer block p-16">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-foreground mb-2">
                      Drop your photo here, or click to browse
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                </div>
              </label>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Mode selector when image is selected */}
              <div className="max-w-md mx-auto mb-6">
                <ModeSelector mode={mode} onModeChange={setMode} />
              </div>

              {/* Image comparison or loading state */}
              {isLoading ? (
                <LoadingState mode={mode} />
              ) : (
                <ImageComparison 
                  originalImage={selectedImage} 
                  enhancedImage={enhancedImage}
                  mode={mode}
                />
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!enhancedImage ? (
                  <>
                    <Button
                      onClick={handleProcess}
                      size="lg"
                      disabled={isLoading}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105"
                    >
                      <Sparkles className="w-5 h-5" />
                      {mode === "enhance" ? "Enhance Photo" : "Dress on Model"}
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="lg"
                      disabled={isLoading}
                      className="border-border hover:bg-secondary"
                    >
                      Choose Different Photo
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleReset}
                      size="lg"
                      variant="outline"
                      className="gap-2 border-border hover:bg-secondary"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Start Over
                    </Button>
                    <Button
                      onClick={handleProcess}
                      size="lg"
                      variant="outline"
                      className="gap-2 border-border hover:bg-secondary"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate Again
                    </Button>
                    <Button
                      size="lg"
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PhotoEnhance;
