import { useState, useEffect } from "react";
import { Upload, Camera, Sparkles, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { toast } from "sonner";
import ModeSelector from "@/components/photo/ModeSelector";
import ModelSelector from "@/components/photo/ModelSelector";
import PhotoStyleSelector from "@/components/photo/PhotoStyleSelector";
import BackgroundSelector from "@/components/photo/BackgroundSelector";
import SelectedModelPreview from "@/components/photo/SelectedModelPreview";
import ImageComparison from "@/components/photo/ImageComparison";
import LoadingState from "@/components/photo/LoadingState";
import { CameraPreviewDialog } from "@/components/photo/CameraPreviewDialog";
import { CustomModel, PhotoStyle, BackgroundType } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMigrateLocalStorage } from "@/hooks/useMigrateLocalStorage";

const PhotoEnhance = () => {
  const { session, user } = useAuth();
  useMigrateLocalStorage();
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"enhance" | "virtual-tryon">("enhance");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState("emma");
  const [photoStyle, setPhotoStyle] = useState<PhotoStyle>("studio");
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("white");
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchModels();
      fetchPreferences();
    }
  }, [user]);

  const fetchModels = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_models')
      .select(`
        *,
        model_photos (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching models:', error);
      return;
    }

    const customModels = await Promise.all(
      data.map(async (model) => {
        const sortedPhotos = model.model_photos
          .sort((a: any, b: any) => a.photo_order - b.photo_order);
        
        const photoUrls = await Promise.all(
          sortedPhotos.map(async (p: any) => {
            const { data: signedData } = await supabase.storage
              .from('model-photos')
              .createSignedUrl(p.storage_path, 3600);
            return signedData?.signedUrl || '';
          })
        );

        return {
          id: model.id,
          name: model.name,
          photos: photoUrls.filter(url => url !== ''),
          createdAt: model.created_at
        };
      })
    );

    setCustomModels(customModels);
  };

  const fetchPreferences = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('model_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSelectedModelId(data.selected_model_id);
      setPhotoStyle(data.photo_style as PhotoStyle);
      setBackgroundType((data.background_type as BackgroundType) || "white");
    }
  };

  useEffect(() => {
    if (user) {
      supabase.from('model_preferences').upsert({
        user_id: user.id,
        selected_model_id: selectedModelId,
        photo_style: photoStyle,
        background_type: backgroundType
      });
    }
  }, [selectedModelId, photoStyle, backgroundType, user]);

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

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCameraPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAcceptPhoto = () => {
    setSelectedImage(cameraPreview);
    setCameraPreview(null);
  };

  const handleRetake = () => {
    setCameraPreview(null);
    setTimeout(() => {
      document.getElementById('camera-input')?.click();
    }, 100);
  };

  const handleProcess = async () => {
    if (!selectedImage || !session) {
      toast.error('Please select an image and make sure you are logged in');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-photo-enhancement', {
        body: {
          imageBase64: selectedImage,
          mode,
          modelId: mode === 'virtual-tryon' ? selectedModelId : undefined,
          photoStyle: mode === 'virtual-tryon' ? photoStyle : undefined,
          backgroundType: mode === 'virtual-tryon' ? backgroundType : undefined
        }
      });

      if (error) throw error;

      setEnhancedImage(data.imageUrl);
      
      const modelName = customModels.find(m => m.id === selectedModelId)?.name 
        || selectedModelId.charAt(0).toUpperCase() + selectedModelId.slice(1);
      const message = mode === 'enhance'
        ? 'Photo enhanced successfully!'
        : `Virtual try-on created with ${modelName} in ${photoStyle} style${
            backgroundType ? ` on ${backgroundType} background` : ''
          }!`;
      
      toast.success(message);
    } catch (error: any) {
      console.error('Error processing image:', error);
      toast.error(error.message || 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setEnhancedImage(null);
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!enhancedImage) return;
    
    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = `lovabi-${mode}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image downloaded successfully!');
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
              <div className="p-16">
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-medium text-foreground mb-4">
                      Upload or capture your photo
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-input')?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Browse Files
                      </Button>
                      
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => document.getElementById('camera-input')?.click()}
                        className="gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </Button>
                    </div>
                    
                    <p className="text-sm text-foreground-secondary mt-4">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Mode selector when image is selected */}
              <div className="max-w-md mx-auto mb-6">
                <ModeSelector mode={mode} onModeChange={setMode} />
              </div>

              {/* Model and style selectors for virtual try-on */}
              {mode === "virtual-tryon" && (
                <div className="space-y-4 mb-6">
                  <ModelSelector
                    selectedModelId={selectedModelId}
                    onModelSelect={setSelectedModelId}
                    customModels={customModels}
                  />
                  <SelectedModelPreview 
                    selectedModelId={selectedModelId}
                    customModels={customModels}
                  />
                  <PhotoStyleSelector
                    selectedStyle={photoStyle}
                    onStyleChange={setPhotoStyle}
                  />
                  {mode === "virtual-tryon" && (
                    <BackgroundSelector
                      selectedBackground={backgroundType}
                      onBackgroundChange={setBackgroundType}
                    />
                  )}
                </div>
              )}

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
                      onClick={handleDownload}
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
          
          {cameraPreview && (
            <CameraPreviewDialog
              imagePreview={cameraPreview}
              onAccept={handleAcceptPhoto}
              onRetake={handleRetake}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default PhotoEnhance;
