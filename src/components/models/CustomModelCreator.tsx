import { useState } from "react";
import { Upload, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { CameraPreviewDialog } from "@/components/photo/CameraPreviewDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomModelCreatorProps {
  onSave: (name: string, photos: string[]) => void;
  onCancel: () => void;
}

const CustomModelCreator = ({ onSave, onCancel }: CustomModelCreatorProps) => {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);

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

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.75
    };

    try {
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = await imageCompression(file, options);
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Failed to compress image');
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    if (photos.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    setIsCompressing(true);

    try {
      const newPhotos = await Promise.all(
        files.map(async (file) => {
          if (!file.type.startsWith("image/")) {
            return null;
          }

          try {
            const compressedFile = await compressImage(file);
            
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(compressedFile);
            });
          } catch (error) {
            console.error('Error processing file:', error);
            return null;
          }
        })
      );

      const validPhotos = newPhotos.filter((photo): photo is string => photo !== null);
      
      if (validPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...validPhotos]);
        toast.success(`${validPhotos.length} photo${validPhotos.length !== 1 ? 's' : ''} added successfully`);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const availableSlots = 3 - photos.length;
    if (availableSlots === 0) {
      toast.error('You already have 3 photos');
      e.target.value = '';
      return;
    }

    setIsCompressing(true);
    try {
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCameraPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing camera photo:', error);
      toast.error('Failed to process photo');
    } finally {
      setIsCompressing(false);
    }
    
    e.target.value = '';
  };

  const handleAcceptPhoto = () => {
    if (cameraPreview) {
      setPhotos((prev) => [...prev, cameraPreview]);
      setCameraPreview(null);
      toast.success('Photo added successfully');
    }
  };

  const handleRetake = () => {
    setCameraPreview(null);
    setTimeout(() => {
      document.getElementById('camera-input')?.click();
    }, 100);
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
              <div className="p-8">
                <input
                  id="file-input-multi"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground mb-3">
                      Upload or capture photos
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-input-multi')?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Browse
                      </Button>
                      
                      {isMobile && (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => document.getElementById('camera-input')?.click()}
                          disabled={photos.length >= 3 || isCompressing}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-foreground-secondary mt-3">
                      {3 - photos.length} more photo{3 - photos.length !== 1 ? "s" : ""} allowed
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {cameraPreview && (
            <CameraPreviewDialog
              imagePreview={cameraPreview}
              onAccept={handleAcceptPhoto}
              onRetake={handleRetake}
            />
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
            disabled={!name.trim() || photos.length === 0 || isCompressing}
          >
            {isCompressing ? 'Compressing images...' : 'Save Model'}
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
