import { useState } from "react";
import { Upload, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const PhotoEnhance = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleEnhance = () => {
    toast.success("Photo enhanced! This will connect to AI in the next version.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              Enhance Your Photos
            </h1>
            <p className="text-lg text-foreground-secondary">
              Upload your fashion item and we'll make it shine
            </p>
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
              <Card className="p-6 bg-card shadow-medium">
                <img
                  src={selectedImage}
                  alt="Selected item"
                  className="w-full h-auto rounded-lg"
                />
              </Card>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleEnhance}
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground transition-all hover:scale-105"
                >
                  <Sparkles className="w-5 h-5" />
                  Enhance Photo
                </Button>
                <Button
                  onClick={() => setSelectedImage(null)}
                  variant="outline"
                  size="lg"
                  className="border-border hover:bg-secondary"
                >
                  Choose Different Photo
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PhotoEnhance;
