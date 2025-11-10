import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CustomModelCreatorProps {
  onSave: (name: string, photos: string[]) => void;
  onCancel: () => void;
}

const CustomModelCreator = ({ onSave, onCancel }: CustomModelCreatorProps) => {
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    if (photos.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPhotos((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a model name");
      return;
    }
    if (photos.length === 0) {
      toast.error("Please upload at least 1 photo");
      return;
    }
    onSave(name, photos);
  };

  return (
    <Card className="p-6 bg-card">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
        Create Custom Model
      </h2>

      <div className="space-y-6">
        {/* Name Input */}
        <div>
          <Label htmlFor="model-name" className="text-foreground mb-2">
            Model Name
          </Label>
          <Input
            id="model-name"
            placeholder="e.g., My Model"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background border-border"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <Label className="text-foreground mb-2">
            Photos (1-3 required)
          </Label>
          
          {photos.length < 3 && (
            <Card
              className={`border-2 border-dashed transition-all duration-200 mb-4 ${
                isDragging
                  ? "border-primary bg-secondary/50"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label className="cursor-pointer block p-8">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground mb-1">
                      Drop photos here, or click to browse
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      {3 - photos.length} more photo{3 - photos.length !== 1 ? "s" : ""} allowed
                    </p>
                  </div>
                </div>
              </label>
            </Card>
          )}

          {/* Photo Preview Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!name.trim() || photos.length === 0}
          >
            Save Model
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-border hover:bg-secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CustomModelCreator;
